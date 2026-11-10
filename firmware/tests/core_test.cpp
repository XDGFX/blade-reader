// SPDX-License-Identifier: AGPL-3.0-or-later
#define DOCTEST_CONFIG_IMPLEMENT_WITH_MAIN
#include "doctest.h"

#include "support.h"

using namespace blade_test;

TEST_CASE("an odd-arm way reads 10 A when its sense line falls 440 mV") {
  Core core;
  Sweep s = quiet_sweep(0);
  s.sense_mv[0] = NOMINAL_ZERO_MV - 440.0f;
  Readings r = core.on_sweep(s);
  CHECK(r.way[0].current_a == doctest::Approx(10.0f));
}

TEST_CASE("an even-arm way reads 10 A when its divided sense line rises to 1713.8 mV") {
  Core core;
  Sweep s = quiet_sweep(0);
  s.sense_mv[1] = 1713.8f;  // (1650 + 440) × 0.820
  Readings r = core.on_sweep(s);
  CHECK(r.way[1].current_a == doctest::Approx(10.0f));
}

TEST_CASE("a way's voltage and power come from the same sweep as its current") {
  Core core;
  Sweep s = quiet_sweep(0);
  s.sense_mv[0] = NOMINAL_ZERO_MV - 440.0f;  // 10 A
  s.voltage_mv[0] = 764.0f;                  // 12.0 V through 100 kΩ over 6.8 kΩ
  Readings r = core.on_sweep(s);
  CHECK(r.way[0].voltage_v == doctest::Approx(12.0f).epsilon(0.001));
  CHECK(r.way[0].power_w == doctest::Approx(120.0f).epsilon(0.001));
}

TEST_CASE("the panel voltage is the median of the live ways") {
  Core core;
  Sweep s = quiet_sweep(0);
  set_volts(s, 1, 12.0f);
  set_volts(s, 2, 12.6f);
  set_volts(s, 5, 12.2f);
  set_volts(s, 7, 5.9f);   // below live
  set_volts(s, 12, 1.0f);  // dead
  CHECK(core.on_sweep(s).panel_voltage_v == doctest::Approx(12.2f));

  set_volts(s, 9, 12.4f);
  CHECK(core.on_sweep(s).panel_voltage_v == doctest::Approx(12.3f));
}

TEST_CASE("a way between dead and live keeps its state for the panel voltage") {
  Core core;
  Sweep s = quiet_sweep(0);
  set_volts(s, 1, 12.0f);
  set_volts(s, 3, 4.0f);  // never live
  set_volts(s, 5, 12.0f);
  core.on_sweep(s);

  set_volts(s, 5, 4.0f);  // was live, so still live
  CHECK(core.on_sweep(s).panel_voltage_v == doctest::Approx(8.0f));

  set_volts(s, 5, 1.0f);  // now dead
  core.on_sweep(s);
  set_volts(s, 5, 4.0f);
  CHECK(core.on_sweep(s).panel_voltage_v == doctest::Approx(12.0f));
}

TEST_CASE("each diode's Vbe reads as a temperature, VBE_MV_PER_C per °C from VBE_AT_25C_MV at 25 °C") {
  Core core;
  Sweep s = quiet_sweep(0);
  s.vbe_mv[DIODE_CHIN] = VBE_AT_25C_MV;
  s.vbe_mv[DIODE_ODD_ARM] = VBE_AT_25C_MV + 20.0f * VBE_MV_PER_C;
  s.vbe_mv[DIODE_EVEN_ARM] = VBE_AT_25C_MV - 10.0f * VBE_MV_PER_C;
  Readings r = core.on_sweep(s);
  CHECK(r.diode_c[DIODE_CHIN] == doctest::Approx(25.0f));
  CHECK(r.diode_c[DIODE_ODD_ARM] == doctest::Approx(45.0f));
  CHECK(r.diode_c[DIODE_EVEN_ARM] == doctest::Approx(15.0f));
}

TEST_CASE("the grounded spares pass through in mV") {
  Core core;
  Sweep s = quiet_sweep(0);
  s.spare_mv[SPARE_ODD_ARM] = 3.0f;
  s.spare_mv[SPARE_EVEN_ARM] = 7.0f;
  Readings r = core.on_sweep(s);
  CHECK(r.spare_mv[SPARE_ODD_ARM] == 3.0f);
  CHECK(r.spare_mv[SPARE_EVEN_ARM] == 7.0f);
}

TEST_CASE("every way publishes on the first sweep, then waits while nothing changes") {
  Core core;
  Readings first = core.on_sweep(quiet_sweep(0));
  for (const WayReading &way : first.way) CHECK(way.publish);
  Readings next = core.on_sweep(quiet_sweep(140));
  for (const WayReading &way : next.way) CHECK_FALSE(way.publish);
}

TEST_CASE("a meaningful change publishes a way within a second") {
  Core core;
  core.on_sweep(quiet_sweep(0));
  Sweep s = quiet_sweep(140);
  SUBCASE("in its current") { s.sense_mv[0] -= 2.0f * CURRENT_STEP_A * GAIN_MV_PER_A; }
  SUBCASE("in its voltage") { set_volts(s, 1, 2.0f * VOLTAGE_STEP_V); }
  CHECK_FALSE(core.on_sweep(s).way[0].publish);
  s.now_ms = PUBLISH_MIN_MS;
  Readings r = core.on_sweep(s);
  CHECK(r.way[0].publish);
  CHECK_FALSE(r.way[2].publish);
}

TEST_CASE("a change below the threshold waits for the regular publish") {
  Core core;
  core.on_sweep(quiet_sweep(0));
  Sweep s = quiet_sweep(PUBLISH_MIN_MS);
  s.sense_mv[0] -= 0.5f * CURRENT_STEP_A * GAIN_MV_PER_A;
  CHECK_FALSE(core.on_sweep(s).way[0].publish);
  s.now_ms = PUBLISH_EVERY_MS - 1;
  CHECK_FALSE(core.on_sweep(s).way[0].publish);
  s.now_ms = PUBLISH_EVERY_MS;
  CHECK(core.on_sweep(s).way[0].publish);
}

TEST_CASE("the yoke-level readings publish on a meaningful change in panel voltage or temperature") {
  Core core;
  CHECK(core.on_sweep(quiet_sweep(0)).publish_board);
  Sweep s = quiet_sweep(PUBLISH_MIN_MS);
  CHECK_FALSE(core.on_sweep(s).publish_board);
  SUBCASE("panel voltage") { set_volts(s, 1, 12.0f); }
  SUBCASE("temperature") { s.vbe_mv[DIODE_CHIN] += 2.0f * TEMPERATURE_STEP_C * VBE_MV_PER_C; }
  s.now_ms = 2 * PUBLISH_MIN_MS;
  CHECK(core.on_sweep(s).publish_board);
}


TEST_CASE("a way reads live from LIVE_V and dead below DEAD_V, keeping its state in between") {
  Core core;
  Sweep s = quiet_sweep(0);
  const float between_v = (LIVE_V + DEAD_V) / 2;
  set_volts(s, 1, between_v);
  CHECK_FALSE(run(core, s, 0, 0).way[0].live);  // dead since boot
  set_volts(s, 1, LIVE_V + 1.0f);
  CHECK(run(core, s, 1000, 1000).way[0].live);
  set_volts(s, 1, between_v);
  CHECK(run(core, s, 2000, 2000).way[0].live);
  set_volts(s, 1, DEAD_V - 1.0f);
  CHECK_FALSE(run(core, s, 3000, 3000).way[0].live);
  set_volts(s, 1, between_v);
  CHECK_FALSE(run(core, s, 4000, 4000).way[0].live);
}

TEST_CASE("a live way that stays dead while another stays live is blown after BLOWN_AFTER_MS") {
  Core core;
  Sweep s = two_live_ways();
  run(core, s, 0, 1000);
  set_volts(s, 1, 0.0f);
  CHECK_FALSE(run(core, s, 2000, 2000 + BLOWN_AFTER_MS - SWEEP_MS).faults.way[0][WAY_BLOWN]);
  Readings r = run(core, s, 2000 + BLOWN_AFTER_MS, 2000 + BLOWN_AFTER_MS);
  CHECK(r.faults.way[0][WAY_BLOWN]);
  CHECK_FALSE(r.faults.way[1][WAY_BLOWN]);
  CHECK_FALSE(r.faults.way[2][WAY_BLOWN]);  // empty since boot
}

TEST_CASE("with no way live there's No supply: no blown fuse and a panel voltage of 0 V") {
  Core core;
  Sweep s = quiet_sweep(0);
  set_volts(s, 1, 12.0f);
  run(core, s, 0, 1000);
  set_volts(s, 1, 0.0f);  // the only live way
  Readings r = run(core, s, 2000, 2000 + 10 * BLOWN_AFTER_MS);
  CHECK(r.faults.no_supply);
  CHECK_FALSE(r.faults.way[0][WAY_BLOWN]);
  CHECK(r.panel_voltage_v == 0.0f);
}

TEST_CASE("after No supply, a way that stays dead when the others come back is empty") {
  Core core;
  Sweep s = two_live_ways();
  run(core, s, 0, 1000);
  Sweep off = quiet_sweep(0);
  CHECK(run(core, off, 2000, 3000).faults.no_supply);
  set_volts(s, 1, 0.0f);
  Readings r = run(core, s, 4000, 4000 + 10 * BLOWN_AFTER_MS);
  CHECK_FALSE(r.faults.no_supply);
  CHECK_FALSE(r.faults.way[0][WAY_BLOWN]);
}

TEST_CASE("a way between dead and live keeps its state for a blown fuse") {
  Core core;
  Sweep s = two_live_ways();
  run(core, s, 0, 1000);
  set_volts(s, 1, 4.0f);  // was live, so still live
  CHECK_FALSE(run(core, s, 2000, 2000 + 2 * BLOWN_AFTER_MS).faults.way[0][WAY_BLOWN]);
  set_volts(s, 1, 1.0f);
  run(core, s, 5000, 5000);
  set_volts(s, 1, 4.0f);  // dead, so still dead
  CHECK(run(core, s, 5000 + BLOWN_AFTER_MS, 5000 + BLOWN_AFTER_MS).faults.way[0][WAY_BLOWN]);
}

TEST_CASE("a blown fuse clears once its way has been live for BLOWN_CLEARS_AFTER_MS") {
  Core core;
  Sweep s = two_live_ways();
  run(core, s, 0, 1000);
  set_volts(s, 1, 0.0f);
  REQUIRE(run(core, s, 2000, 2000 + BLOWN_AFTER_MS).faults.way[0][WAY_BLOWN]);
  set_volts(s, 1, 12.0f);
  CHECK(run(core, s, 5000, 5000 + BLOWN_CLEARS_AFTER_MS - 1).faults.way[0][WAY_BLOWN]);
  CHECK_FALSE(run(core, s, 5000 + BLOWN_CLEARS_AFTER_MS, 5000 + BLOWN_CLEARS_AFTER_MS)
                  .faults.way[0][WAY_BLOWN]);
}

TEST_CASE("Clear faults clears a blown fuse, and its way stays clear while it's dead") {
  Core core;
  Sweep s = two_live_ways();
  run(core, s, 0, 1000);
  set_volts(s, 1, 0.0f);
  REQUIRE(run(core, s, 2000, 2000 + BLOWN_AFTER_MS).faults.way[0][WAY_BLOWN]);
  core.clear_faults();
  CHECK_FALSE(run(core, s, 4000, 4000 + 10 * BLOWN_AFTER_MS).faults.way[0][WAY_BLOWN]);
}

TEST_CASE("Clear faults leaves live ways able to blow") {
  Core core;
  Sweep s = two_live_ways();
  run(core, s, 0, 1000);
  core.clear_faults();
  set_volts(s, 1, 0.0f);
  CHECK(run(core, s, 2000, 2000 + BLOWN_AFTER_MS).faults.way[0][WAY_BLOWN]);
}

TEST_CASE("the fault text reads OK with no fault, and No supply with no way live") {
  Faults f{};
  CHECK(fault_text(f) == "OK");
  CHECK_FALSE(f.any());
  f.no_supply = true;
  CHECK(fault_text(f) == "No supply");
  CHECK_FALSE(f.any());
}

TEST_CASE("the fault text names ways that share a fault together, in ascending order") {
  Faults f{};
  f.way[8][WAY_BLOWN] = true;
  f.way[2][WAY_BLOWN] = true;
  f.way[6][WAY_BLOWN] = true;
  f.way[8][WAY_OVER_RANGE] = true;
  CHECK(fault_text(f) == "Ways 3, 7, 9 blown; Way 9 over range");
  CHECK(f.any());
}

TEST_CASE("under No supply the fault text shows No supply first, then any faults") {
  Faults f{};
  f.no_supply = true;
  f.way[8][WAY_OVER_RANGE] = true;
  CHECK(fault_text(f) == "No supply; Way 9 over range");
}

TEST_CASE("the fault text fits in FAULT_TEXT_MAX with every fault raised, cutting nothing off") {
  Faults f{};
  f.no_supply = true;
  f.over_temperature = true;
  // The longest temperature a diode can read: its Vbe at the ADC's top, 3.3 V.
  f.hottest_c = diode_c(3300.0f);
  for (auto &way : f.way)
    for (bool &fault : way) fault = true;
  std::string text = fault_text(f);
  CHECK(text.size() <= FAULT_TEXT_MAX);
  std::string last = "Ways 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 over range";
  CHECK(text.size() >= last.size());
  CHECK(text.substr(text.size() - last.size()) == last);
}

namespace {

// Just over and at the over-range current.
constexpr float OVER_A = OVER_RANGE_A + 1.0f;

}  // namespace

TEST_CASE("a way over OVER_RANGE_A for OVER_RANGE_AFTER_MS is over range, timed from when it first read over") {
  Core core;
  Sweep s = two_live_ways();
  set_amps(s, 2, -OVER_A);
  // Over from a first sweep well after boot.
  constexpr uint32_t FROM_MS = 60000;
  CHECK_FALSE(run(core, s, FROM_MS, FROM_MS + OVER_RANGE_AFTER_MS - SWEEP_MS).faults.way[1][WAY_OVER_RANGE]);
  Readings r = run(core, s, FROM_MS + OVER_RANGE_AFTER_MS, FROM_MS + OVER_RANGE_AFTER_MS);
  CHECK(r.faults.way[1][WAY_OVER_RANGE]);
  CHECK_FALSE(r.faults.way[0][WAY_OVER_RANGE]);
}

TEST_CASE("a clipped reading is over range straight away, whatever the current") {
  Core core;
  Sweep s = two_live_ways();
  run(core, s, 0, 1000);
  s.sense_clipped[2] = true;
  CHECK(run(core, s, 1140, 1140).faults.way[2][WAY_OVER_RANGE]);
}

TEST_CASE("over range clears after OVER_RANGE_CLEARS_AFTER_MS at OVER_RANGE_A or less with no clipping") {
  Core core;
  Sweep s = two_live_ways();
  set_amps(s, 1, OVER_A);
  REQUIRE(run(core, s, 0, OVER_RANGE_AFTER_MS).faults.way[0][WAY_OVER_RANGE]);
  set_amps(s, 1, OVER_RANGE_A);
  s.sense_clipped[0] = true;
  run(core, s, 2000, 2000);  // clipped, though within range
  s.sense_clipped[0] = false;
  CHECK(run(core, s, 2140, 2000 + OVER_RANGE_CLEARS_AFTER_MS - 1).faults.way[0][WAY_OVER_RANGE]);
  CHECK_FALSE(run(core, s, 2000 + OVER_RANGE_CLEARS_AFTER_MS, 2000 + OVER_RANGE_CLEARS_AFTER_MS)
                  .faults.way[0][WAY_OVER_RANGE]);
}

TEST_CASE("the yoke is over temperature when its hottest diode reaches the threshold") {
  // As the YAML sets it.
  constexpr float THRESHOLD_C = 70.0f;
  Core core;
  core.set_over_temperature_c(THRESHOLD_C);
  Sweep s = two_live_ways();
  set_diode_c(s, DIODE_CHIN, THRESHOLD_C - 30.0f);
  set_diode_c(s, DIODE_ODD_ARM, THRESHOLD_C - 0.5f);
  CHECK_FALSE(core.on_sweep(s).faults.over_temperature);
  set_diode_c(s, DIODE_EVEN_ARM, THRESHOLD_C);
  Readings r = core.on_sweep(s);
  CHECK(r.faults.over_temperature);
  CHECK(r.faults.hottest_c == doctest::Approx(THRESHOLD_C));
}

TEST_CASE("over temperature clears OVER_TEMPERATURE_CLEARS_K below the threshold") {
  Core core;
  Sweep s = two_live_ways();
  set_diode_c(s, DIODE_CHIN, OVER_TEMPERATURE_C + 1.0f);
  REQUIRE(core.on_sweep(s).faults.over_temperature);
  set_diode_c(s, DIODE_CHIN, OVER_TEMPERATURE_C - OVER_TEMPERATURE_CLEARS_K + 0.5f);
  CHECK(core.on_sweep(s).faults.over_temperature);
  set_diode_c(s, DIODE_CHIN, OVER_TEMPERATURE_C - OVER_TEMPERATURE_CLEARS_K);
  CHECK_FALSE(core.on_sweep(s).faults.over_temperature);
}

TEST_CASE("the fault text puts over temperature first, then each way's faults in order") {
  Faults f{};
  f.over_temperature = true;
  f.hottest_c = 87.4f;
  f.way[8][WAY_OVER_RANGE] = true;
  f.way[2][WAY_BLOWN] = true;
  CHECK(fault_text(f) == "Over temperature 87 °C; Way 3 blown; Way 9 over range");
}

TEST_CASE("over temperature alone lights the red LED steady") {
  Core core;
  Sweep s = two_live_ways();
  set_diode_c(s, DIODE_CHIN, OVER_TEMPERATURE_C);
  CHECK(core.on_sweep(s).led == LED_STEADY);
}

TEST_CASE("under No supply, a sensor stuck at a rail still shows over range") {
  Core core;
  Sweep s = quiet_sweep(0);
  s.sense_clipped[4] = true;
  Readings r = core.on_sweep(s);
  CHECK(r.faults.no_supply);
  CHECK(fault_text(r.faults) == "No supply; Way 5 over range");
}

TEST_CASE("Clear faults clears over range and over temperature, and both come back if still present") {
  Core core;
  Sweep s = two_live_ways();
  set_amps(s, 1, OVER_A);
  set_diode_c(s, DIODE_CHIN, OVER_TEMPERATURE_C + 1.0f);
  REQUIRE(run(core, s, 0, OVER_RANGE_AFTER_MS).faults.any());
  core.clear_faults();
  Readings r = run(core, s, OVER_RANGE_AFTER_MS + SWEEP_MS, OVER_RANGE_AFTER_MS + SWEEP_MS);
  CHECK(r.faults.way[0][WAY_OVER_RANGE]);
  CHECK(r.faults.over_temperature);
}

TEST_CASE("Clear faults clears over temperature once the yoke is below the threshold") {
  Core core;
  Sweep s = two_live_ways();
  set_diode_c(s, DIODE_CHIN, OVER_TEMPERATURE_C + 1.0f);
  REQUIRE(core.on_sweep(s).faults.over_temperature);
  // Below the threshold, but not yet far enough below for it to clear on its own.
  set_diode_c(s, DIODE_CHIN, OVER_TEMPERATURE_C - OVER_TEMPERATURE_CLEARS_K / 2.0f);
  core.clear_faults();
  CHECK_FALSE(core.on_sweep(s).faults.over_temperature);
}
