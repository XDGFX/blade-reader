#include <map>
#include <utility>

#include "doctest.h"

#include "constants.h"
#include "core.h"
#include "core_storage.h"

using namespace blade_core;

namespace {

constexpr uint32_t SWEEP_MS = 140;

// Flash that outlives a Core, so a second Core started from it is the next boot.
class Flash : public Storage {
 public:
  bool load(RecordKey key, RecordBytes &bytes) override {
    auto it = records.find(id(key));
    if (it == records.end()) return false;
    bytes = it->second;
    return true;
  }
  void save(RecordKey key, const RecordBytes &bytes) override { records[id(key)] = bytes; }
  // Every way zeroed but the ones listed.
  void zero_all_but(std::initializer_list<int> unzeroed_ways) {
    for (int w = 0; w < WAYS; w++) {
      bool skip = false;
      for (int way : unzeroed_ways) skip |= way == w + 1;
      if (!skip) records[id({RECORD_WAY, w})] = encode(WayRecord{{true, NOMINAL_ZERO_MV, 590.0f, 0}});
    }
  }

  std::map<int, RecordBytes> records;

 private:
  static int id(RecordKey key) { return key.kind * 256 + key.way_index; }
};

void set_volts(Sweep &s, int way, float volts) {
  s.voltage_mv[way - 1] = volts * 1000.0f / VOLTAGE_DIVIDER;
}

// Every way live at 12 V with no load, so no way zeros.
Sweep all_live() {
  Sweep s{};
  for (int w = 0; w < WAYS; w++) {
    bool even_arm = (w + 1) % 2 == 0;
    s.sense_mv[w] = even_arm ? NOMINAL_ZERO_MV * EVEN_ARM_DIVIDER : NOMINAL_ZERO_MV;
    set_volts(s, w + 1, 12.0f);
  }
  for (float &vbe : s.vbe_mv) vbe = 590.0f;
  return s;
}

// Feeds the same sweep every SWEEP_MS from `from_ms`, the last at `until_ms`, and returns what the
// last one worked out.
Readings run(Core &core, Sweep s, uint32_t from_ms, uint32_t until_ms) {
  for (uint32_t t = from_ms; t < until_ms; t += SWEEP_MS) {
    s.now_ms = t;
    core.on_sweep(s);
  }
  s.now_ms = until_ms;
  return core.on_sweep(s);
}

}  // namespace

TEST_CASE("install mode starts at boot if any way has no zero, and not otherwise") {
  Flash one_missing, none_missing;
  one_missing.zero_all_but({7});
  none_missing.zero_all_but({});
  Core a, b;
  a.start(one_missing);
  b.start(none_missing);
  run(a, all_live(), 0, 0);
  run(b, all_live(), 0, 0);
  CHECK(a.install_mode());
  CHECK_FALSE(b.install_mode());
}

TEST_CASE("install mode ends when every way has a zero") {
  Flash flash;
  flash.zero_all_but({7});
  Core core;
  core.start(flash);
  Sweep s = all_live();
  set_volts(s, 7, 0.0f);
  run(core, s, 0, ZERO_DEAD_MS);
  CHECK(core.install_mode());
  run(core, s, ZERO_DEAD_MS, ZERO_DEAD_MS + ZERO_MEAN_MS + SWEEP_MS);
  CHECK(core.record(6).zero.taken);
  CHECK_FALSE(core.install_mode());
}

TEST_CASE("install mode ends INSTALL_MODE_MS after boot with ways still unzeroed") {
  Flash flash;
  flash.zero_all_but({7});
  Core core;
  core.start(flash);
  run(core, all_live(), 0, INSTALL_MODE_MS - SWEEP_MS);
  CHECK(core.install_mode());
  run(core, all_live(), INSTALL_MODE_MS, INSTALL_MODE_MS);
  CHECK_FALSE(core.install_mode());
}

TEST_CASE("install mode stays ended when the millisecond clock wraps") {
  Flash flash;
  flash.zero_all_but({7});
  Core core;
  core.start(flash);
  run(core, all_live(), 0, 0);
  run(core, all_live(), INSTALL_MODE_MS, INSTALL_MODE_MS);
  run(core, all_live(), UINT32_MAX, UINT32_MAX);
  run(core, all_live(), 0, 0);
  CHECK_FALSE(core.install_mode());
}

TEST_CASE("install mode returns at the next boot while any way is still unzeroed") {
  Flash flash;
  flash.zero_all_but({7});
  Core first;
  first.start(flash);
  run(first, all_live(), 0, INSTALL_MODE_MS);
  REQUIRE_FALSE(first.install_mode());
  Core next;
  next.start(flash);
  run(next, all_live(), 0, 0);
  CHECK(next.install_mode());
}

TEST_CASE("the red LED takes the highest-priority cause: zeroing, then a fault, then install mode") {
  struct Case {
    bool zeroing, fault, install_blink;
    Led led;
  };
  const Case cases[] = {
      {false, false, false, LED_OFF},        {false, false, true, LED_SLOW_BLINK},
      {false, true, false, LED_STEADY},      {false, true, true, LED_STEADY},
      {true, false, false, LED_FAST_BLINK},  {true, false, true, LED_FAST_BLINK},
      {true, true, false, LED_FAST_BLINK},   {true, true, true, LED_FAST_BLINK},
  };
  for (const Case &c : cases) {
    CAPTURE(c.zeroing);
    CAPTURE(c.fault);
    CAPTURE(c.install_blink);
    CHECK(led_for({c.zeroing, c.fault, c.install_blink}) == c.led);
  }
}

TEST_CASE("the red LED blinks fast while a zero is being taken, and only then") {
  Flash flash;
  flash.zero_all_but({});
  Core core;
  core.start(flash);
  Sweep s = all_live();
  set_volts(s, 7, 0.0f);  // empty since boot, so it zeros without a fault
  CHECK(run(core, s, 0, ZERO_DEAD_MS - SWEEP_MS).led == LED_OFF);
  CHECK(run(core, s, ZERO_DEAD_MS, ZERO_DEAD_MS).led == LED_FAST_BLINK);
  CHECK(run(core, s, ZERO_DEAD_MS, ZERO_DEAD_MS + ZERO_MEAN_MS - SWEEP_MS).led == LED_FAST_BLINK);
  CHECK(run(core, s, ZERO_DEAD_MS + ZERO_MEAN_MS, ZERO_DEAD_MS + ZERO_MEAN_MS + SWEEP_MS).led == LED_OFF);
}

TEST_CASE("the red LED is steady while there is a fault") {
  Flash flash;
  flash.zero_all_but({});
  Core core;
  core.start(flash);
  Sweep s = all_live();
  run(core, s, 0, 1000);
  set_volts(s, 7, 0.0f);
  CHECK(run(core, s, 1000 + SWEEP_MS, 1000 + BLOWN_AFTER_MS + SWEEP_MS).led == LED_STEADY);
}

TEST_CASE("in install mode the red LED blinks slowly while a live way is unzeroed, not a dead one") {
  Flash flash;
  flash.zero_all_but({7});
  Core live, dead;
  live.start(flash);
  dead.start(flash);
  Sweep s = all_live();
  CHECK(run(live, s, 0, 0).led == LED_SLOW_BLINK);
  set_volts(s, 7, 0.0f);
  CHECK(run(dead, s, 0, 0).led == LED_OFF);
}

TEST_CASE("an unzeroed live way doesn't blink the red LED once install mode has ended") {
  Flash flash;
  flash.zero_all_but({7});
  Core core;
  core.start(flash);
  Readings r = run(core, all_live(), 0, INSTALL_MODE_MS);
  CHECK_FALSE(r.faults.any());
  CHECK(r.led == LED_OFF);
}

TEST_CASE("a blink is lit for the first half of each period") {
  for (auto blink : {std::pair{LED_FAST_BLINK, FAST_BLINK_MS}, {LED_SLOW_BLINK, SLOW_BLINK_MS}}) {
    Led led = blink.first;
    uint32_t period_ms = blink.second;
    CAPTURE(led);
    CHECK(led_lit(led, 0));
    CHECK(led_lit(led, period_ms / 2 - 1));
    CHECK_FALSE(led_lit(led, period_ms / 2));
    CHECK_FALSE(led_lit(led, period_ms - 1));
    CHECK(led_lit(led, period_ms));
  }
}

TEST_CASE("steady is always lit and off never") {
  for (uint32_t t : {0u, FAST_BLINK_MS / 2, SLOW_BLINK_MS / 2}) {
    CHECK(led_lit(LED_STEADY, t));
    CHECK_FALSE(led_lit(LED_OFF, t));
  }
}
