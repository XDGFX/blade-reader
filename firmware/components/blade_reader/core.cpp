#include "core.h"

#include <cmath>
#include <cstring>

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

// How the fault text names each kind of way fault, after `Way n `.
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
  bool full = false;
  // Home Assistant drops a text state over 255 characters, so a list that won't fit ends in `…`.
  auto add = [&text, &full](const std::string &fault) {
    if (full) return;
    std::string next = text + (text.empty() ? "" : "; ") + fault;
    if (next.size() + std::strlen("; …") > FAULT_TEXT_MAX) {
      text += "; …";
      full = true;
    } else {
      text = next;
    }
  };
  if (faults.over_temperature) {
    add("Over temperature " + std::to_string(static_cast<int>(std::lround(faults.hottest_c))) + " °C");
  }
  for (int w = 0; w < WAYS; w++) {
    for (int kind = 0; kind < WAY_FAULT_KINDS; kind++) {
      if (faults.way[w][kind]) add("Way " + std::to_string(w + 1) + " " + WAY_FAULT_TEXT[kind]);
    }
  }
  if (!text.empty()) return text;
  return faults.no_supply ? "No supply" : "OK";
}

Readings Core::on_sweep(const Sweep &sweep) {
  Readings r{};
  for (int w = 0; w < WAYS; w++) {
    WayReading &way = r.way[w];
    way.current_a = current_a(w, sensor_out_mv(w, sweep.sense_mv[w]), NOMINAL_ZERO_MV);
    way.voltage_v = sweep.voltage_mv[w] * VOLTAGE_DIVIDER / 1000.0f;
    way.power_w = way.voltage_v * way.current_a;
    bool live = still_live(live_[w], way.voltage_v);
    if (live != live_[w]) changed_at_ms_[w] = sweep.now_ms;
    live_[w] = live;
  }
  for (int d = 0; d < DIODES; d++) {
    r.diode_c[d] = 25.0f + (sweep.vbe_mv[d] - VBE_AT_25C_MV) / VBE_MV_PER_C;
  }
  update_faults_(sweep, r);
  r.faults = faults_;
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
