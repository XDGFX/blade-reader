#include "doctest.h"

#include "support.h"

using namespace blade_test;

namespace {

// Way `way`'s sense line for a sensor output of out_mv, on whichever arm it sits.
void set_out_mv(Sweep &s, int way, float out_mv) {
  s.sense_mv[way - 1] = way % 2 == 0 ? out_mv * EVEN_ARM_DIVIDER : out_mv;
}

// A stored zero `above_mv` over the nominal zero, at room temperature.
WayRecord zeroed_at(float above_mv) { return WayRecord{{true, NOMINAL_ZERO_MV + above_mv, VBE_AT_25C_MV, 0}}; }

// Every way live at 12 V and dead-centre on the nominal zero, way `way`'s sensor at out_mv.
Sweep live_with(int way, float out_mv) {
  Sweep s = all_live();
  set_out_mv(s, way, out_mv);
  return s;
}

}  // namespace

TEST_CASE("an unzeroed way reads against the median of its own arm's stored zeros") {
  FakeStorage storage;
  // The odd arm's zeros sit 7, 16 and 10 mV high: the median is 10 mV. The even arm's sit far off.
  storage.put_way(3, zeroed_at(7.0f));
  storage.put_way(5, zeroed_at(16.0f));
  storage.put_way(7, zeroed_at(10.0f));
  storage.put_way(2, zeroed_at(40.0f));
  Core core;
  core.start(storage);
  Readings r = core.on_sweep(live_with(1, NOMINAL_ZERO_MV + 10.0f));
  CHECK(r.way[0].current_a == doctest::Approx(0.0f));
}

TEST_CASE("with an even count of zeros on its arm, an unzeroed way reads against the middle two's mean") {
  FakeStorage storage;
  // The even arm's zeros sit 7, 12, 14 and 30 mV high: the middle two's mean is 13 mV.
  storage.put_way(4, zeroed_at(7.0f));
  storage.put_way(6, zeroed_at(12.0f));
  storage.put_way(8, zeroed_at(14.0f));
  storage.put_way(10, zeroed_at(30.0f));
  storage.put_way(1, zeroed_at(-40.0f));
  Core core;
  core.start(storage);
  Readings r = core.on_sweep(live_with(2, NOMINAL_ZERO_MV + 13.0f));
  CHECK(r.way[1].current_a == doctest::Approx(0.0f));
}

TEST_CASE("an unzeroed way on an arm with no zeros reads against the nominal zero") {
  FakeStorage storage;
  storage.put_way(2, zeroed_at(10.0f));
  Core core;
  core.start(storage);
  Readings r = core.on_sweep(live_with(1, NOMINAL_ZERO_MV - GAIN_MV_PER_A));
  CHECK(r.way[0].current_a == doctest::Approx(1.0f));
}

TEST_CASE("a borrowed zero follows the zeros its arm takes") {
  FakeStorage storage;
  Core core;
  core.start(storage);
  // Way 3 dead with its sensor 12 mV high until it zeros; way 1 live with its sensor there too.
  Sweep s = live_with(1, NOMINAL_ZERO_MV + 12.0f);
  set_volts(s, 3, 0.0f);
  set_out_mv(s, 3, NOMINAL_ZERO_MV + 12.0f);
  float before_a = core.on_sweep(s).way[0].current_a;
  CHECK(before_a == doctest::Approx(-12.0f / GAIN_MV_PER_A));
  run_before(core, s, SWEEP_MS, ZERO_DONE_MS);
  s.now_ms = ZERO_DONE_MS;
  CHECK(core.on_sweep(s).way[0].current_a == doctest::Approx(0.0f));
}

TEST_CASE("a borrowed zero takes no tempco") {
  FakeStorage storage;
  // Way 3's zero is 10 mV high at room temperature, with a confident tempco of 2 mA/K.
  WayRecord way_3 = zeroed_at(10.0f);
  way_3.tempco = {2.0f, TEMPCO_CONFIDENT_SAMPLES, {2.0f, 2.0f, 2.0f}, 0};
  storage.put_way(3, way_3);
  Core core;
  core.start(storage);
  // 20 K above way 3's zero, so its own zero_now would move by 1.76 mV.
  Sweep s = live_with(1, NOMINAL_ZERO_MV + 10.0f);
  for (float &vbe : s.vbe_mv) vbe = vbe_at_mv(ROOM_C + 20.0f);
  CHECK(core.on_sweep(s).way[0].current_a == doctest::Approx(0.0f));
}

TEST_CASE("a way reading against a borrowed zero is still unzeroed, and nothing is stored for it") {
  FakeStorage storage;
  storage.zero_all_but({1});
  Core core;
  core.start(storage);
  Readings r = run(core, live_with(1, NOMINAL_ZERO_MV), 0, ZERO_DONE_MS);
  CHECK(r.way[0].current_a == doctest::Approx(0.0f));
  CHECK_FALSE(r.way[0].new_zero);
  CHECK_FALSE(core.record(0).zero.taken);
  CHECK_FALSE(storage.has_way(1));
  CHECK(core.not_zeroed() == "1");
  CHECK(core.install_mode());
}
