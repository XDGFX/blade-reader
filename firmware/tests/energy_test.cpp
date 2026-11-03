#include <cstdlib>

#include "doctest.h"

#include "support.h"

using namespace blade_test;

namespace {

// Way 1 (odd arm) live at 12 V, carrying amps.
Sweep way_1_sweep(uint32_t now_ms, float amps) {
  Sweep s = quiet_sweep(now_ms);
  set_volts(s, 1, 12.0f);
  set_amps(s, 1, amps);
  return s;
}

}  // namespace

TEST_CASE("an unzeroed way counts energy from boot against its borrowed zero") {
  FakeStorage storage;
  // The odd arm's other ways zeroed 10 mV high, which way 1 borrows.
  for (int way = 3; way <= WAYS; way += 2) {
    storage.put_way(way, WayRecord{{true, NOMINAL_ZERO_MV + 10.0f, VBE_AT_25C_MV, 0}});
  }
  Core core;
  core.start(storage);
  // Way 1 at 12 V, its sensor 2 A below the borrowed zero.
  Sweep s = way_1_sweep(0, 0.0f);
  s.sense_mv[0] = NOMINAL_ZERO_MV + 10.0f - 2.0f * GAIN_MV_PER_A;
  Readings r = run(core, s, 0, 100 * SWEEP_MS);
  // 24 W over 100 sweeps of 140 ms is 336 000 mWs.
  CHECK(core.energy(0).mws == doctest::Approx(336000).epsilon(0.001));
  CHECK(r.way[0].energy_wh == doctest::Approx(336000 / MWS_PER_WH).epsilon(0.001));
}

TEST_CASE("noise around 0 A nets to about zero energy over many sweeps") {
  FakeStorage storage;
  Core core;
  core.start(storage);
  for (int i = 0; i < 10000; i++) {
    // ±0.02 A at 12 V is ±34 mWs a sweep.
    core.on_sweep(way_1_sweep(i * SWEEP_MS, i % 2 == 0 ? 0.02f : -0.02f));
  }
  // Within one sweep's worth, where adding the noise's size would reach about 340 000 mWs.
  CHECK(std::llabs(core.energy(0).mws) <= 34);
}

TEST_CASE("2 A at 12 V for an hour reads 24 Wh") {
  FakeStorage storage;
  Core core;
  core.start(storage);
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
  newer[field_at(newer, WAY_FIELD_ZERO) + FIELD_VERSION_AT] = ZERO_FIELD_VERSION + 1;
  storage.put(RECORD_WAY, 1, newer);
  storage.put_energy(1, 123456789);
  Core core;
  core.start(storage);
  CHECK(core.not_zeroed().find("1,") == 0);
  CHECK(core.energy(0).mws == 123456789);
}

TEST_CASE("an energy total of another format version reads as zero") {
  RecordBytes bytes = encode(EnergyRecord{123456789});
  bytes[field_at(bytes, ENERGY_FIELD_TOTAL) + FIELD_VERSION_AT] = ENERGY_TOTAL_FIELD_VERSION + 1;
  CHECK(decode_energy(bytes).mws == 0);
}
