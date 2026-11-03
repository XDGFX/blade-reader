#pragma once

// The blade_reader core: everything the board works out, with no ESPHome or ESP-IDF in it.
// The glue hands it each finished sweep and publishes what it returns.

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
  // This sweep took a new zero, now in the way's record and saved.
  bool new_zero;
};

struct Readings {
  WayReading way[WAYS];
  bool publish_board;
  float panel_voltage_v;
  float diode_c[DIODES];
  float spare_mv[SPARES];
};

// A diode's temperature from its Vbe.
inline float diode_c(float vbe_mv) { return 25.0f + (vbe_mv - VBE_AT_25C_MV) / VBE_MV_PER_C; }

class Core {
 public:
  // Loads every way's record and saves through storage from then on. Without it the core starts
  // with every way unzeroed and keeps nothing.
  void start(Storage &storage);
  Readings on_sweep(const Sweep &sweep);

  const WayRecord &record(int way_index) const { return records_[way_index]; }
  // "None", or the unzeroed ways, e.g. "Not zeroed: 3, 7".
  std::string not_zeroed() const;

 private:
  // When a group of readings was last published, and the values that decide the next.
  struct Published {
    bool ever{false};
    uint32_t at_ms{0};
    float current_a{0}, voltage_v{0};
    float panel_voltage_v{0}, diode_c[DIODES]{};
  };

  // A way's progress through the zero rule in its current dead spell.
  struct Zeroing {
    bool dead{false};
    bool done{false};
    uint32_t since_ms{0};
    int samples{0};
    double sum_mv{0}, sum_vbe_mv{0};
  };

  bool due_(Published &last, uint32_t now_ms, bool changed);
  bool track_zero_(int way_index, const Sweep &sweep, float out_mv);
  void save_(int way_index);

  Storage *storage_{nullptr};
  bool live_[WAYS]{};
  Zeroing zeroing_[WAYS];
  WayRecord records_[WAYS];
  Published way_published_[WAYS];
  Published board_published_;
};

}  // namespace blade_core
