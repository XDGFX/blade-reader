#include "doctest.h"

#include "constants.h"
#include "core.h"

using namespace blade_core;

namespace {

constexpr uint32_t SWEEP_MS = 140;
// Long enough at one temperature for the smoothed Vbe to have caught up with it.
constexpr uint32_t SETTLE_MS = 20 * VBE_SMOOTHING_MS;

float vbe_at_mv(float temperature_c) { return VBE_AT_25C_MV + (temperature_c - 25.0f) * VBE_MV_PER_C; }

// Way 1's zero drift, in output mV, that a tempco of ma_per_k gives over k kelvin.
float drift_mv(float ma_per_k, float k) { return ma_per_k * k * GAIN_MV_PER_A / 1000.0f; }

// Every way at the nominal zero, way 1 (odd arm) at way_1_mv, every diode at temperature_c.
Sweep sweep_at(float temperature_c, float way_1_mv, bool live) {
  Sweep s{};
  for (int w = 0; w < WAYS; w++) {
    bool even_arm = (w + 1) % 2 == 0;
    s.sense_mv[w] = even_arm ? NOMINAL_ZERO_MV * EVEN_ARM_DIVIDER : NOMINAL_ZERO_MV;
    s.voltage_mv[w] = live ? 12000.0f / VOLTAGE_DIVIDER : 0.0f;
  }
  s.sense_mv[0] = way_1_mv;
  for (float &vbe : s.vbe_mv) vbe = vbe_at_mv(temperature_c);
  return s;
}

// Drives sweeps through a core with its own clock.
struct Bench {
  Core core;
  uint32_t now_ms{0};

  Readings sweep(Sweep s) {
    s.now_ms = now_ms;
    now_ms += SWEEP_MS;
    return core.on_sweep(s);
  }
  Readings run(const Sweep &s, uint32_t for_ms) {
    Readings last{};
    for (uint32_t end = now_ms + for_ms; now_ms < end;) last = sweep(s);
    return last;
  }

  // Way 1 live for SETTLE_MS at temperature_c, then dead until it zeros at zero_mv. Returns the
  // zeroing sweep's reading of way 1.
  WayReading rezero(float temperature_c, float zero_mv) {
    run(sweep_at(temperature_c, zero_mv, true), SETTLE_MS);
    Sweep dead = sweep_at(temperature_c, zero_mv, false);
    for (;;) {
      Readings r = sweep(dead);
      if (r.way[0].new_zero) return r.way[0];
    }
  }

  // Way 1's current, live at temperature_c with its sensor at way_1_mv, once the Vbe has settled.
  float current_a(float temperature_c, float way_1_mv) {
    return run(sweep_at(temperature_c, way_1_mv, true), SETTLE_MS).way[0].current_a;
  }
};

// Zeros way 1 at 25 °C and 36 °C in turn, each step a sample of the given tempco. Returns the last
// zero, taken at 36 °C after an odd number of samples.
float learn(Bench &b, std::initializer_list<float> samples) {
  float zero_mv = NOMINAL_ZERO_MV;
  float k = 11.0f;
  b.rezero(25.0f, zero_mv);
  for (float sample : samples) {
    zero_mv += drift_mv(sample, k);
    b.rezero(k > 0 ? 36.0f : 25.0f, zero_mv);
    k = -k;
  }
  return zero_mv;
}

// 3 samples of 2 mA/K blend to this tempco.
constexpr float LEARNT_MA_PER_K = 1.15625f;

}  // namespace

TEST_CASE("a re-zero at least 10 K from the stored zero blends a quarter of its tempco in") {
  Bench b;
  b.rezero(25.0f, NOMINAL_ZERO_MV);
  CHECK(b.core.record(0).tempco.samples == 0);

  b.rezero(36.0f, NOMINAL_ZERO_MV + drift_mv(2.0f, 11.0f));
  CHECK(b.core.record(0).tempco.ma_per_k == doctest::Approx(0.5f));
  CHECK(b.core.record(0).tempco.samples == 1);

  SUBCASE("a re-zero under 10 K away takes no sample") {
    b.rezero(27.0f, NOMINAL_ZERO_MV + drift_mv(2.0f, 11.0f));
    CHECK(b.core.record(0).tempco.ma_per_k == doctest::Approx(0.5f));
    CHECK(b.core.record(0).tempco.samples == 1);
  }
  SUBCASE("the next sample blends with the last") {
    b.rezero(25.0f, NOMINAL_ZERO_MV);
    CHECK(b.core.record(0).tempco.ma_per_k == doctest::Approx(0.875f));
    CHECK(b.core.record(0).tempco.samples == 2);
  }
}

TEST_CASE("the tempco is clamped") {
  Bench b;
  b.rezero(25.0f, NOMINAL_ZERO_MV);
  b.rezero(36.0f, NOMINAL_ZERO_MV + drift_mv(40.0f, 11.0f));
  CHECK(b.core.record(0).tempco.ma_per_k == doctest::Approx(TEMPCO_LIMIT_MA_PER_K));
  // Back down 11 K with a sample of −80 mA/K.
  b.rezero(25.0f, NOMINAL_ZERO_MV + drift_mv(40.0f, 11.0f) + drift_mv(-80.0f, -11.0f));
  CHECK(b.core.record(0).tempco.ma_per_k == doctest::Approx(-TEMPCO_LIMIT_MA_PER_K));
}

TEST_CASE("the tempco moves the zero once 3 samples agree in sign and within 2 mA/K") {
  Bench b;
  SUBCASE("3 agreeing samples: zero_now = zero + tempco × ΔT") {
    float zero_mv = learn(b, {2.0f, 2.0f, 2.0f});
    REQUIRE(b.core.record(0).tempco.ma_per_k == doctest::Approx(LEARNT_MA_PER_K));
    // The last zero was at 36 °C; 10 K above it the tempco moves the zero by 11.5625 mA.
    CHECK(b.current_a(46.0f, zero_mv) == doctest::Approx(0.0115625f).scale(0).epsilon(0.01));
  }
  SUBCASE("only 2 samples") {
    float zero_mv = learn(b, {2.0f, 2.0f});
    CHECK(b.current_a(46.0f, zero_mv) == doctest::Approx(0.0f));
  }
  SUBCASE("samples that disagree in sign") {
    float zero_mv = learn(b, {2.0f, 2.0f, -0.5f});
    CHECK(b.core.record(0).tempco.ma_per_k != doctest::Approx(0.0f));
    CHECK(b.current_a(46.0f, zero_mv) == doctest::Approx(0.0f));
  }
  SUBCASE("samples more than 2 mA/K apart") {
    float zero_mv = learn(b, {1.0f, 3.5f, 1.0f});
    CHECK(b.current_a(46.0f, zero_mv) == doctest::Approx(0.0f));
  }
}

TEST_CASE("the Vbe is smoothed with a 1 minute time constant") {
  Bench b;
  float zero_mv = learn(b, {2.0f, 2.0f, 2.0f});
  b.run(sweep_at(36.0f, zero_mv, true), SETTLE_MS);
  // A 10 K step: after one time constant the zero has moved 1 − 1/e of the way.
  float step_a = LEARNT_MA_PER_K * 10.0f / 1000.0f;
  float after_a = b.run(sweep_at(46.0f, zero_mv, true), VBE_SMOOTHING_MS).way[0].current_a;
  CHECK(after_a == doctest::Approx(0.632f * step_a).scale(0).epsilon(0.02));
}

TEST_CASE("the chin's diode stands in when the even arm's Vbe is out of range") {
  Bench b;
  float zero_mv = learn(b, {2.0f, 2.0f, 2.0f});
  Sweep hot = sweep_at(46.0f, zero_mv, true);
  SUBCASE("shorted") { hot.vbe_mv[DIODE_EVEN_ARM] = VBE_PLAUSIBLE_MIN_MV - 1.0f; }
  SUBCASE("open") { hot.vbe_mv[DIODE_EVEN_ARM] = VBE_PLAUSIBLE_MAX_MV + 1.0f; }
  float after_a = b.run(hot, SETTLE_MS).way[0].current_a;
  CHECK(after_a == doctest::Approx(LEARNT_MA_PER_K * 10.0f / 1000.0f).scale(0).epsilon(0.01));
}
