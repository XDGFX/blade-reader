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

}  // namespace

RecordBytes encode(const WayRecord &record) {
  RecordBytes bytes{};
  Writer out(bytes);
  if (record.zero.taken) {
    out.field(WAY_FIELD_ZERO, ZERO_FIELD_VERSION, record.zero.mv, record.zero.vbe_mv, record.zero.at_s);
  }
  out.field(WAY_FIELD_GAIN_TRIM, GAIN_TRIM_FIELD_VERSION, record.gain_trim);
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
    if (id == WAY_FIELD_GAIN_TRIM && version == GAIN_TRIM_FIELD_VERSION) {
      float trim;
      if (payload.read(trim)) record.gain_trim = trim;
    }
    at = start + length;
  }
  return record;
}

}  // namespace blade_core
