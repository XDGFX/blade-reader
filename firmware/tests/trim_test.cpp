#include <cmath>

#include "doctest.h"

#include "constants.h"
#include "core.h"

using namespace blade_core;

namespace {

// Every way dead with its sensor at the nominal zero, way 1 (odd arm) at 10 A by the nominal gain.
Sweep ten_amp_sweep() {
  Sweep s{};
  for (int w = 0; w < WAYS; w++) {
    bool even_arm = (w + 1) % 2 == 0;
    s.sense_mv[w] = even_arm ? NOMINAL_ZERO_MV * EVEN_ARM_DIVIDER : NOMINAL_ZERO_MV;
  }
  s.sense_mv[0] = NOMINAL_ZERO_MV - 440.0f;
  for (float &vbe : s.vbe_mv) vbe = 590.0f;
  return s;
}

}  // namespace

TEST_CASE("a way's current scales by its gain trim") {
  Core core;
  CHECK(core.on_sweep(ten_amp_sweep()).way[0].current_a == doctest::Approx(10.0f));
  REQUIRE(core.set_gain_trim(0, 1.05f));
  CHECK(core.on_sweep(ten_amp_sweep()).way[0].current_a == doctest::Approx(10.5f));
}

TEST_CASE("a gain trim outside its range is rejected and the way keeps its trim") {
  Core core;
  REQUIRE(core.set_gain_trim(0, 1.05f));
  CHECK_FALSE(core.set_gain_trim(0, GAIN_TRIM_MAX + 0.01f));
  CHECK_FALSE(core.set_gain_trim(0, GAIN_TRIM_MIN - 0.01f));
  CHECK_FALSE(core.set_gain_trim(0, NAN));
  CHECK(core.on_sweep(ten_amp_sweep()).way[0].current_a == doctest::Approx(10.5f));

  CHECK(core.set_gain_trim(0, GAIN_TRIM_MIN));
  CHECK(core.set_gain_trim(0, GAIN_TRIM_MAX));
}
