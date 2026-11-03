#include "blade_reader.h"

#include "esphome/core/log.h"

namespace esphome::blade_reader {

static const char *const TAG = "blade_reader";

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

void BladeReader::dump_config() {
  ESP_LOGCONFIG(TAG, "Blade Reader:");
  for (int w = 0; w < blade_core::WAYS; w++) {
    ESP_LOGCONFIG(TAG, "  Way %d: sense channel %u, voltage channel %u", w + 1, this->ways_[w].sense.channel,
                  this->ways_[w].voltage.channel);
  }
}

}  // namespace esphome::blade_reader
