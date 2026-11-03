#include <cstdlib>
#include <map>

#include "doctest.h"

#include "constants.h"
#include "core.h"
#include "core_storage.h"

using namespace blade_core;

namespace {

constexpr uint32_t SWEEP_MS = 140;

// Every way dead with its sensor at the nominal zero.
Sweep quiet_sweep(uint32_t now_ms) {
  Sweep s{};
  s.now_ms = now_ms;
  for (int w = 0; w < WAYS; w++) {
    bool even_arm = (w + 1) % 2 == 0;
    s.sense_mv[w] = even_arm ? NOMINAL_ZERO_MV * EVEN_ARM_DIVIDER : NOMINAL_ZERO_MV;
  }
  for (float &vbe : s.vbe_mv) vbe = VBE_AT_25C_MV;
  return s;
}

// Way 1 (odd arm, unzeroed) live at 12 V, carrying amps.
Sweep way_1_sweep(uint32_t now_ms, float amps) {
  Sweep s = quiet_sweep(now_ms);
  s.voltage_mv[0] = 12000.0f / VOLTAGE_DIVIDER;
  s.sense_mv[0] = NOMINAL_ZERO_MV - amps * GAIN_MV_PER_A;
  return s;
}

// Flash as the core sees it. A staged record reaches flash on the batch, here sync().
class FakeStorage : public Storage {
 public:
  bool load(RecordKey key, RecordBytes &bytes) override {
    auto it = flash.find(id(key));
    if (it == flash.end()) return false;
    bytes = it->second;
    return true;
  }
  void save(RecordKey key, const RecordBytes &bytes) override { flash[id(key)] = bytes; }
  void stage(RecordKey key, const RecordBytes &bytes) override { staged[id(key)] = bytes; }
  void sync() {
    for (auto &[key, bytes] : staged) flash[key] = bytes;
    staged.clear();
  }

  void put(RecordKind kind, int way, const RecordBytes &bytes) { flash[id({kind, way - 1})] = bytes; }
  void put_energy(int way, int64_t mws) { put(RECORD_ENERGY, way, encode(EnergyRecord{mws})); }
  bool has_energy(int way) { return flash.count(id({RECORD_ENERGY, way - 1})) > 0; }

  std::map<int, RecordBytes> flash, staged;

 private:
  static int id(RecordKey key) { return key.kind * 256 + key.way_index; }
};

}  // namespace

TEST_CASE("noise around 0 A nets to about zero energy over many sweeps") {
  Core core;
  for (int i = 0; i < 10000; i++) {
    // ±0.02 A at 12 V is ±34 mWs a sweep.
    core.on_sweep(way_1_sweep(i * SWEEP_MS, i % 2 == 0 ? 0.02f : -0.02f));
  }
  // Within one sweep's worth, where adding the noise's size would reach about 340 000 mWs.
  CHECK(std::llabs(core.energy(0).mws) <= 34);
}

TEST_CASE("2 A at 12 V for an hour reads 24 Wh") {
  Core core;
  Readings r{};
  for (uint32_t t = 0; t <= 3600 * 1000; t += SWEEP_MS) r = core.on_sweep(way_1_sweep(t, 2.0f));
  CHECK(r.way[0].energy_wh == doctest::Approx(24.0).epsilon(0.001));
}

TEST_CASE("a large total still gains a standby-sized sweep") {
  // 10^12 mWs is about 278 kWh, where a float's step is 65 536 mWs.
  constexpr int64_t LARGE_MWS = 1000000000000;
  FakeStorage storage;
  storage.put_energy(1, LARGE_MWS);
  Core core;
  core.start(storage);
  // 10 mA at 12 V is 16.8 mWs a sweep: 1000 sweeps after the first add 16 800 mWs.
  for (int i = 0; i <= 1000; i++) core.on_sweep(way_1_sweep(i * SWEEP_MS, 0.01f));
  // To 0.1 %, the float sense line's own error. A float total would stay at LARGE_MWS.
  CHECK(std::llabs(core.energy(0).mws - (LARGE_MWS + 16800)) <= 17);
}

TEST_CASE("energy waits for the batch write, and a restart carries on from it") {
  FakeStorage storage;
  Core core;
  core.start(storage);
  for (int i = 0; i <= 1000; i++) core.on_sweep(way_1_sweep(i * SWEEP_MS, 2.0f));
  CHECK_FALSE(storage.has_energy(1));

  storage.sync();
  Core restarted;
  restarted.start(storage);
  CHECK(restarted.energy(0).mws == core.energy(0).mws);
  CHECK(core.energy(0).mws > 0);
}

TEST_CASE("a format change to the way record leaves the energy total untouched") {
  FakeStorage storage;
  WayRecord way;
  way.zero = {true, NOMINAL_ZERO_MV, VBE_AT_25C_MV, 15};
  RecordBytes newer = encode(way);
  REQUIRE(newer[FIELD_ID_AT] == WAY_FIELD_ZERO);
  newer[FIELD_VERSION_AT] = ZERO_FIELD_VERSION + 1;
  storage.put(RECORD_WAY, 1, newer);
  storage.put_energy(1, 123456789);
  Core core;
  core.start(storage);
  CHECK_FALSE(core.record(0).zero.taken);
  CHECK(core.energy(0).mws == 123456789);
}

TEST_CASE("an energy total of another format version reads as zero") {
  RecordBytes bytes = encode(EnergyRecord{123456789});
  REQUIRE(bytes[FIELD_ID_AT] == ENERGY_FIELD_TOTAL);
  bytes[FIELD_VERSION_AT] = ENERGY_TOTAL_FIELD_VERSION + 1;
  CHECK(decode_energy(bytes).mws == 0);
}
