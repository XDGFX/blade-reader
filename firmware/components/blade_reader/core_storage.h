// SPDX-License-Identifier: AGPL-3.0-or-later
#pragma once

// Where the core keeps records across reboots. The glue implements it over ESPHome's
// preferences, under the component's own fixed keys; the tests use a fake.

#include <array>
#include <cstddef>
#include <cstdint>

namespace blade_core {

// Each kind of record has one per way. A new kind is a new entry here, with its own codec.
enum RecordKind : uint8_t { RECORD_WAY, RECORD_ENERGY, RECORD_KINDS };

struct RecordKey {
  RecordKind kind;
  int way_index;
};

// Every record is this long, so a stored record still loads after its fields change.
constexpr size_t RECORD_BYTES = 64;
using RecordBytes = std::array<uint8_t, RECORD_BYTES>;

class Storage {
 public:
  virtual ~Storage() = default;
  // Fills bytes with the record last saved under key; false if there is none.
  virtual bool load(RecordKey key, RecordBytes &bytes) = 0;
  // Writes the record to flash at once.
  virtual void save(RecordKey key, const RecordBytes &bytes) = 0;
  // Keeps the record for the next batch write, every 5 minutes and before a reboot or OTA
  // update. Staging it again before then replaces it.
  virtual void stage(RecordKey key, const RecordBytes &bytes) = 0;
};

}  // namespace blade_core
