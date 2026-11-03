#pragma once

// The blade_reader core: everything the board works out, with no ESPHome or ESP-IDF in it.
// The glue hands it each finished sweep and publishes what it returns.

#include <cstdint>
#include <string>

#include "constants.h"

namespace blade_core {

enum Diode { DIODE_CHIN, DIODE_ODD_ARM, DIODE_EVEN_ARM, DIODES };
enum Spare { SPARE_ODD_ARM, SPARE_EVEN_ARM, SPARES };

// One finished sweep, as read at the ADC pins. Way arrays are indexed by way number − 1.
struct Sweep {
  uint32_t now_ms;
  float sense_mv[WAYS];
  float voltage_mv[WAYS];
  float vbe_mv[DIODES];
  float spare_mv[SPARES];
};

// What one sweep works out. The glue publishes a group only when its publish flag is set, and
// then every reading in it, so current and power always go together.
struct WayReading {
  bool publish;
  float current_a;
  float power_w;
  float voltage_v;
};

// Each kind of way fault, in the order the fault text lists them within a way.
enum WayFault { WAY_BLOWN, WAY_FAULT_KINDS };

struct Faults {
  // No way is live, so the board is on USB alone. It is not a fault in itself.
  bool no_supply;
  bool way[WAYS][WAY_FAULT_KINDS];

  // Any fault active, which lights the red LED steady.
  bool any() const;
};

// `OK`, `No supply`, or every fault joined by `; `, board faults first, then ways ascending.
std::string fault_text(const Faults &faults);

struct Readings {
  WayReading way[WAYS];
  Faults faults;
  bool publish_board;
  float panel_voltage_v;
  float diode_c[DIODES];
  float spare_mv[SPARES];
};

class Core {
 public:
  Readings on_sweep(const Sweep &sweep);
  // The Clear faults button: clears every fault, and every dead way becomes empty. A fault whose
  // cause is still present comes back on the next sweep.
  void clear_faults();

 private:
  // When a group of readings was last published, and the values that decide the next.
  struct Published {
    bool ever{false};
    uint32_t at_ms{0};
    float current_a{0}, voltage_v{0};
    float panel_voltage_v{0}, diode_c[DIODES]{};
  };

  bool due_(Published &last, uint32_t now_ms, bool changed);

  void update_faults_(uint32_t now_ms);

  bool live_[WAYS]{};
  // When each way last turned live or dead.
  uint32_t changed_at_ms_[WAYS]{};
  // Whether each way has been live since boot, Clear faults or a No supply period. A dead way
  // that hasn't is an empty way, which never raises a fault.
  bool been_live_[WAYS]{};
  Faults faults_{};
  Published way_published_[WAYS];
  Published board_published_;
};

}  // namespace blade_core
