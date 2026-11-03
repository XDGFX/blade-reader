#include <map>

#include "doctest.h"

#include "constants.h"
#include "core.h"
#include "core_storage.h"

using namespace blade_core;

namespace {

constexpr uint32_t SWEEP_MS = 140;
constexpr uint32_t ZERO_DONE_MS = ZERO_DEAD_MS + ZERO_MEAN_MS + SWEEP_MS;

// Flash as the core sees it: whatever was last saved under each key.
class FakeStorage : public Storage {
 public:
  bool load(RecordKey key, RecordBytes &bytes) override {
    auto it = records.find(id(key));
    if (it == records.end()) return false;
    bytes = it->second;
    return true;
  }
  void save(RecordKey key, const RecordBytes &bytes) override {
    records[id(key)] = bytes;
    saves++;
  }
  void put_way(int way, const WayRecord &record) { records[id({RECORD_WAY, way - 1})] = encode(record); }
  bool has_way(int way) { return records.count(id({RECORD_WAY, way - 1})) > 0; }
  WayRecord way(int way) { return decode_way(records.at(id({RECORD_WAY, way - 1}))); }

  std::map<int, RecordBytes> records;
  int saves{0};

 private:
  static int id(RecordKey key) { return key.kind * 256 + key.way_index; }
};

// Every way dead with its sensor at the nominal zero, way 3 (odd arm) 10 mV above it.
Sweep dead_sweep(uint32_t now_ms) {
  Sweep s{};
  s.now_ms = now_ms;
  for (int w = 0; w < WAYS; w++) {
    bool even_arm = (w + 1) % 2 == 0;
    s.sense_mv[w] = even_arm ? NOMINAL_ZERO_MV * EVEN_ARM_DIVIDER : NOMINAL_ZERO_MV;
  }
  s.sense_mv[2] = NOMINAL_ZERO_MV + 10.0f;
  for (float &vbe : s.vbe_mv) vbe = 590.0f;
  s.vbe_mv[DIODE_EVEN_ARM] = 570.0f;
  return s;
}

void run(Core &core, Sweep s, uint32_t from_ms, uint32_t to_ms) {
  for (uint32_t t = from_ms; t < to_ms; t += SWEEP_MS) {
    s.now_ms = t;
    core.on_sweep(s);
  }
}

}  // namespace

TEST_CASE("a new zero, its Vbe and its time are saved on the sweep that takes it") {
  FakeStorage storage;
  Core core;
  core.start(storage);
  run(core, dead_sweep(0), 0, ZERO_DONE_MS - SWEEP_MS);
  CHECK_FALSE(storage.has_way(3));

  run(core, dead_sweep(0), ZERO_DONE_MS - SWEEP_MS, ZERO_DONE_MS);
  REQUIRE(storage.has_way(3));
  Zero zero = storage.way(3).zero;
  CHECK(zero.taken);
  CHECK(zero.mv == doctest::Approx(NOMINAL_ZERO_MV + 10.0f));
  CHECK(zero.vbe_mv == doctest::Approx(570.0f));
  CHECK(zero.at_s == (ZERO_DONE_MS - SWEEP_MS) / 1000);
}

TEST_CASE("a way reads against the zero it was started with") {
  FakeStorage storage;
  WayRecord stored;
  stored.zero = {true, NOMINAL_ZERO_MV + 10.0f, 570.0f, 15};
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
  REQUIRE(bytes[FIELD_ID_AT] == WAY_FIELD_ZERO);
  bytes[FIELD_VERSION_AT] = ZERO_FIELD_VERSION + 1;
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
  zeroed.zero = {true, NOMINAL_ZERO_MV, 590.0f, 15};
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
  run(core, dead_sweep(0), 0, ZERO_DONE_MS - SWEEP_MS);
  Readings taken = core.on_sweep(dead_sweep(ZERO_DONE_MS - SWEEP_MS));
  CHECK(taken.way[2].new_zero);
  CHECK(core.record(2).zero.taken);
  CHECK_FALSE(core.on_sweep(dead_sweep(ZERO_DONE_MS)).way[2].new_zero);
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

// The offset of the first field with this id in a stored record.
size_t field_at(const RecordBytes &bytes, uint8_t id) {
  size_t at = 0;
  while (bytes[at + FIELD_ID_AT] != id) at += FIELD_HEADER_BYTES + bytes[at + FIELD_LENGTH_AT];
  return at;
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
  stored.zero.vbe_mv = 590.0f;
  storage.put_way(3, stored);
  Core core;
  core.start(storage);
  Sweep s = dead_sweep(0);
  s.vbe_mv[DIODE_EVEN_ARM] = 570.0f;  // 10 K above the zero
  s.sense_mv[2] = stored.zero.mv;
  s.voltage_mv[2] = 12000.0f / VOLTAGE_DIVIDER;
  CHECK(core.on_sweep(s).way[2].current_a == doctest::Approx(0.0125f).scale(0).epsilon(0.001));
}

TEST_CASE("the tempco, its count and its streak are saved with the re-zero that changes them") {
  FakeStorage storage;
  WayRecord stored;
  stored.zero = {true, NOMINAL_ZERO_MV + 10.0f, 592.0f, 15};
  storage.put_way(3, stored);
  Core core;
  core.start(storage);
  // dead_sweep's even arm reads 570 mV, 11 K above the stored zero, and way 3 hasn't drifted.
  run(core, dead_sweep(0), 0, ZERO_DONE_MS);
  Tempco saved = storage.way(3).tempco;
  CHECK(saved.samples == 1);
  CHECK(saved.ma_per_k == 0.0f);
  CHECK(saved.self_check_streak == 0);
}
