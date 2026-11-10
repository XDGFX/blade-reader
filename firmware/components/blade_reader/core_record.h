// SPDX-License-Identifier: AGPL-3.0-or-later
#pragma once

// What the core keeps for each way across reboots, and its stored form.

#include <cstdint>

#include "constants.h"
#include "core_storage.h"

namespace blade_core {

// A way's zero: its sensor's output with no current flowing, in mV undoing the even arm's
// divider, and the even arm's Vbe and the seconds since boot when it was taken.
struct Zero {
  bool taken{false};
  float mv{0};
  float vbe_mv{0};
  uint32_t at_s{0};
};

// How a way's zero drifts with temperature, learnt from its own re-zeros: mA/K of zero drift,
// read as the sensor's output over the nominal gain.
struct Tempco {
  float ma_per_k{0};
  uint8_t samples{0};
  // The latest samples, newest first; only the first `samples` of them are real.
  float recent[TEMPCO_CONFIDENT_SAMPLES]{};
  // Self-checks in a row on which the tempco did worse than no correction.
  uint8_t self_check_streak{0};

  // The tempco once its latest samples agree, otherwise 0.
  float applied_ma_per_k() const;
};

struct WayRecord {
  Zero zero;
  Tempco tempco{};
  // What the way's current is multiplied by, set over the API.
  float gain_trim{1.0f};
};

// A stored record is a run of fields, each [id][version][payload length][payload], ended by id 0
// or the record's end. A field that is missing, unknown or of another version reads as its
// default, so a format change resets only the field it touches. Each field's version goes up
// whenever its payload changes.
constexpr size_t FIELD_ID_AT = 0;
constexpr size_t FIELD_VERSION_AT = 1;
constexpr size_t FIELD_LENGTH_AT = 2;
constexpr size_t FIELD_HEADER_BYTES = 3;

enum WayField : uint8_t {
  WAY_FIELD_END = 0,
  WAY_FIELD_ZERO = 1,
  WAY_FIELD_TEMPCO = 2,
  WAY_FIELD_TEMPCO_SAMPLES = 3,
  WAY_FIELD_SELF_CHECK = 4,
  WAY_FIELD_GAIN_TRIM = 5,
};
constexpr uint8_t ZERO_FIELD_VERSION = 1;
constexpr uint8_t TEMPCO_FIELD_VERSION = 1;
constexpr uint8_t TEMPCO_SAMPLES_FIELD_VERSION = 1;
constexpr uint8_t SELF_CHECK_FIELD_VERSION = 1;
constexpr uint8_t GAIN_TRIM_FIELD_VERSION = 1;

RecordBytes encode(const WayRecord &record);
WayRecord decode_way(const RecordBytes &bytes);

// A way's energy total in mWs, signed so noise around 0 A cancels. A 64-bit integer, so a large
// total still gains a standby-sized sweep.
struct EnergyRecord {
  int64_t mws{0};
};

// Stored as fields like a way record, but its own record, so a format change to the way record
// leaves it untouched.
enum EnergyField : uint8_t { ENERGY_FIELD_END = 0, ENERGY_FIELD_TOTAL = 1 };
constexpr uint8_t ENERGY_TOTAL_FIELD_VERSION = 1;

RecordBytes encode(const EnergyRecord &record);
EnergyRecord decode_energy(const RecordBytes &bytes);

}  // namespace blade_core
