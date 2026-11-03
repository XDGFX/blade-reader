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

}  // namespace

Readings Core::on_sweep(const Sweep &sweep) {
  Readings r{};
  for (int w = 0; w < WAYS; w++) {
    WayReading &way = r.way[w];
    const Zero &zero = records_[w].zero;
    float out_mv = sensor_out_mv(w, sweep.sense_mv[w]);
    way.current_a = current_a(w, out_mv, zero.taken ? zero.mv : NOMINAL_ZERO_MV);
    way.voltage_v = sweep.voltage_mv[w] * VOLTAGE_DIVIDER / 1000.0f;
    way.power_w = way.voltage_v * way.current_a;
    live_[w] = still_live(live_[w], way.voltage_v);
    way.new_zero = track_zero_(w, sweep, out_mv);
  }
  r.panel_voltage_v = median_live_voltage_v(r, live_);
  for (int d = 0; d < DIODES; d++) {
    r.diode_c[d] = diode_c(sweep.vbe_mv[d]);
  }
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

// One zero per dead spell: a way that stays dead isn't zeroed again until it has been live.
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
  if (z.done) return false;
  uint32_t dead_ms = sweep.now_ms - z.since_ms;
  if (dead_ms < ZERO_DEAD_MS) return false;
  if (dead_ms < ZERO_DEAD_MS + ZERO_MEAN_MS) {
    z.samples++;
    z.sum_mv += out_mv;
    z.sum_vbe_mv += sweep.vbe_mv[DIODE_EVEN_ARM];
    return false;
  }
  z.done = true;
  if (z.samples == 0) return false;
  records_[w].zero = {true, float(z.sum_mv / z.samples), float(z.sum_vbe_mv / z.samples),
                      sweep.now_ms / 1000};
  save_(w);
  return true;
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
  }
}

void Core::save_(int w) {
  if (storage_ != nullptr) storage_->save({RECORD_WAY, w}, encode(records_[w]));
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
