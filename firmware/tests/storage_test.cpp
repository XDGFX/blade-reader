#include "doctest.h"

#include "support.h"

using namespace blade_test;

namespace {

// Where dead_sweep puts the even arm's diode, which temperature tracking follows.
constexpr float EVEN_ARM_C = ROOM_C + 10.0f;

// Every way dead with its sensor at the nominal zero, way 3 (odd arm) 10 mV above it.
Sweep dead_sweep(uint32_t now_ms) {
  Sweep s = quiet_sweep(now_ms);
  s.sense_mv[2] = NOMINAL_ZERO_MV + 10.0f;
  set_diode_c(s, DIODE_EVEN_ARM, EVEN_ARM_C);
  return s;
}

}  // namespace

TEST_CASE("a new zero, its Vbe and its time are saved on the sweep that takes it") {
  FakeStorage storage;
  Core core;
  core.start(storage);
  run_before(core, dead_sweep(0), 0, ZERO_DONE_MS - SWEEP_MS);
  CHECK_FALSE(storage.has_way(3));

  run_before(core, dead_sweep(0), ZERO_DONE_MS - SWEEP_MS, ZERO_DONE_MS);
  REQUIRE(storage.has_way(3));
  Zero zero = storage.way(3).zero;
  CHECK(zero.taken);
  CHECK(zero.mv == doctest::Approx(NOMINAL_ZERO_MV + 10.0f));
  CHECK(zero.vbe_mv == doctest::Approx(vbe_at_mv(EVEN_ARM_C)));
  CHECK(zero.at_s == (ZERO_DONE_MS - SWEEP_MS) / 1000);
}

TEST_CASE("a way reads against the zero it was started with") {
  FakeStorage storage;
  WayRecord stored;
  stored.zero = {true, NOMINAL_ZERO_MV + 10.0f, vbe_at_mv(EVEN_ARM_C), 15};
  storage.put_way(3, stored);
  Core core;
  core.start(storage);
  Sweep s = dead_sweep(0);
  s.voltage_mv[2] = 12000.0f / VOLTAGE_DIVIDER;  // live
  CHECK(core.on_sweep(s).way[2].current_a == doctest::Approx(0.0f).epsilon(0.001));
}

TEST_CASE("a way record round-trips through its stored form") {
  WayRecord record;
  record.zero = {true, 1661.5f, 572.25f, 123456};
  Zero zero = decode_way(encode(record)).zero;
  CHECK(zero.taken);
  CHECK(zero.mv == 1661.5f);
  CHECK(zero.vbe_mv == 572.25f);
  CHECK(zero.at_s == 123456u);
}

TEST_CASE("a field with an unknown format version reads as its default") {
  WayRecord record;
  record.zero = {true, 1661.5f, 572.25f, 15};
  RecordBytes bytes = encode(record);
  bytes[field_at(bytes, WAY_FIELD_ZERO) + FIELD_VERSION_AT] = ZERO_FIELD_VERSION + 1;
  CHECK_FALSE(decode_way(bytes).zero.taken);
}

TEST_CASE("a field this firmware doesn't know is skipped, and the fields after it still read") {
  WayRecord record;
  record.zero = {true, 1661.5f, 572.25f, 15};
  RecordBytes zero_only = encode(record);
  RecordBytes bytes{};
  const uint8_t unknown[] = {0xEE, 1, 2, 0xAB, 0xCD};
  size_t at = 0;
  for (uint8_t b : unknown) bytes[at++] = b;
  for (size_t i = 0; at < bytes.size(); i++) bytes[at++] = zero_only[i];
  Zero zero = decode_way(bytes).zero;
  CHECK(zero.taken);
  CHECK(zero.mv == 1661.5f);
}

TEST_CASE("an empty record is an unzeroed way") {
  CHECK_FALSE(decode_way(RecordBytes{}).zero.taken);
}

TEST_CASE("Not zeroed lists the ways without a zero, or says None") {
  FakeStorage storage;
  WayRecord zeroed;
  zeroed.zero = {true, NOMINAL_ZERO_MV, VBE_AT_25C_MV, 15};
  for (int way = 1; way <= WAYS; way++) {
    if (way != 3 && way != 7) storage.put_way(way, zeroed);
  }
  Core core;
  core.start(storage);
  CHECK(core.not_zeroed() == "Not zeroed: 3, 7");

  storage.put_way(3, zeroed);
  storage.put_way(7, zeroed);
  core.start(storage);
  CHECK(core.not_zeroed() == "None");
}

TEST_CASE("the sweep that takes a zero flags it, and only that sweep") {
  Core core;
  run_before(core, dead_sweep(0), 0, ZERO_DONE_MS - SWEEP_MS);
  Readings taken = core.on_sweep(dead_sweep(ZERO_DONE_MS - SWEEP_MS));
  CHECK(taken.way[2].new_zero);
  CHECK_FALSE(core.on_sweep(dead_sweep(ZERO_DONE_MS)).way[2].new_zero);
}

TEST_CASE("an accepted gain trim is saved at once, and a rejected one isn't") {
  FakeStorage storage;
  Core core;
  core.start(storage);
  REQUIRE(core.set_gain_trim(4, 1.05f));
  REQUIRE(storage.has_way(5));
  CHECK(storage.way(5).gain_trim == 1.05f);
  CHECK(storage.saves == 1);

  CHECK_FALSE(core.set_gain_trim(4, GAIN_TRIM_MAX + 0.01f));
  CHECK(storage.saves == 1);
  CHECK(storage.way(5).gain_trim == 1.05f);
}

TEST_CASE("a way keeps its zero when its gain trim is set") {
  FakeStorage storage;
  WayRecord stored;
  stored.zero = {true, NOMINAL_ZERO_MV + 10.0f, vbe_at_mv(EVEN_ARM_C), 15};
  storage.put_way(3, stored);
  Core core;
  core.start(storage);
  REQUIRE(core.set_gain_trim(2, 0.95f));
  CHECK(storage.way(3).zero.taken);
  CHECK(storage.way(3).zero.mv == NOMINAL_ZERO_MV + 10.0f);
}

TEST_CASE("a way reads with the gain trim it was started with") {
  FakeStorage storage;
  WayRecord stored;
  stored.gain_trim = 1.05f;
  storage.put_way(3, stored);
  Core core;
  core.start(storage);
  Sweep s = dead_sweep(0);
  s.sense_mv[2] = NOMINAL_ZERO_MV - 440.0f;  // 10 A at the nominal gain
  CHECK(core.on_sweep(s).way[2].current_a == doctest::Approx(10.5f));
}

TEST_CASE("a gain trim round-trips through the way's stored form, alongside its zero") {
  WayRecord record;
  record.zero = {true, 1661.5f, 572.25f, 15};
  record.gain_trim = 0.97f;
  WayRecord read = decode_way(encode(record));
  CHECK(read.gain_trim == 0.97f);
  CHECK(read.zero.mv == 1661.5f);
}

TEST_CASE("a way without a stored gain trim, or with one of another format version, reads 1.0") {
  CHECK(decode_way(RecordBytes{}).gain_trim == 1.0f);

  WayRecord record;
  record.gain_trim = 0.97f;
  RecordBytes bytes = encode(record);
  bytes[field_at(bytes, WAY_FIELD_GAIN_TRIM) + FIELD_VERSION_AT] = GAIN_TRIM_FIELD_VERSION + 1;
  CHECK(decode_way(bytes).gain_trim == 1.0f);
}

namespace {

WayRecord learnt_record() {
  WayRecord record;
  record.zero = {true, 1661.5f, 572.25f, 15};
  record.tempco.ma_per_k = 1.25f;
  record.tempco.samples = 4;
  record.tempco.recent[0] = 1.5f;
  record.tempco.recent[1] = 1.0f;
  record.tempco.recent[2] = 2.0f;
  record.tempco.self_check_streak = 1;
  return record;
}

}  // namespace

TEST_CASE("a way's tempco, its samples and its self-check streak round-trip through the stored form") {
  Tempco tempco = decode_way(encode(learnt_record())).tempco;
  CHECK(tempco.ma_per_k == 1.25f);
  CHECK(tempco.samples == 4);
  CHECK(tempco.recent[0] == 1.5f);
  CHECK(tempco.recent[1] == 1.0f);
  CHECK(tempco.recent[2] == 2.0f);
  CHECK(tempco.self_check_streak == 1);
}

TEST_CASE("a tempco field of another format version resets only that field") {
  RecordBytes bytes = encode(learnt_record());
  bytes[field_at(bytes, WAY_FIELD_TEMPCO) + FIELD_VERSION_AT]++;
  WayRecord record = decode_way(bytes);
  CHECK(record.tempco.ma_per_k == 0.0f);
  CHECK(record.tempco.samples == 4);
  CHECK(record.tempco.self_check_streak == 1);
  CHECK(record.zero.taken);
}

TEST_CASE("a stored tempco moves the zero from the first sweep") {
  FakeStorage storage;
  WayRecord stored = learnt_record();
  stored.zero.vbe_mv = vbe_at_mv(ROOM_C);
  storage.put_way(3, stored);
  Core core;
  core.start(storage);
  Sweep s = dead_sweep(0);
  s.sense_mv[2] = stored.zero.mv;
  set_volts(s, 3, 12.0f);
  float expected_a = stored.tempco.ma_per_k * (EVEN_ARM_C - ROOM_C) / 1000.0f;
  CHECK(core.on_sweep(s).way[2].current_a == doctest::Approx(expected_a).scale(0).epsilon(0.001));
}

TEST_CASE("the tempco, its count and its streak are saved with the re-zero that changes them") {
  FakeStorage storage;
  WayRecord stored;
  // Far enough below dead_sweep's even arm for a tempco sample, and way 3 hasn't drifted.
  stored.zero = {true, NOMINAL_ZERO_MV + 10.0f, vbe_at_mv(EVEN_ARM_C - TEMPCO_SAMPLE_MIN_K - 1.0f), 15};
  storage.put_way(3, stored);
  Core core;
  core.start(storage);
  run_before(core, dead_sweep(0), 0, ZERO_DONE_MS);
  Tempco saved = storage.way(3).tempco;
  CHECK(saved.samples == 1);
  CHECK(saved.ma_per_k == 0.0f);
  CHECK(saved.self_check_streak == 0);
}
