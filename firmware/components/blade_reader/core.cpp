#include "core.h"

#include <cmath>

namespace blade_core {

namespace {

bool on_even_arm(int way_index) { return (way_index + 1) % 2 == 0; }

// The sensor's output, undoing the even arm's divider.
float sensor_out_mv(int way_index, float sense_mv) {
  return on_even_arm(way_index) ? sense_mv / EVEN_ARM_DIVIDER : sense_mv;
}

// The odd arm's sensors are fitted so their output falls with load, the even arm's so it rises.
float current_a(int way_index, float out_mv, float zero_mv) {
  float rise_mv = on_even_arm(way_index) ? out_mv - zero_mv : zero_mv - out_mv;
  return rise_mv / GAIN_MV_PER_A;
}

// Written so NaN fails too.
bool gain_trim_allowed(float trim) { return trim >= GAIN_TRIM_MIN && trim <= GAIN_TRIM_MAX; }

bool still_live(bool was_live, float voltage_v) {
  if (voltage_v >= LIVE_V) return true;
  if (voltage_v < DEAD_V) return false;
  return was_live;
}

float median_live_voltage_v(const Readings &r, const bool is_live[WAYS]) {
  // Kept sorted as it fills: std::sort here trips a false -Warray-bounds in the ESP32's GCC.
  float live[WAYS];
  int n = 0;
  for (int w = 0; w < WAYS; w++) {
    if (!is_live[w]) continue;
    int i = n++;
    for (; i > 0 && live[i - 1] > r.way[w].voltage_v; i--) live[i] = live[i - 1];
    live[i] = r.way[w].voltage_v;
  }
  if (n == 0) return 0.0f;
  return n % 2 == 1 ? live[n / 2] : (live[n / 2 - 1] + live[n / 2]) / 2.0f;
}

// How the fault text names each kind of way fault, after the ways that have it.
constexpr const char *WAY_FAULT_TEXT[] = {"blown", "over range"};
static_assert(sizeof(WAY_FAULT_TEXT) / sizeof(WAY_FAULT_TEXT[0]) == WAY_FAULT_KINDS,
              "every way fault needs its text");

}  // namespace

bool Faults::any() const {
  if (over_temperature) return true;
  for (const auto &kinds : way)
    for (bool fault : kinds)
      if (fault) return true;
  return false;
}

std::string fault_text(const Faults &faults) {
  std::string text;
  auto add = [&text](const std::string &part) { text += (text.empty() ? "" : "; ") + part; };
  if (faults.no_supply) add("No supply");
  if (faults.over_temperature) {
    add("Over temperature " + std::to_string(static_cast<int>(std::lround(faults.hottest_c))) + " °C");
  }
  for (int kind = 0; kind < WAY_FAULT_KINDS; kind++) {
    std::string ways;
    int count = 0;
    for (int w = 0; w < WAYS; w++) {
      if (!faults.way[w][kind]) continue;
      ways += (count++ == 0 ? "" : ", ") + std::to_string(w + 1);
    }
    if (count > 0) add((count == 1 ? "Way " : "Ways ") + ways + " " + WAY_FAULT_TEXT[kind]);
  }
  return text.empty() ? "OK" : text;
}

Led led_for(const LedCauses &causes) {
  if (causes.zeroing) return LED_FAST_BLINK;
  if (causes.fault) return LED_STEADY;
  if (causes.install_blink) return LED_SLOW_BLINK;
  return LED_OFF;
}

bool led_lit(Led led, uint32_t now_ms) {
  switch (led) {
    case LED_FAST_BLINK:
      return now_ms % FAST_BLINK_MS < FAST_BLINK_MS / 2;
    case LED_SLOW_BLINK:
      return now_ms % SLOW_BLINK_MS < SLOW_BLINK_MS / 2;
    case LED_STEADY:
      return true;
    case LED_OFF:
      break;
  }
  return false;
}

Readings Core::on_sweep(const Sweep &sweep) {
  Readings r{};
  track_vbe_(sweep);
  for (int w = 0; w < WAYS; w++) {
    WayReading &way = r.way[w];
    float out_mv = sensor_out_mv(w, sweep.sense_mv[w]);
    way.current_a = current_a(w, out_mv, zero_now_mv_(w)) * records_[w].gain_trim;
    way.voltage_v = sweep.voltage_mv[w] * VOLTAGE_DIVIDER / 1000.0f;
    way.power_w = way.voltage_v * way.current_a;
    bool live = still_live(live_[w], way.voltage_v);
    if (live != live_[w]) changed_at_ms_[w] = sweep.now_ms;
    live_[w] = live;
    way.new_zero = track_zero_(w, sweep, out_mv);
    if (way.new_zero) way.self_check = self_checks_[w];
  }
  integrate_energy_(r, sweep.now_ms);
  for (int d = 0; d < DIODES; d++) {
    r.diode_c[d] = diode_c(sweep.vbe_mv[d]);
  }
  update_faults_(sweep, r);
  r.faults = faults_;
  update_install_mode_(sweep.now_ms);
  LedCauses causes{false, faults_.any(), false};
  for (int w = 0; w < WAYS; w++) {
    causes.zeroing |= zeroing_[w].samples > 0;
    causes.install_blink |= install_mode_ && live_[w] && !records_[w].zero.taken;
  }
  r.led = led_for(causes);
  r.panel_voltage_v = median_live_voltage_v(r, live_);
  for (int i = 0; i < SPARES; i++) r.spare_mv[i] = sweep.spare_mv[i];

  for (int w = 0; w < WAYS; w++) {
    WayReading &way = r.way[w];
    Published &last = way_published_[w];
    bool changed = std::fabs(way.current_a - last.current_a) > CURRENT_STEP_A ||
                   std::fabs(way.voltage_v - last.voltage_v) > VOLTAGE_STEP_V;
    way.publish = due_(last, sweep.now_ms, changed);
    if (way.publish) {
      last.current_a = way.current_a;
      last.voltage_v = way.voltage_v;
    }
  }

  bool changed = std::fabs(r.panel_voltage_v - board_published_.panel_voltage_v) > VOLTAGE_STEP_V;
  for (int d = 0; d < DIODES; d++) {
    changed |= std::fabs(r.diode_c[d] - board_published_.diode_c[d]) > TEMPERATURE_STEP_C;
  }
  r.publish_board = due_(board_published_, sweep.now_ms, changed);
  if (r.publish_board) {
    board_published_.panel_voltage_v = r.panel_voltage_v;
    for (int d = 0; d < DIODES; d++) board_published_.diode_c[d] = r.diode_c[d];
  }
  return r;
}

// A zero ZERO_DEAD_MS into each dead spell, then every REZERO_EVERY_MS while the way stays dead.
// True on the sweep that takes a zero.
bool Core::track_zero_(int w, const Sweep &sweep, float out_mv) {
  Zeroing &z = zeroing_[w];
  if (live_[w]) {
    z = {};
    return false;
  }
  if (!z.dead) {
    z.dead = true;
    z.since_ms = sweep.now_ms;
  }
  uint32_t waited_ms = sweep.now_ms - z.since_ms;
  if (waited_ms < z.wait_ms) return false;
  if (waited_ms < z.wait_ms + ZERO_MEAN_MS) {
    z.samples++;
    z.sum_mv += out_mv;
    z.sum_vbe_mv += vbe_mv_;
    return false;
  }
  int samples = z.samples;
  double sum_mv = z.sum_mv, sum_vbe_mv = z.sum_vbe_mv;
  // The next zero lands REZERO_EVERY_MS after this one.
  z.since_ms = sweep.now_ms;
  z.wait_ms = REZERO_EVERY_MS - ZERO_MEAN_MS;
  z.samples = 0;
  z.sum_mv = z.sum_vbe_mv = 0;
  if (samples == 0) return false;
  Zero taken{true, float(sum_mv / samples), float(sum_vbe_mv / samples), sweep.now_ms / 1000};
  self_checks_[w] = learn_tempco_(w, taken);
  records_[w].zero = taken;
  save_(w);
  return true;
}

// Smooths the Vbe that temperature tracking follows, starting from the first sweep's.
void Core::track_vbe_(const Sweep &sweep) {
  float raw_mv = sweep.vbe_mv[DIODE_EVEN_ARM];
  if (raw_mv < VBE_PLAUSIBLE_MIN_MV || raw_mv > VBE_PLAUSIBLE_MAX_MV) raw_mv = sweep.vbe_mv[DIODE_CHIN];
  if (!vbe_tracked_) {
    vbe_mv_ = raw_mv;
    vbe_tracked_ = true;
  } else {
    float dt_ms = float(sweep.now_ms - vbe_at_ms_);
    vbe_mv_ += (raw_mv - vbe_mv_) * (1.0 - std::exp(-double(dt_ms) / VBE_SMOOTHING_MS));
  }
  vbe_at_ms_ = sweep.now_ms;
}

// zero_now = zero + tempco × ΔT, with ΔT from the Vbe now and at the zero. An unzeroed way reads
// against the nominal zero.
float Core::zero_now_mv_(int w) const {
  const WayRecord &record = records_[w];
  if (!record.zero.taken) return NOMINAL_ZERO_MV;
  float k = (vbe_mv_ - record.zero.vbe_mv) / VBE_MV_PER_C;
  return record.zero.mv + record.tempco.applied_ma_per_k() * k * GAIN_MV_PER_A / 1000.0f;
}

bool SelfCheck::worse() const {
  return std::fabs(measured_mv - predicted_mv) > std::fabs(measured_mv - uncorrected_mv);
}

// A re-zero far enough in temperature from the stored zero checks the tempco's prediction, and
// further still is a sample of it. Two checks in a row worse than no correction reset it.
SelfCheck Core::learn_tempco_(int w, const Zero &taken) {
  const Zero &stored = records_[w].zero;
  if (!stored.taken) return {};
  float k = (taken.vbe_mv - stored.vbe_mv) / VBE_MV_PER_C;
  Tempco &tempco = records_[w].tempco;
  SelfCheck check{};
  if (std::fabs(k) >= SELF_CHECK_MIN_K) {
    float predicted_mv = stored.mv + tempco.ma_per_k * k * GAIN_MV_PER_A / 1000.0f;
    check = {true, k, taken.mv, predicted_mv, stored.mv};
    tempco.self_check_streak = check.worse() ? tempco.self_check_streak + 1 : 0;
    if (tempco.self_check_streak >= SELF_CHECK_RESET_AFTER) tempco = {};
  }
  if (std::fabs(k) < TEMPCO_SAMPLE_MIN_K) return check;
  float sample = (taken.mv - stored.mv) / k / GAIN_MV_PER_A * 1000.0f;
  float blended = tempco.ma_per_k + TEMPCO_BLEND * (sample - tempco.ma_per_k);
  tempco.ma_per_k = std::fmax(-TEMPCO_LIMIT_MA_PER_K, std::fmin(TEMPCO_LIMIT_MA_PER_K, blended));
  for (int i = TEMPCO_CONFIDENT_SAMPLES - 1; i > 0; i--) tempco.recent[i] = tempco.recent[i - 1];
  tempco.recent[0] = sample;
  if (tempco.samples < UINT8_MAX) tempco.samples++;
  return check;
}

float Tempco::applied_ma_per_k() const {
  if (samples < TEMPCO_CONFIDENT_SAMPLES) return 0.0f;
  float lowest = recent[0], highest = recent[0];
  for (float sample : recent) {
    lowest = std::fmin(lowest, sample);
    highest = std::fmax(highest, sample);
  }
  bool one_sign = lowest > 0.0f || highest < 0.0f;
  return one_sign && highest - lowest <= TEMPCO_AGREE_MA_PER_K ? ma_per_k : 0.0f;
}

// Each way's power over the time since the last sweep. The first sweep has nothing to span.
void Core::integrate_energy_(Readings &r, uint32_t now_ms) {
  uint32_t span_ms = now_ms - last_sweep_ms_;
  bool first = !swept_;
  swept_ = true;
  last_sweep_ms_ = now_ms;
  for (int w = 0; w < WAYS; w++) {
    if (!first) {
      double mws = energy_carry_mws_[w] + double(r.way[w].power_w) * span_ms;
      int64_t whole = std::llround(mws);
      energy_[w].mws += whole;
      energy_carry_mws_[w] = mws - double(whole);
      if (whole != 0 && storage_ != nullptr) storage_->stage({RECORD_ENERGY, w}, encode(energy_[w]));
    }
    r.way[w].energy_wh = float(double(energy_[w].mws) / MWS_PER_WH);
  }
}

std::string Core::not_zeroed() const {
  std::string ways;
  for (int w = 0; w < WAYS; w++) {
    if (records_[w].zero.taken) continue;
    ways += (ways.empty() ? "" : ", ") + std::to_string(w + 1);
  }
  return ways.empty() ? "None" : "Not zeroed: " + ways;
}

void Core::start(Storage &storage) {
  storage_ = &storage;
  for (int w = 0; w < WAYS; w++) {
    RecordBytes bytes;
    records_[w] = storage.load({RECORD_WAY, w}, bytes) ? decode_way(bytes) : WayRecord{};
    gain_trim_rejected_[w] = !gain_trim_allowed(records_[w].gain_trim);
    if (gain_trim_rejected_[w]) {
      rejected_gain_trims_[w] = records_[w].gain_trim;
      records_[w].gain_trim = WayRecord{}.gain_trim;
    }
    energy_[w] = storage.load({RECORD_ENERGY, w}, bytes) ? decode_energy(bytes) : EnergyRecord{};
  }
}

void Core::save_(int w) {
  if (storage_ != nullptr) storage_->save({RECORD_WAY, w}, encode(records_[w]));
}

bool Core::set_gain_trim(int w, float trim) {
  if (!gain_trim_allowed(trim)) return false;
  records_[w].gain_trim = trim;
  save_(w);
  return true;
}

void Core::clear_faults() {
  faults_.over_temperature = false;
  for (int w = 0; w < WAYS; w++) {
    for (bool &fault : faults_.way[w]) fault = false;
    if (!live_[w]) been_live_[w] = false;
  }
}

void Core::update_faults_(const Sweep &sweep, const Readings &r) {
  uint32_t now_ms = sweep.now_ms;
  float hottest_c = r.diode_c[0];
  for (float c : r.diode_c) hottest_c = std::fmax(hottest_c, c);
  faults_.hottest_c = hottest_c;
  if (hottest_c >= over_temperature_c_) {
    faults_.over_temperature = true;
  } else if (hottest_c <= over_temperature_c_ - OVER_TEMPERATURE_CLEARS_K) {
    faults_.over_temperature = false;
  }

  for (int w = 0; w < WAYS; w++) {
    bool over = std::fabs(r.way[w].current_a) > OVER_RANGE_A;
    bool clipped = sweep.sense_clipped[w];
    if (over && !over_[w]) over_since_ms_[w] = now_ms;
    over_[w] = over;
    if (over || clipped) out_of_range_at_ms_[w] = now_ms;
    if (clipped || (over && now_ms - over_since_ms_[w] >= OVER_RANGE_AFTER_MS)) {
      faults_.way[w][WAY_OVER_RANGE] = true;
    } else if (now_ms - out_of_range_at_ms_[w] >= OVER_RANGE_CLEARS_AFTER_MS) {
      faults_.way[w][WAY_OVER_RANGE] = false;
    }
  }

  bool any_live = false;
  for (bool live : live_) any_live |= live;
  faults_.no_supply = !any_live;
  if (faults_.no_supply) {
    // Starts afresh, as if just booted, when a way comes back.
    for (int w = 0; w < WAYS; w++) {
      been_live_[w] = false;
      faults_.way[w][WAY_BLOWN] = false;
    }
    return;
  }
  for (int w = 0; w < WAYS; w++) {
    uint32_t held_ms = now_ms - changed_at_ms_[w];
    if (live_[w]) {
      been_live_[w] = true;
      if (held_ms >= BLOWN_CLEARS_AFTER_MS) faults_.way[w][WAY_BLOWN] = false;
    } else if (been_live_[w] && held_ms >= BLOWN_AFTER_MS) {
      faults_.way[w][WAY_BLOWN] = true;
    }
  }
}

// Once ended it stays ended until the next boot, even when the millisecond clock wraps.
void Core::update_install_mode_(uint32_t now_ms) {
  bool any_unzeroed = false;
  for (const WayRecord &record : records_) any_unzeroed |= !record.zero.taken;
  if (!any_unzeroed || now_ms >= INSTALL_MODE_MS) install_mode_ended_ = true;
  install_mode_ = !install_mode_ended_;
}

bool Core::due_(Published &last, uint32_t now_ms, bool changed) {
  uint32_t since_ms = now_ms - last.at_ms;
  bool due = !last.ever || since_ms >= PUBLISH_EVERY_MS || (changed && since_ms >= PUBLISH_MIN_MS);
  if (due) {
    last.ever = true;
    last.at_ms = now_ms;
  }
  return due;
}

}  // namespace blade_core
