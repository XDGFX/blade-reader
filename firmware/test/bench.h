// Bench measurements for yoke B (#106, #107). Drives the multiplexer selects directly and reads
// both ADCs through ESPHome's adc sensors (raw, one sample per call). Results go to the log as
// lines starting "B|", one job step per call of tick(), so no step blocks the loop for long.
#pragma once
#include <cmath>
#include <vector>
#include "esphome.h"
#include "driver/gpio.h"
#include "esp_adc/adc_cali.h"
#include "esp_adc/adc_cali_scheme.h"
#include "esp_rom_sys.h"
#include "esp_timer.h"

namespace bench {

static const char *const TAG = "bench";
static const gpio_num_t SEL[4] = {GPIO_NUM_7, GPIO_NUM_10, GPIO_NUM_5, GPIO_NUM_6};
static const adc_channel_t ADC_CH[2] = {ADC_CHANNEL_4, ADC_CHANNEL_3};  // odd GPIO4, even GPIO3
static esphome::adc::ADCSensor *adcs[2] = {nullptr, nullptr};
static adc_cali_handle_t cali[2] = {nullptr, nullptr};
static bool ready = false;

static void init(esphome::adc::ADCSensor *odd, esphome::adc::ADCSensor *even) {
  if (ready) return;
  adcs[0] = odd;
  adcs[1] = even;
  gpio_config_t io = {};
  for (auto p : SEL) io.pin_bit_mask |= 1ULL << p;
  io.mode = GPIO_MODE_OUTPUT;
  gpio_config(&io);
  for (int m = 0; m < 2; m++) {
    adc_cali_curve_fitting_config_t c = {};
    c.unit_id = ADC_UNIT_1;
    c.chan = ADC_CH[m];
    c.atten = ADC_ATTEN_DB_12;
    c.bitwidth = ADC_BITWIDTH_DEFAULT;
    if (adc_cali_create_scheme_curve_fitting(&c, &cali[m]) != ESP_OK) ESP_LOGE(TAG, "no cali %d", m);
  }
  ready = true;
}

static inline void select(int ch) {
  for (int b = 0; b < 4; b++) gpio_set_level(SEL[b], (ch >> b) & 1);
}

static inline int read(int m) { return (int) adcs[m]->sample(); }

static int cal_mv(int m, int raw) {
  int mv = 0;
  adc_cali_raw_to_voltage(cali[m], raw, &mv);
  return mv;
}

// Calibrated volts for a fractional raw count, interpolated over ±64 counts.
static float to_v(int m, float raw) {
  int lo = std::max(0, (int) raw - 64), hi = std::min(4095, lo + 128);
  lo = hi - 128;
  return (cal_mv(m, lo) + (raw - lo) * (cal_mv(m, hi) - cal_mv(m, lo)) / 128.0f) / 1000.0f;
}

// Volts per count near a raw value.
static float slope(int m, float raw) {
  int lo = std::max(0, (int) raw - 256), hi = std::min(4095, lo + 512);
  lo = hi - 512;
  return (cal_mv(m, hi) - cal_mv(m, lo)) / 512.0f / 1000.0f;
}

static void settle_to(int ch, uint32_t us) {
  select(ch);
  esp_rom_delay_us(us);
}

static float mean_of(int m, int n) {
  int64_t s = 0;
  for (int i = 0; i < n; i++) s += read(m);
  return (float) s / n;
}

// ---- jobs ----------------------------------------------------------------------------------

enum Job { NONE, TIMING, NOISE, SETTLE, ZERO, SWEEP };
static Job job = NONE;
static int step = 0;
static int repeats = 0;
static int pass = 0;

static const int NS = 4096;
static int16_t buf[NS];

static void job_timing() {
  int64_t t0 = esp_timer_get_time();
  for (int i = 0; i < 2000; i++) read(0);
  int64_t t1 = esp_timer_get_time();
  for (int i = 0; i < 2000; i++) select(i & 15);
  int64_t t2 = esp_timer_get_time();
  for (int i = 0; i < 2000; i++) read(i & 1);
  int64_t t3 = esp_timer_get_time();
  ESP_LOGI(TAG, "B|timing|read_us=%.2f|select_us=%.2f|alt_read_us=%.2f", (t1 - t0) / 2000.0,
           (t2 - t1) / 2000.0, (t3 - t2) / 2000.0);
}

// One mux and channel per step: 4096 back-to-back samples after a 5 ms settle. Noise as the
// standard deviation of single samples and of block means of N.
static void job_noise() {
  int ch = step / 2, m = step % 2;
  settle_to(ch, 5000);
  int64_t t0 = esp_timer_get_time();
  for (int i = 0; i < NS; i++) buf[i] = read(m);
  int64_t dt = esp_timer_get_time() - t0;
  double s = 0;
  int mn = 4095, mx = 0;
  for (int i = 0; i < NS; i++) {
    s += buf[i];
    mn = std::min<int>(mn, buf[i]);
    mx = std::max<int>(mx, buf[i]);
  }
  double mean = s / NS;
  const int Ns[] = {1, 4, 16, 64, 256};
  char out[200];
  int k = 0;
  for (int n : Ns) {
    int blocks = NS / n;
    double ss = 0;
    for (int b = 0; b < blocks; b++) {
      double bs = 0;
      for (int i = 0; i < n; i++) bs += buf[b * n + i];
      double d = bs / n - mean;
      ss += d * d;
    }
    k += snprintf(out + k, sizeof(out) - k, "|sd%d=%.3f", n, std::sqrt(ss / (blocks - 1)));
  }
  ESP_LOGI(TAG, "B|noise|m=%d|ch=%d|raw=%.2f|v=%.4f|vpc=%.6f|min=%d|max=%d|us=%.2f%s", m, ch, mean,
           to_v(m, mean), slope(m, mean), mn, mx, (double) dt / NS, out);
  if (++step >= 32) job = NONE;
}

// Settling: from channel `from`, held 3 ms, switch to `to`, wait d µs, read once. 32 trials per
// delay, against a reference of 1024 samples after 20 ms. Also a trace of 48 back-to-back
// samples straight after the switch, averaged over 16 trials.
struct Pair {
  int m, from, to;
};
// On panel B ways 3, 4, 7 and 11 are live: odd 5 (way 3 voltage) and even 10 (way 4 voltage)
// sit at about 1.70 V, the worst case into a channel at 0 V.
static const Pair PAIRS[] = {{0, 5, 3},  {0, 5, 15}, {0, 15, 5}, {0, 0, 6}, {0, 6, 0}, {0, 0, 1},
                             {1, 10, 9}, {1, 10, 12}, {1, 12, 10}, {1, 0, 6}, {1, 6, 0}, {1, 0, 8}};
static const int NPAIRS = sizeof(PAIRS) / sizeof(PAIRS[0]);
static const uint32_t DELAYS[] = {0, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000};
static const int NDELAYS = sizeof(DELAYS) / sizeof(DELAYS[0]);

static void job_settle() {
  int p = step / (NDELAYS + 1), di = step % (NDELAYS + 1);
  const Pair &pr = PAIRS[p];
  settle_to(pr.to, 20000);
  float ref = mean_of(pr.m, 1024);
  settle_to(pr.from, 20000);
  float src = mean_of(pr.m, 256);
  if (di < NDELAYS) {
    uint32_t d = DELAYS[di];
    int64_t s = 0;
    for (int t = 0; t < 32; t++) {
      settle_to(pr.from, 3000);
      select(pr.to);
      if (d) esp_rom_delay_us(d);
      s += read(pr.m);
    }
    float mean = s / 32.0f;
    ESP_LOGI(TAG, "B|settle|m=%d|from=%d|to=%d|d=%u|ref_v=%.4f|src_v=%.4f|err_mv=%.2f", pr.m, pr.from,
             pr.to, (unsigned) d, to_v(pr.m, ref), to_v(pr.m, src), (to_v(pr.m, mean) - to_v(pr.m, ref)) * 1000);
  } else {
    static int32_t acc[48];
    static int64_t tacc[48];
    for (int i = 0; i < 48; i++) acc[i] = tacc[i] = 0;
    for (int t = 0; t < 16; t++) {
      settle_to(pr.from, 3000);
      int64_t t0 = esp_timer_get_time();
      select(pr.to);
      for (int i = 0; i < 48; i++) {
        acc[i] += read(pr.m);
        tacc[i] += esp_timer_get_time() - t0;
      }
    }
    char out[400];
    int k = 0;
    for (int i = 0; i < 48; i += 3)
      k += snprintf(out + k, sizeof(out) - k, " %lld:%.1f", tacc[i] / 16,
                    (to_v(pr.m, acc[i] / 16.0f) - to_v(pr.m, ref)) * 1000);
    ESP_LOGI(TAG, "B|trace|m=%d|from=%d|to=%d|us:err_mv%s", pr.m, pr.from, pr.to, out);
  }
  if (++step >= NPAIRS * (NDELAYS + 1)) job = NONE;
}

// Zeros: every channel of both muxes, 1024 samples each after 5 ms; one channel per step.
static void job_zero() {
  int ch = step;
  settle_to(ch, 5000);
  float o = mean_of(0, 1024), e = mean_of(1, 1024);
  ESP_LOGI(TAG, "B|zero|pass=%d|ch=%d|odd_v=%.4f|even_v=%.4f|odd_raw=%.2f|even_raw=%.2f", pass, ch,
           to_v(0, o), to_v(1, e), o, e);
  if (++step >= 16) {
    step = 0;
    if (++pass >= repeats) job = NONE;
  }
}

// Full sweeps: all 16 selects, both muxes, settle d and N samples each. Times one sweep and
// reports the worst error against the slow zero of each channel.
static void job_sweep() {
  static const uint32_t SD[] = {0, 50, 200, 500, 1000, 2000, 1000, 500};
  static const int SN[] = {1, 16, 16, 16, 16, 16, 64, 64};
  static float slow[2][16];
  if (step == 0) {
    for (int ch = 0; ch < 16; ch++) {
      settle_to(ch, 10000);
      slow[0][ch] = to_v(0, mean_of(0, 512));
      slow[1][ch] = to_v(1, mean_of(1, 512));
    }
  }
  uint32_t d = SD[step];
  int n = SN[step];
  float v[2][16];
  int64_t t0 = esp_timer_get_time();
  for (int ch = 0; ch < 16; ch++) {
    select(ch);
    if (d) esp_rom_delay_us(d);
    v[0][ch] = mean_of(0, n);
    v[1][ch] = mean_of(1, n);
  }
  int64_t dt = esp_timer_get_time() - t0;
  float worst = 0;
  int wm = 0, wc = 0;
  for (int m = 0; m < 2; m++)
    for (int ch = 0; ch < 16; ch++) {
      float e = std::fabs(to_v(m, v[m][ch]) - slow[m][ch]);
      if (e > worst) worst = e, wm = m, wc = ch;
    }
  ESP_LOGI(TAG, "B|sweep|d=%u|n=%d|ms=%.2f|worst_mv=%.2f|at_m=%d|at_ch=%d", (unsigned) d, n, dt / 1000.0,
           worst * 1000, wm, wc);
  if (++step >= (int) (sizeof(SN) / sizeof(SN[0]))) job = NONE;
}

static void start(Job j, int r = 1) {
  job = j;
  step = 0;
  pass = 0;
  repeats = r;
  ESP_LOGI(TAG, "B|start|job=%d|repeats=%d", (int) j, r);
}

static void tick() {
  if (!ready) return;
  switch (job) {
    case TIMING:
      job_timing();
      job = NONE;
      break;
    case NOISE:
      job_noise();
      break;
    case SETTLE:
      job_settle();
      break;
    case ZERO:
      job_zero();
      break;
    case SWEEP:
      job_sweep();
      break;
    default:
      return;
  }
  if (job == NONE) ESP_LOGI(TAG, "B|done");
}

// Monitor for #107 and #62: one select per call, 2 ms settle, 256 samples on each mux. Every
// 10 s the means of all 32 channels go to the log and to a RAM ring (0.1 mV units), so a
// radio-idle stretch can be read back afterwards with dump.
static const int RING = 720;  // two hours of 10 s records
static const int COLS = 34;   // 16 odd, 16 even, ESP32 temperature x100, uptime s
static int16_t ring[RING][COLS];
static int ring_n = 0;
static int mon_ch = 0;
static int64_t mon_sum[2][16];
static int32_t mon_cnt[16];
static int64_t mon_t0 = 0;
static float last_v[2][16];
static int dump_i = -1;

static void log_rec(const char *kind, int i, const int16_t *r) {
  char out[320];
  int k = snprintf(out, sizeof(out), "B|%s|i=%d|t=%d|esp=%d|v=", kind, i, r[33], r[32]);
  for (int c = 0; c < 32; c++) k += snprintf(out + k, sizeof(out) - k, c ? ",%d" : "%d", r[c]);
  ESP_LOGI(TAG, "%s", out);
}

static void monitor(float esp_c) {
  if (!ready || job != NONE || dump_i >= 0) return;
  int64_t now = esp_timer_get_time();
  if (mon_t0 == 0) mon_t0 = now;
  settle_to(mon_ch, 2000);
  for (int m = 0; m < 2; m++)
    for (int i = 0; i < 256; i++) mon_sum[m][mon_ch] += read(m);
  mon_cnt[mon_ch] += 256;
  mon_ch = (mon_ch + 1) & 15;
  if (now - mon_t0 < 10000000 || mon_ch != 0) return;
  int16_t r[COLS];
  for (int m = 0; m < 2; m++)
    for (int c = 0; c < 16; c++) {
      last_v[m][c] = to_v(m, (float) mon_sum[m][c] / mon_cnt[c]);
      r[m * 16 + c] = (int16_t) lroundf(last_v[m][c] * 10000);
    }
  r[32] = (int16_t) lroundf(esp_c * 100);
  r[33] = (int16_t) (now / 1000000);
  if (ring_n < RING) memcpy(ring[ring_n++], r, sizeof(r));
  log_rec("mon", ring_n - 1, r);
  memset(mon_sum, 0, sizeof(mon_sum));
  memset(mon_cnt, 0, sizeof(mon_cnt));
  mon_t0 = now;
}

static void dump_tick() {
  if (dump_i < 0) return;
  if (dump_i >= ring_n) {
    ESP_LOGI(TAG, "B|dumpdone|n=%d", ring_n);
    dump_i = -1;
    return;
  }
  log_rec("rec", dump_i, ring[dump_i]);
  dump_i++;
}

static float deg(float v) { return 25.0f + (0.59f - v) / 0.002f; }

}  // namespace bench
