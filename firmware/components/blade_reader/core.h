#pragma once

// The blade_reader core: everything the yoke works out, with no ESPHome or ESP-IDF in it.
// The glue hands it each finished sweep and publishes what it returns.

#include <cmath>
#include <cstdint>
#include <string>

#include "constants.h"
#include "core_record.h"

namespace blade_core {

enum Diode { DIODE_CHIN, DIODE_ODD_ARM, DIODE_EVEN_ARM, DIODES };
enum Spare { SPARE_ODD_ARM, SPARE_EVEN_ARM, SPARES };

// One finished sweep, as read at the ADC pins. Way arrays are indexed by way number − 1.
struct Sweep {
  uint32_t now_ms;
  float sense_mv[WAYS];
  // A sample of the way's sense line was at the ADC rail.
  bool sense_clipped[WAYS];
  float voltage_mv[WAYS];
  float vbe_mv[DIODES];
  float spare_mv[SPARES];
};

// A re-zero at least SELF_CHECK_MIN_K from the stored zero checks the tempco: the zero it
// measured against the one the tempco predicted and the stored one, all in output mV.
struct SelfCheck {
  bool done;
  float k;
  float measured_mv, predicted_mv, uncorrected_mv;

  // The tempco did worse than no correction.
  bool worse() const;
};

// What one sweep works out. The glue publishes a group only when its publish flag is set, and
// then every reading in it, so current and power always go together.
struct WayReading {
  bool publish;
  float current_a;
  float power_w;
  float voltage_v;
  // The way is live, by LIVE_V and DEAD_V. The glue publishes it on change, whatever `publish` says.
  bool live;
  // The way's energy total, published with the group.
  float energy_wh;
  // This sweep took a new zero, now in the way's record and saved.
  bool new_zero;
  // The self-check this sweep's new zero made, if any.
  SelfCheck self_check;
};

// Each kind of way fault, in the order the fault text lists them.
enum WayFault { WAY_BLOWN, WAY_OVER_RANGE, WAY_FAULT_KINDS };

struct Faults {
  // No way is live, so the yoke is on USB alone. It is not a fault in itself.
  bool no_supply;
  // The hottest diode has reached the over-temperature threshold.
  bool over_temperature;
  float hottest_c;
  bool way[WAYS][WAY_FAULT_KINDS];

  // Any fault active, which lights the red LED steady.
  bool any() const;
};

// `OK`, or every part joined by `; `: No supply, over temperature, then each kind of way fault
// with the ways that have it, e.g. `Ways 3, 7 blown`. The longest fits in FAULT_TEXT_MAX.
std::string fault_text(const Faults &faults);

enum Led { LED_OFF, LED_SLOW_BLINK, LED_STEADY, LED_FAST_BLINK };

// What can light the red LED.
struct LedCauses {
  // A zero is being taken on some way.
  bool zeroing;
  // Any fault is active.
  bool fault;
  // Install mode, and a live way is still unzeroed.
  bool install_blink;
};

// The red LED's pattern: the highest-priority cause wins.
Led led_for(const LedCauses &causes);

// Whether the red LED is lit at now_ms under its pattern. The glue calls it every loop, as a
// sweep is too slow to time a blink.
bool led_lit(Led led, uint32_t now_ms);

struct Readings {
  WayReading way[WAYS];
  Faults faults;
  bool publish_board;
  float panel_voltage_v;
  float diode_c[DIODES];
  float spare_mv[SPARES];
  // The red LED's pattern.
  Led led;
};

// A diode's temperature from its Vbe.
inline float diode_c(float vbe_mv) { return 25.0f + (vbe_mv - VBE_AT_25C_MV) / VBE_MV_PER_C; }

class Core {
 public:
  // Set from the YAML.
  void set_over_temperature_c(float c) { over_temperature_c_ = c; }
  // Loads every way's record and saves through storage from then on. Without it the core starts
  // with every way unzeroed and keeps nothing.
  void start(Storage &storage);
  Readings on_sweep(const Sweep &sweep);
  // The Clear faults button: clears every fault, and every dead way becomes empty. A fault whose
  // cause is still present comes back on the next sweep.
  void clear_faults();
  // Sets a way's gain trim and saves it at once. False, keeping the old trim, if it is outside
  // GAIN_TRIM_MIN to GAIN_TRIM_MAX.
  bool set_gain_trim(int way_index, float trim);

  const WayRecord &record(int way_index) const { return records_[way_index]; }
  // A gain trim start() found stored outside GAIN_TRIM_MIN to GAIN_TRIM_MAX, which the way
  // replaced with 1.0; NaN if there was none. The glue logs it.
  float rejected_gain_trim(int way_index) const { return gain_trim_rejected_[way_index] ? rejected_gain_trims_[way_index] : NAN; }
  const EnergyRecord &energy(int way_index) const { return energy_[way_index]; }
  // "None", or the unzeroed ways, e.g. "Not zeroed: 3, 7".
  std::string not_zeroed() const;
  // Install mode: from boot while any way has no zero, for INSTALL_MODE_MS at most.
  bool install_mode() const { return install_mode_; }

 private:
  // When a group of readings was last published, and the values that decide the next.
  struct Published {
    bool ever{false};
    uint32_t at_ms{0};
    float current_a{0}, voltage_v{0};
    float panel_voltage_v{0}, diode_c[DIODES]{};
  };

  // A way's progress through the zero rule in its current dead spell: it waits wait_ms from
  // since_ms, then takes the mean of the next ZERO_MEAN_MS.
  struct Zeroing {
    bool dead{false};
    uint32_t since_ms{0};
    uint32_t wait_ms{ZERO_DEAD_MS};
    int samples{0};
    double sum_mv{0}, sum_vbe_mv{0};
  };

  bool due_(Published &last, uint32_t now_ms, bool changed);
  bool track_zero_(int way_index, const Sweep &sweep, float out_mv);
  SelfCheck learn_tempco_(int way_index, const Zero &taken);
  void track_vbe_(const Sweep &sweep);
  float zero_now_mv_(int way_index) const;
  void save_(int way_index);
  // zeroed: each way had a zero when this sweep read it.
  void integrate_energy_(Readings &r, const bool zeroed[WAYS], uint32_t now_ms);
  void update_faults_(const Sweep &sweep, const Readings &r);
  void update_install_mode_(uint32_t now_ms);

  float over_temperature_c_{OVER_TEMPERATURE_C};
  Storage *storage_{nullptr};
  bool live_[WAYS]{};
  Zeroing zeroing_[WAYS];
  WayRecord records_[WAYS];
  bool gain_trim_rejected_[WAYS]{};
  float rejected_gain_trims_[WAYS]{};
  // The smoothed Vbe that temperature tracking follows.
  double vbe_mv_{0};
  bool vbe_tracked_{false};
  uint32_t vbe_at_ms_{0};
  // The self-check each way's latest zero made.
  SelfCheck self_checks_[WAYS]{};
  EnergyRecord energy_[WAYS];
  // The part of a mWs each way's total hasn't taken yet, carried to the next sweep.
  double energy_carry_mws_[WAYS]{};
  bool swept_{false};
  uint32_t last_sweep_ms_{0};
  // When each way last turned live or dead.
  uint32_t changed_at_ms_[WAYS]{};
  // Whether each way has been live since boot, Clear faults or a No supply period. A dead way
  // that hasn't is an empty way, which never raises a fault.
  bool been_live_[WAYS]{};
  // Whether each way reads over OVER_RANGE_A and since when, and when it last read over range or
  // clipped.
  bool over_[WAYS]{};
  uint32_t over_since_ms_[WAYS]{};
  uint32_t out_of_range_at_ms_[WAYS]{};
  Faults faults_{};
  Published way_published_[WAYS];
  Published board_published_;
  bool install_mode_{false};
  bool install_mode_ended_{false};
};

}  // namespace blade_core
