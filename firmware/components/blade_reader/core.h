#pragma once

// The blade_reader core: everything the board works out, with no ESPHome or ESP-IDF in it.
// The glue hands it each finished sweep and publishes what it returns.

#include <cstdint>

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

struct Readings {
  WayReading way[WAYS];
  bool publish_board;
  float panel_voltage_v;
  float diode_c[DIODES];
  float spare_mv[SPARES];
};

class Core {
 public:
  Readings on_sweep(const Sweep &sweep);

 private:
  // When a group of readings was last published, and the values that decide the next.
  struct Published {
    bool ever{false};
    uint32_t at_ms{0};
    float current_a{0}, voltage_v{0};
    float panel_voltage_v{0}, diode_c[DIODES]{};
  };

  bool due_(Published &last, uint32_t now_ms, bool changed);

  bool live_[WAYS]{};
  Published way_published_[WAYS];
  Published board_published_;
};

}  // namespace blade_core
