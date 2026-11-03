#include "doctest.h"

#include "support.h"

using namespace blade_test;

namespace {

// Way 1 (odd arm) sits 10 mV above the nominal zero: about −0.23 A against it.
constexpr float WAY_1_ZERO_MV = NOMINAL_ZERO_MV + 10.0f;

// Every way dead, way 1's sensor at WAY_1_ZERO_MV and the others at the nominal zero.
Sweep dead_sweep(uint32_t now_ms) {
  Sweep s = quiet_sweep(now_ms);
  s.sense_mv[0] = WAY_1_ZERO_MV;
  return s;
}

// Way 1's current with it live at 12 V and its sensor at WAY_1_ZERO_MV.
float way_1_live_current_a(Core &core, uint32_t now_ms) {
  Sweep s = dead_sweep(now_ms);
  set_volts(s, 1, 12.0f);
  return core.on_sweep(s).way[0].current_a;
}

constexpr float NOMINAL_READING_A = -10.0f / GAIN_MV_PER_A;

}  // namespace

TEST_CASE("a way dead for 5 s takes the mean of the next 10 s as its zero") {
  Core core;
  run_before(core, dead_sweep(0), 0, ZERO_DONE_MS);
  CHECK(way_1_live_current_a(core, ZERO_DONE_MS) == doctest::Approx(0.0f).epsilon(0.001));
}

TEST_CASE("the first 5 s of a dead spell are left out of the zero") {
  Core core;
  Sweep settling = dead_sweep(0);
  settling.sense_mv[0] = NOMINAL_ZERO_MV + 50.0f;
  run_before(core, settling, 0, ZERO_DEAD_MS);
  run_before(core, dead_sweep(0), ZERO_DEAD_MS, ZERO_DONE_MS);
  CHECK(way_1_live_current_a(core, ZERO_DONE_MS) == doctest::Approx(0.0f).epsilon(0.001));
}

TEST_CASE("a way that goes live part-way through keeps its old zero") {
  Core core;
  run_before(core, dead_sweep(0), 0, ZERO_DONE_MS);
  way_1_live_current_a(core, ZERO_DONE_MS);  // ends the dead spell

  // A second dead spell with the sensor 20 mV higher, live again before its 10 s are up.
  Sweep shifted = dead_sweep(0);
  shifted.sense_mv[0] = WAY_1_ZERO_MV + 20.0f;
  uint32_t start_ms = ZERO_DONE_MS + SWEEP_MS;
  SUBCASE("in the first 5 s") { run_before(core, shifted, start_ms, start_ms + ZERO_DEAD_MS - SWEEP_MS); }
  SUBCASE("in the 10 s mean") {
    run_before(core, shifted, start_ms, start_ms + ZERO_DEAD_MS + ZERO_MEAN_MS - SWEEP_MS);
  }
  uint32_t live_ms = start_ms + ZERO_DEAD_MS + ZERO_MEAN_MS;
  CHECK(way_1_live_current_a(core, live_ms) == doctest::Approx(0.0f).epsilon(0.001));
}

TEST_CASE("an unzeroed way reads against the nominal zero") {
  Core core;
  CHECK(way_1_live_current_a(core, 0) == doctest::Approx(NOMINAL_READING_A));
}
