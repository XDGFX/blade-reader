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

RecordBytes encode(const WayRecord &record) {
  RecordBytes bytes{};
  Writer out(bytes);
  if (record.zero.taken) {
    out.field(WAY_FIELD_ZERO, ZERO_FIELD_VERSION, record.zero.mv, record.zero.vbe_mv, record.zero.at_s);
  }
  out.field(WAY_FIELD_GAIN_TRIM, GAIN_TRIM_FIELD_VERSION, record.gain_trim);
  const Tempco &tempco = record.tempco;
  out.field(WAY_FIELD_TEMPCO, TEMPCO_FIELD_VERSION, tempco.ma_per_k);
  out.field(WAY_FIELD_TEMPCO_SAMPLES, TEMPCO_SAMPLES_FIELD_VERSION, tempco.samples, tempco.recent);
  out.field(WAY_FIELD_SELF_CHECK, SELF_CHECK_FIELD_VERSION, tempco.self_check_streak);
  return bytes;
}

WayRecord decode_way(const RecordBytes &bytes) {
  WayRecord record;
  size_t at = 0;
  while (at + FIELD_HEADER_BYTES <= bytes.size() && bytes[at + FIELD_ID_AT] != WAY_FIELD_END) {
    uint8_t id = bytes[at + FIELD_ID_AT];
    uint8_t version = bytes[at + FIELD_VERSION_AT];
    size_t length = bytes[at + FIELD_LENGTH_AT];
    size_t start = at + FIELD_HEADER_BYTES;
    if (start + length > bytes.size()) break;
    Payload payload(&bytes[start], length);
    if (id == WAY_FIELD_ZERO && version == ZERO_FIELD_VERSION) {
      Zero zero;
      zero.taken = payload.read(zero.mv, zero.vbe_mv, zero.at_s);
      if (zero.taken) record.zero = zero;
    }
    Tempco &tempco = record.tempco;
    if (id == WAY_FIELD_TEMPCO && version == TEMPCO_FIELD_VERSION) {
      float ma_per_k;
      if (payload.read(ma_per_k)) tempco.ma_per_k = ma_per_k;
    }
    if (id == WAY_FIELD_TEMPCO_SAMPLES && version == TEMPCO_SAMPLES_FIELD_VERSION) {
      Tempco read;
      if (payload.read(read.samples, read.recent)) {
        tempco.samples = read.samples;
        std::memcpy(tempco.recent, read.recent, sizeof(tempco.recent));
      }
    }
    if (id == WAY_FIELD_SELF_CHECK && version == SELF_CHECK_FIELD_VERSION) {
      uint8_t streak;
      if (payload.read(streak)) tempco.self_check_streak = streak;
    }
    if (id == WAY_FIELD_GAIN_TRIM && version == GAIN_TRIM_FIELD_VERSION) {
      float trim;
      if (payload.read(trim)) record.gain_trim = trim;
    }
    at = start + length;
  }
  return record;
}

}  // namespace blade_core
