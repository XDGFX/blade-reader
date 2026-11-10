// SPDX-License-Identifier: AGPL-3.0-or-later
#include "doctest.h"

#include "support.h"

using namespace blade_test;

namespace {

// Long enough at one temperature for the smoothed Vbe to have caught up with it.
constexpr uint32_t SETTLE_MS = 20 * VBE_SMOOTHING_MS;

// The two temperatures way 1 re-zeros at to take tempco samples: far enough apart for a sample.
constexpr float SAMPLE_K = TEMPCO_SAMPLE_MIN_K + 1.0f;
constexpr float COOL_C = ROOM_C;
constexpr float WARM_C = COOL_C + SAMPLE_K;
// How far from the stored zero a re-zero checks the tempco without taking a sample, and how far
// does neither.
constexpr float CHECK_ONLY_K = (SELF_CHECK_MIN_K + TEMPCO_SAMPLE_MIN_K) / 2.0f;
constexpr float NEITHER_K = SELF_CHECK_MIN_K / 2.0f;
// A step above the last zero to read the tempco's correction across.
constexpr float STEP_K = 10.0f;

// Way 1's zero drift, in output mV, that a tempco of ma_per_k gives over k kelvin.
float drift_mv(float ma_per_k, float k) { return ma_per_k * k * GAIN_MV_PER_A / 1000.0f; }

// The tempco after blending in a sample.
float blend(float ma_per_k, float sample) { return ma_per_k + TEMPCO_BLEND * (sample - ma_per_k); }

// Every way at the nominal zero, way 1 (odd arm) at way_1_mv, every diode at temperature_c.
Sweep sweep_at(float temperature_c, float way_1_mv, bool live) {
  Sweep s = quiet_sweep();
  for (int way = 1; way <= WAYS; way++) set_volts(s, way, live ? 12.0f : 0.0f);
  s.sense_mv[0] = way_1_mv;
  for (float &vbe : s.vbe_mv) vbe = vbe_at_mv(temperature_c);
  return s;
}

// Drives sweeps through a started core with its own clock.
struct Bench {
  FakeStorage storage;
  Core core;
  uint32_t now_ms{0};

  Bench() { core.start(storage); }

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

  // Way 1's tempco as last saved.
  Tempco tempco() const { return storage.way(1).tempco; }
};

// Zeros way 1 at COOL_C and WARM_C in turn, each step a sample of the given tempco. Returns the
// last zero, taken at WARM_C after an odd number of samples.
float learn(Bench &b, std::initializer_list<float> samples) {
  float zero_mv = NOMINAL_ZERO_MV;
  float k = SAMPLE_K;
  b.rezero(COOL_C, zero_mv);
  for (float sample : samples) {
    zero_mv += drift_mv(sample, k);
    b.rezero(k > 0 ? WARM_C : COOL_C, zero_mv);
    k = -k;
  }
  return zero_mv;
}

// The sample learn() takes three of, and the tempco they blend to.
constexpr float SAMPLE_MA_PER_K = 2.0f;
const float LEARNT_MA_PER_K = blend(blend(blend(0.0f, SAMPLE_MA_PER_K), SAMPLE_MA_PER_K), SAMPLE_MA_PER_K);

}  // namespace

TEST_CASE("a re-zero at least TEMPCO_SAMPLE_MIN_K from the stored zero blends TEMPCO_BLEND of its tempco in") {
  Bench b;
  b.rezero(COOL_C, NOMINAL_ZERO_MV);
  CHECK(b.tempco().samples == 0);

  float warm_zero_mv = NOMINAL_ZERO_MV + drift_mv(SAMPLE_MA_PER_K, SAMPLE_K);
  b.rezero(WARM_C, warm_zero_mv);
  float first = blend(0.0f, SAMPLE_MA_PER_K);
  CHECK(b.tempco().ma_per_k == doctest::Approx(first));
  CHECK(b.tempco().samples == 1);

  SUBCASE("a re-zero nearer takes no sample") {
    b.rezero(WARM_C - (TEMPCO_SAMPLE_MIN_K - 1.0f), warm_zero_mv);
    CHECK(b.tempco().ma_per_k == doctest::Approx(first));
    CHECK(b.tempco().samples == 1);
  }
  SUBCASE("the next sample blends with the last") {
    b.rezero(COOL_C, NOMINAL_ZERO_MV);
    CHECK(b.tempco().ma_per_k == doctest::Approx(blend(first, SAMPLE_MA_PER_K)));
    CHECK(b.tempco().samples == 2);
  }
}

TEST_CASE("the tempco is clamped") {
  // Samples far beyond the limit either way.
  constexpr float HUGE_MA_PER_K = 8.0f * TEMPCO_LIMIT_MA_PER_K;
  Bench b;
  b.rezero(COOL_C, NOMINAL_ZERO_MV);
  float warm_zero_mv = NOMINAL_ZERO_MV + drift_mv(HUGE_MA_PER_K, SAMPLE_K);
  b.rezero(WARM_C, warm_zero_mv);
  CHECK(b.tempco().ma_per_k == doctest::Approx(TEMPCO_LIMIT_MA_PER_K));
  b.rezero(COOL_C, warm_zero_mv + drift_mv(-2.0f * HUGE_MA_PER_K, -SAMPLE_K));
  CHECK(b.tempco().ma_per_k == doctest::Approx(-TEMPCO_LIMIT_MA_PER_K));
}

TEST_CASE("the tempco moves the zero once TEMPCO_CONFIDENT_SAMPLES samples agree in sign and within TEMPCO_AGREE_MA_PER_K") {
  static_assert(TEMPCO_CONFIDENT_SAMPLES == 3, "the cases below give three samples");
  Bench b;
  SUBCASE("agreeing samples: zero_now = zero + tempco × ΔT") {
    float zero_mv = learn(b, {SAMPLE_MA_PER_K, SAMPLE_MA_PER_K, SAMPLE_MA_PER_K});
    REQUIRE(b.tempco().ma_per_k == doctest::Approx(LEARNT_MA_PER_K));
    float expected_a = LEARNT_MA_PER_K * STEP_K / 1000.0f;
    CHECK(b.current_a(WARM_C + STEP_K, zero_mv) == doctest::Approx(expected_a).scale(0).epsilon(0.01));
  }
  SUBCASE("too few samples") {
    float zero_mv = learn(b, {SAMPLE_MA_PER_K, SAMPLE_MA_PER_K});
    CHECK(b.current_a(WARM_C + STEP_K, zero_mv) == doctest::Approx(0.0f));
  }
  SUBCASE("samples that disagree in sign") {
    float zero_mv = learn(b, {SAMPLE_MA_PER_K, SAMPLE_MA_PER_K, -TEMPCO_AGREE_MA_PER_K / 4.0f});
    CHECK(b.tempco().ma_per_k != doctest::Approx(0.0f));
    CHECK(b.current_a(WARM_C + STEP_K, zero_mv) == doctest::Approx(0.0f));
  }
  SUBCASE("samples further apart than TEMPCO_AGREE_MA_PER_K") {
    float low = TEMPCO_AGREE_MA_PER_K / 2.0f;
    float zero_mv = learn(b, {low, low + 1.25f * TEMPCO_AGREE_MA_PER_K, low});
    CHECK(b.current_a(WARM_C + STEP_K, zero_mv) == doctest::Approx(0.0f));
  }
}

TEST_CASE("the Vbe is smoothed with a VBE_SMOOTHING_MS time constant") {
  Bench b;
  float zero_mv = learn(b, {SAMPLE_MA_PER_K, SAMPLE_MA_PER_K, SAMPLE_MA_PER_K});
  b.run(sweep_at(WARM_C, zero_mv, true), SETTLE_MS);
  // A step: after one time constant the zero has moved 1 − 1/e of the way.
  float step_a = LEARNT_MA_PER_K * STEP_K / 1000.0f;
  float after_a = b.run(sweep_at(WARM_C + STEP_K, zero_mv, true), VBE_SMOOTHING_MS).way[0].current_a;
  CHECK(after_a == doctest::Approx(0.632f * step_a).scale(0).epsilon(0.02));
}

TEST_CASE("the chin's diode stands in when the even arm's Vbe is out of range") {
  Bench b;
  float zero_mv = learn(b, {SAMPLE_MA_PER_K, SAMPLE_MA_PER_K, SAMPLE_MA_PER_K});
  Sweep hot = sweep_at(WARM_C + STEP_K, zero_mv, true);
  SUBCASE("shorted") { hot.vbe_mv[DIODE_EVEN_ARM] = VBE_PLAUSIBLE_MIN_MV - 1.0f; }
  SUBCASE("open") { hot.vbe_mv[DIODE_EVEN_ARM] = VBE_PLAUSIBLE_MAX_MV + 1.0f; }
  float after_a = b.run(hot, SETTLE_MS).way[0].current_a;
  CHECK(after_a == doctest::Approx(LEARNT_MA_PER_K * STEP_K / 1000.0f).scale(0).epsilon(0.01));
}

TEST_CASE("a re-zero SELF_CHECK_MIN_K or more from the stored zero checks the tempco's prediction") {
  Bench b;
  b.rezero(COOL_C, NOMINAL_ZERO_MV);
  float zero_mv = NOMINAL_ZERO_MV + drift_mv(SAMPLE_MA_PER_K, SAMPLE_K);
  b.rezero(WARM_C, zero_mv);
  float first = blend(0.0f, SAMPLE_MA_PER_K);
  REQUIRE(b.tempco().ma_per_k == doctest::Approx(first));

  SUBCASE("logged with ΔT and the measured, predicted and uncorrected zeros") {
    float measured_mv = zero_mv + drift_mv(SAMPLE_MA_PER_K, -CHECK_ONLY_K);
    SelfCheck check = b.rezero(WARM_C - CHECK_ONLY_K, measured_mv).self_check;
    CHECK(check.done);
    CHECK(check.k == doctest::Approx(-CHECK_ONLY_K).epsilon(0.001));
    CHECK(check.measured_mv == doctest::Approx(measured_mv));
    CHECK(check.predicted_mv == doctest::Approx(zero_mv + drift_mv(first, -CHECK_ONLY_K)));
    CHECK(check.uncorrected_mv == doctest::Approx(zero_mv));
  }
  SUBCASE("not nearer than SELF_CHECK_MIN_K") {
    CHECK_FALSE(b.rezero(WARM_C - NEITHER_K, zero_mv).self_check.done);
  }
  SUBCASE("SELF_CHECK_RESET_AFTER worse than no correction in a row reset the tempco and its count") {
    static_assert(SELF_CHECK_RESET_AFTER == 2, "the cases below give two checks");
    // Zeros that drift against the tempco, down and back up.
    float against_mv = zero_mv + drift_mv(-SAMPLE_MA_PER_K, -CHECK_ONLY_K);
    b.rezero(WARM_C - CHECK_ONLY_K, against_mv);
    CHECK(b.tempco().self_check_streak == 1);
    CHECK(b.tempco().samples == 1);
    SUBCASE("the second resets") {
      b.rezero(WARM_C, zero_mv);
      CHECK(b.tempco().ma_per_k == 0.0f);
      CHECK(b.tempco().samples == 0);
      CHECK(b.tempco().self_check_streak == 0);
    }
    SUBCASE("a good check between them ends the streak") {
      b.rezero(WARM_C, against_mv + drift_mv(SAMPLE_MA_PER_K, CHECK_ONLY_K));
      CHECK(b.tempco().self_check_streak == 0);
      CHECK(b.tempco().ma_per_k == doctest::Approx(first));
    }
  }
}
