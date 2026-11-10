// SPDX-License-Identifier: AGPL-3.0-or-later
#include "core_record.h"

#include <cstring>

namespace blade_core {

namespace {

// Fills a record field by field, each payload written as its fields' bytes in order.
class Writer {
 public:
  explicit Writer(RecordBytes &bytes) : bytes_(bytes) {}

  template<typename... T> void field(uint8_t id, uint8_t version, const T &...values) {
    size_t length = (sizeof(T) + ... + 0);
    bytes_[at_ + FIELD_ID_AT] = id;
    bytes_[at_ + FIELD_VERSION_AT] = version;
    bytes_[at_ + FIELD_LENGTH_AT] = static_cast<uint8_t>(length);
    at_ += FIELD_HEADER_BYTES;
    (put_(values), ...);
  }

 private:
  template<typename T> void put_(const T &value) {
    std::memcpy(&bytes_[at_], &value, sizeof(T));
    at_ += sizeof(T);
  }

  RecordBytes &bytes_;
  size_t at_{0};
};

// Reads one field's payload back in the order it was written.
class Payload {
 public:
  Payload(const uint8_t *data, size_t length) : data_(data), length_(length) {}

  template<typename... T> bool read(T &...values) {
    if ((sizeof(T) + ... + 0) != length_) return false;
    (get_(values), ...);
    return true;
  }

 private:
  template<typename T> void get_(T &value) {
    std::memcpy(&value, data_ + at_, sizeof(T));
    at_ += sizeof(T);
  }

  const uint8_t *data_;
  size_t length_;
  size_t at_{0};
};

// Calls on_field(id, version, payload) for each field in order, up to the end marker or the first
// field that runs past the record's end.
template<typename F> void each_field(const RecordBytes &bytes, F on_field) {
  size_t at = 0;
  while (at + FIELD_HEADER_BYTES <= bytes.size() && bytes[at + FIELD_ID_AT] != 0) {
    size_t length = bytes[at + FIELD_LENGTH_AT];
    size_t start = at + FIELD_HEADER_BYTES;
    if (start + length > bytes.size()) break;
    Payload payload(&bytes[start], length);
    on_field(bytes[at + FIELD_ID_AT], bytes[at + FIELD_VERSION_AT], payload);
    at = start + length;
  }
}

}  // namespace

RecordBytes encode(const EnergyRecord &record) {
  RecordBytes bytes{};
  Writer(bytes).field(ENERGY_FIELD_TOTAL, ENERGY_TOTAL_FIELD_VERSION, record.mws);
  return bytes;
}

EnergyRecord decode_energy(const RecordBytes &bytes) {
  EnergyRecord record;
  each_field(bytes, [&record](uint8_t id, uint8_t version, Payload &payload) {
    int64_t mws;
    if (id == ENERGY_FIELD_TOTAL && version == ENERGY_TOTAL_FIELD_VERSION && payload.read(mws)) record.mws = mws;
  });
  return record;
}

namespace {

// Every field of a way record, listed once for both directions: visit(id, version, values...) with
// the record's members that make up the field's payload, in order.
template<typename Record, typename F> void way_fields(Record &record, F visit) {
  visit(WAY_FIELD_ZERO, ZERO_FIELD_VERSION, record.zero.mv, record.zero.vbe_mv, record.zero.at_s);
  visit(WAY_FIELD_GAIN_TRIM, GAIN_TRIM_FIELD_VERSION, record.gain_trim);
  visit(WAY_FIELD_TEMPCO, TEMPCO_FIELD_VERSION, record.tempco.ma_per_k);
  visit(WAY_FIELD_TEMPCO_SAMPLES, TEMPCO_SAMPLES_FIELD_VERSION, record.tempco.samples, record.tempco.recent);
  visit(WAY_FIELD_SELF_CHECK, SELF_CHECK_FIELD_VERSION, record.tempco.self_check_streak);
}

}  // namespace

RecordBytes encode(const WayRecord &record) {
  RecordBytes bytes{};
  Writer out(bytes);
  way_fields(record, [&](uint8_t id, uint8_t version, const auto &...values) {
    // An unzeroed way stores no zero.
    if (id == WAY_FIELD_ZERO && !record.zero.taken) return;
    out.field(id, version, values...);
  });
  return bytes;
}

WayRecord decode_way(const RecordBytes &bytes) {
  WayRecord record;
  each_field(bytes, [&record](uint8_t id, uint8_t version, Payload &payload) {
    way_fields(record, [&](uint8_t field, uint8_t field_version, auto &...values) {
      // A payload of the wrong length leaves every value as it was.
      if (field != id || field_version != version || !payload.read(values...)) return;
      if (id == WAY_FIELD_ZERO) record.zero.taken = true;
    });
  });
  return record;
}

}  // namespace blade_core
