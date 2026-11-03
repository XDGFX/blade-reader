#define DOCTEST_CONFIG_IMPLEMENT_WITH_MAIN
#include "doctest.h"

#include "constants.h"
#include "core.h"

using namespace blade_core;

namespace {

// Every way dead with its sensor at the nominal zero, and the board at 25 °C.
Sweep quiet_sweep(uint32_t now_ms) {
  Sweep s{};
  s.now_ms = now_ms;
  for (int w = 0; w < WAYS; w++) {
    bool even_arm = (w + 1) % 2 == 0;
    s.sense_mv[w] = even_arm ? NOMINAL_ZERO_MV * EVEN_ARM_DIVIDER : NOMINAL_ZERO_MV;
    s.voltage_mv[w] = 0.0f;
  }
  for (float &vbe : s.vbe_mv) vbe = 590.0f;
  return s;
}

void set_volts(Sweep &s, int way, float volts) {
  s.voltage_mv[way - 1] = volts * 1000.0f / VOLTAGE_DIVIDER;
}

}  // namespace

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

TEST_CASE("each diode's Vbe reads as a temperature, falling 2 mV per °C from 590 mV at 25 °C") {
  Core core;
  Sweep s = quiet_sweep(0);
  s.vbe_mv[DIODE_CHIN] = 590.0f;
  s.vbe_mv[DIODE_ODD_ARM] = 550.0f;
  s.vbe_mv[DIODE_EVEN_ARM] = 610.0f;
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

TEST_CASE("the board's readings publish on a meaningful change in panel voltage or temperature") {
  Core core;
  CHECK(core.on_sweep(quiet_sweep(0)).publish_board);
  Sweep s = quiet_sweep(PUBLISH_MIN_MS);
  CHECK_FALSE(core.on_sweep(s).publish_board);
  SUBCASE("panel voltage") { set_volts(s, 1, 12.0f); }
  SUBCASE("temperature") { s.vbe_mv[DIODE_CHIN] += 2.0f * TEMPERATURE_STEP_C * VBE_MV_PER_C; }
  s.now_ms = 2 * PUBLISH_MIN_MS;
  CHECK(core.on_sweep(s).publish_board);
}
