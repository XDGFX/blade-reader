#include "blade_reader.h"

#include "esphome/core/log.h"

namespace esphome::blade_reader {

static const char *const TAG = "blade_reader";

// Every record's preference key is this, plus its kind × 256, plus its way index. Changing it
// loses every board's stored records.
static constexpr uint32_t PREFERENCE_KEY_BASE = 0xB1AD0000;

ESPPreferenceObject &PreferenceStorage::preference_(blade_core::RecordKey key) {
  ESPPreferenceObject &pref = this->preferences_[key.kind][key.way_index];
  if (!this->made_[key.kind][key.way_index]) {
    uint32_t id = PREFERENCE_KEY_BASE + key.kind * 256u + key.way_index;
    pref = global_preferences->make_preference(blade_core::RECORD_BYTES, id, true);
    this->made_[key.kind][key.way_index] = true;
  }
  return pref;
}

bool PreferenceStorage::load(blade_core::RecordKey key, blade_core::RecordBytes &bytes) {
  return this->preference_(key).load(bytes.data(), bytes.size());
}

void PreferenceStorage::save(blade_core::RecordKey key, const blade_core::RecordBytes &bytes) {
  if (!this->preference_(key).save(bytes.data(), bytes.size()) || !global_preferences->sync())
    ESP_LOGW(TAG, "Couldn't write record %u for way %d", key.kind, key.way_index + 1);
}

void BladeReader::set_way(uint8_t way, uint8_t sense_channel, uint8_t voltage_channel, sensor::Sensor *current,
                          sensor::Sensor *power, sensor::Sensor *voltage) {
  Arm arm = way % 2 == 1 ? ODD_ARM : EVEN_ARM;
  this->ways_[way - 1] = {{arm, sense_channel}, {arm, voltage_channel}, current, power, voltage};
}

void BladeReader::set_diode(blade_core::Diode diode, Arm arm, uint8_t channel, sensor::Sensor *temperature) {
  this->diode_taps_[diode] = {arm, channel};
  this->diodes_[diode] = temperature;
}

void BladeReader::set_spare(blade_core::Spare spare, Arm arm, uint8_t channel, sensor::Sensor *level) {
  this->spare_taps_[spare] = {arm, channel};
  this->spares_[spare] = level;
}

void BladeReader::setup() {
  for (GPIOPin *pin : this->select_pins_) pin->setup();
  this->fault_led_->turn_off();
  this->core_.start(this->storage_);
  for (int w = 0; w < blade_core::WAYS; w++)
    this->publish_zero_(w);
  this->not_zeroed_->publish_state(this->core_.not_zeroed());
  this->select_(0);
  // The sweep runs continuously, one mux channel a loop, so the loop mustn't idle between them.
  this->high_freq_.start();
}

void BladeReader::select_(uint8_t channel) {
  for (uint8_t bit = 0; bit < SELECT_BITS; bit++) this->select_pins_[bit]->digital_write((channel >> bit) & 1);
  this->channel_ = channel;
  this->selected_at_us_ = micros();
}

// One step a call: once the muxes have settled on a channel, average each arm's ADC and move on.
void BladeReader::loop() {
  if (micros() - this->selected_at_us_ < SETTLE_US)
    return;
  for (uint8_t arm = 0; arm < ARMS; arm++)
    this->mv_table_[arm][this->channel_] = this->adcs_[arm]->sample() * 1000.0f;

  uint8_t next = (this->channel_ + 1) % MUX_CHANNELS;
  this->select_(next);
  if (next == 0)
    this->publish_(this->core_.on_sweep(this->collect_(millis())));
}

blade_core::Sweep BladeReader::collect_(uint32_t now_ms) const {
  blade_core::Sweep s{};
  s.now_ms = now_ms;
  for (int w = 0; w < blade_core::WAYS; w++) {
    s.sense_mv[w] = this->mv_(this->ways_[w].sense);
    s.voltage_mv[w] = this->mv_(this->ways_[w].voltage);
  }
  for (int d = 0; d < blade_core::DIODES; d++)
    s.vbe_mv[d] = this->mv_(this->diode_taps_[d]);
  for (int i = 0; i < blade_core::SPARES; i++)
    s.spare_mv[i] = this->mv_(this->spare_taps_[i]);
  return s;
}

void BladeReader::publish_(const blade_core::Readings &r) {
  bool new_zero = false;
  for (int w = 0; w < blade_core::WAYS; w++) {
    if (!r.way[w].new_zero)
      continue;
    new_zero = true;
    const blade_core::Zero &zero = this->core_.record(w).zero;
    ESP_LOGI(TAG, "Way %d zeroed: %+.1f mV from nominal at %.0f °C", w + 1, zero.mv - blade_core::NOMINAL_ZERO_MV,
             blade_core::diode_c(zero.vbe_mv));
    this->publish_zero_(w);
  }
  if (new_zero)
    this->not_zeroed_->publish_state(this->core_.not_zeroed());

  for (int w = 0; w < blade_core::WAYS; w++) {
    const blade_core::WayReading &reading = r.way[w];
    if (!reading.publish)
      continue;
    const WayEntities &way = this->ways_[w];
    way.current->publish_state(reading.current_a);
    way.power->publish_state(reading.power_w);
    way.voltage_sensor->publish_state(reading.voltage_v);
  }
  if (!r.publish_board)
    return;
  this->panel_voltage_->publish_state(r.panel_voltage_v);
  for (int d = 0; d < blade_core::DIODES; d++)
    this->diodes_[d]->publish_state(r.diode_c[d]);
  for (int i = 0; i < blade_core::SPARES; i++)
    this->spares_[i]->publish_state(r.spare_mv[i]);
}

void BladeReader::publish_zero_(int w) {
  const blade_core::Zero &zero = this->core_.record(w).zero;
  const ZeroEntities &entities = this->zeros_[w];
  entities.offset->publish_state(zero.taken ? zero.mv - blade_core::NOMINAL_ZERO_MV : NAN);
  entities.temperature->publish_state(zero.taken ? blade_core::diode_c(zero.vbe_mv) : NAN);
  entities.time->publish_state(zero.taken ? zero.at_s : NAN);
}

void BladeReader::dump_state() {
  for (int w = 0; w < blade_core::WAYS; w++) {
    const blade_core::Zero &zero = this->core_.record(w).zero;
    if (!zero.taken) {
      ESP_LOGI(TAG, "Way %d: not zeroed", w + 1);
      continue;
    }
    ESP_LOGI(TAG, "Way %d: zero %.2f mV (%+.2f from nominal), Vbe %.1f mV (%.0f °C), taken %" PRIu32 " s after boot",
             w + 1, zero.mv, zero.mv - blade_core::NOMINAL_ZERO_MV, zero.vbe_mv, blade_core::diode_c(zero.vbe_mv),
             zero.at_s);
  }
}

void BladeReader::dump_config() {
  ESP_LOGCONFIG(TAG, "Blade Reader:");
  for (int w = 0; w < blade_core::WAYS; w++) {
    ESP_LOGCONFIG(TAG, "  Way %d: sense channel %u, voltage channel %u", w + 1, this->ways_[w].sense.channel,
                  this->ways_[w].voltage.channel);
  }
}

}  // namespace esphome::blade_reader
