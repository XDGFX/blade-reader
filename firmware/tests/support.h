#pragma once

// What the core's tests share: sweep builders, a clock to feed them by, and a fake flash.

#include <initializer_list>
#include <map>

#include "constants.h"
#include "core.h"
#include "core_storage.h"

namespace blade_test {

using namespace blade_core;

// About one sweep's time, as on the board.
constexpr uint32_t SWEEP_MS = 140;
// From the start of a dead spell, past the sweep that takes its zero.
constexpr uint32_t ZERO_DONE_MS = ZERO_DEAD_MS + ZERO_MEAN_MS + SWEEP_MS;
// The temperature quiet_sweep puts every diode at.
constexpr float ROOM_C = 25.0f;

inline float vbe_at_mv(float c) { return VBE_AT_25C_MV + (c - 25.0f) * VBE_MV_PER_C; }

// Every way dead with its sensor at the nominal zero, and every diode at ROOM_C.
inline Sweep quiet_sweep(uint32_t now_ms = 0) {
  Sweep s{};
  s.now_ms = now_ms;
  for (int w = 0; w < WAYS; w++) {
    bool even_arm = (w + 1) % 2 == 0;
    s.sense_mv[w] = even_arm ? NOMINAL_ZERO_MV * EVEN_ARM_DIVIDER : NOMINAL_ZERO_MV;
  }
  for (float &vbe : s.vbe_mv) vbe = vbe_at_mv(ROOM_C);
  return s;
}

inline void set_volts(Sweep &s, int way, float volts) { s.voltage_mv[way - 1] = volts * 1000.0f / VOLTAGE_DIVIDER; }

// Way `way`'s sense line at the reading for `amps` against the nominal zero, on whichever arm it sits.
inline void set_amps(Sweep &s, int way, float amps) {
  bool even_arm = way % 2 == 0;
  float out_mv = NOMINAL_ZERO_MV + (even_arm ? amps : -amps) * GAIN_MV_PER_A;
  s.sense_mv[way - 1] = even_arm ? out_mv * EVEN_ARM_DIVIDER : out_mv;
}

inline void set_diode_c(Sweep &s, Diode diode, float c) { s.vbe_mv[diode] = vbe_at_mv(c); }

// Ways 1 and 2 live at 12 V, the rest dead since boot.
inline Sweep two_live_ways() {
  Sweep s = quiet_sweep();
  set_volts(s, 1, 12.0f);
  set_volts(s, 2, 12.0f);
  return s;
}

// Every way live at 12 V with no load, so no way zeros.
inline Sweep all_live() {
  Sweep s = quiet_sweep();
  for (int way = 1; way <= WAYS; way++) set_volts(s, way, 12.0f);
  return s;
}

// Feeds the same sweep every SWEEP_MS from `from_ms`, the last at `until_ms`, and returns what the
// last one worked out.
inline Readings run(Core &core, Sweep s, uint32_t from_ms, uint32_t until_ms) {
  for (uint32_t t = from_ms; t < until_ms; t += SWEEP_MS) {
    s.now_ms = t;
    core.on_sweep(s);
  }
  s.now_ms = until_ms;
  return core.on_sweep(s);
}

// Feeds the same sweep every SWEEP_MS from `from_ms` up to, not including, `to_ms`.
inline void run_before(Core &core, Sweep s, uint32_t from_ms, uint32_t to_ms) {
  for (uint32_t t = from_ms; t < to_ms; t += SWEEP_MS) {
    s.now_ms = t;
    core.on_sweep(s);
  }
}

// Where the first field with this id starts in a stored record.
inline size_t field_at(const RecordBytes &bytes, uint8_t id) {
  size_t at = 0;
  while (bytes[at + FIELD_ID_AT] != id) at += FIELD_HEADER_BYTES + bytes[at + FIELD_LENGTH_AT];
  return at;
}

// Flash as the core sees it, outliving a Core so a second one started from it is the next boot. A
// staged record reaches flash on the batch, here sync().
class FakeStorage : public Storage {
 public:
  bool load(RecordKey key, RecordBytes &bytes) override {
    auto it = flash.find(id(key));
    if (it == flash.end()) return false;
    bytes = it->second;
    return true;
  }
  void save(RecordKey key, const RecordBytes &bytes) override {
    flash[id(key)] = bytes;
    saves++;
  }
  void stage(RecordKey key, const RecordBytes &bytes) override { staged[id(key)] = bytes; }
  void sync() {
    for (auto &[key, bytes] : staged) flash[key] = bytes;
    staged.clear();
  }

  void put(RecordKind kind, int way, const RecordBytes &bytes) { flash[id({kind, way - 1})] = bytes; }
  void put_way(int way, const WayRecord &record) { put(RECORD_WAY, way, encode(record)); }
  void put_energy(int way, int64_t mws) { put(RECORD_ENERGY, way, encode(EnergyRecord{mws})); }
  bool has_way(int way) const { return flash.count(id({RECORD_WAY, way - 1})) > 0; }
  bool has_energy(int way) const { return flash.count(id({RECORD_ENERGY, way - 1})) > 0; }
  WayRecord way(int way) const { return decode_way(flash.at(id({RECORD_WAY, way - 1}))); }
  // Every way zeroed at the nominal zero but the ones listed.
  void zero_all_but(std::initializer_list<int> unzeroed_ways) {
    for (int way = 1; way <= WAYS; way++) {
      bool skip = false;
      for (int unzeroed : unzeroed_ways) skip |= unzeroed == way;
      if (!skip) put_way(way, WayRecord{{true, NOMINAL_ZERO_MV, VBE_AT_25C_MV, 0}});
    }
  }

  std::map<int, RecordBytes> flash, staged;
  int saves{0};

 private:
  static int id(RecordKey key) { return key.kind * 256 + key.way_index; }
};

}  // namespace blade_test
