#include "blade_reader.h"

#include <algorithm>

#include "esp_adc/adc_cali_scheme.h"
#include "esp_adc/adc_oneshot.h"

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

void PreferenceStorage::stage(blade_core::RecordKey key, const blade_core::RecordBytes &bytes) {
  if (!this->preference_(key).save(bytes.data(), bytes.size()))
    ESP_LOGW(TAG, "Couldn't stage record %u for way %d", key.kind, key.way_index + 1);
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

bool BladeReader::calibrate_(Arm arm) {
  adc_unit_t unit;
  adc_channel_t channel;
  if (adc_oneshot_io_to_channel(this->adc_gpios_[arm], &unit, &channel) != ESP_OK)
    return false;
  adc_cali_curve_fitting_config_t config{};
  config.unit_id = unit;
  config.chan = channel;
  config.atten = ADC_ATTEN_DB_12;
  config.bitwidth = ADC_BITWIDTH_DEFAULT;
  return adc_cali_create_scheme_curve_fitting(&config, &this->calibration_[arm]) == ESP_OK;
}

void BladeReader::setup() {
  for (uint8_t arm = 0; arm < ARMS; arm++) {
    if (!this->calibrate_(static_cast<Arm>(arm))) {
      ESP_LOGE(TAG, "No ADC calibration for GPIO%u", this->adc_gpios_[arm]);
      this->mark_failed();
      return;
    }
  }
  for (GPIOPin *pin : this->select_pins_) pin->setup();
  this->fault_led_->turn_off();
  this->core_.start(this->storage_);
  for (int w = 0; w < blade_core::WAYS; w++) {
    this->publish_zero_(w);
    this->logged_tempco_[w] = this->core_.record(w).tempco;
  }
  for (int w = 0; w < blade_core::WAYS; w++)
    this->gain_trims_[w]->publish_state(this->core_.record(w).gain_trim);
  this->not_zeroed_->publish_state(this->core_.not_zeroed());
  this->select_(0);
  // The sweep runs continuously, one mux channel a loop, so the loop mustn't idle between them.
  this->high_freq_.start();
}

void BladeReader::update_fault_led_() {
  bool lit = blade_core::led_lit(this->led_, millis());
  if (lit == this->led_lit_)
    return;
  this->led_lit_ = lit;
  this->fault_led_->set_state(lit);
}

void BladeReader::select_(uint8_t channel) {
  for (uint8_t bit = 0; bit < SELECT_BITS; bit++) this->select_pins_[bit]->digital_write((channel >> bit) & 1);
  this->channel_ = channel;
  this->selected_at_us_ = micros();
}

// One step a call: once the muxes have settled on a channel, average each arm's ADC and move on.
void BladeReader::loop() {
  this->update_fault_led_();
  if (micros() - this->selected_at_us_ < SETTLE_US)
    return;
  for (uint8_t arm = 0; arm < ARMS; arm++)
    this->read_(static_cast<Arm>(arm));

  uint8_t next = (this->channel_ + 1) % MUX_CHANNELS;
  this->select_(next);
  if (next == 0)
    this->publish_(this->core_.on_sweep(this->collect_(millis())));
}

// Averages SAMPLES raw counts on the selected channel, flags one at either rail, and calibrates
// the average, interpolating between whole counts so the averaging isn't lost.
void BladeReader::read_(Arm arm) {
  uint32_t sum = 0;
  bool clipped = false;
  for (uint8_t i = 0; i < SAMPLES; i++) {
    int raw = static_cast<int>(this->adcs_[arm]->sample());
    clipped |= raw <= 0 || raw >= RAW_MAX;
    sum += raw;
  }
  float average = static_cast<float>(sum) / SAMPLES;
  int below = std::min(static_cast<int>(average), RAW_MAX - 1);
  int below_mv = 0, above_mv = 0;
  adc_cali_raw_to_voltage(this->calibration_[arm], below, &below_mv);
  adc_cali_raw_to_voltage(this->calibration_[arm], below + 1, &above_mv);
  this->mv_table_[arm][this->channel_] = below_mv + (average - below) * (above_mv - below_mv);
  this->clipped_table_[arm][this->channel_] = clipped;
}

blade_core::Sweep BladeReader::collect_(uint32_t now_ms) const {
  blade_core::Sweep s{};
  s.now_ms = now_ms;
  for (int w = 0; w < blade_core::WAYS; w++) {
    const Tap &sense = this->ways_[w].sense;
    s.sense_mv[w] = this->mv_(sense);
    s.sense_clipped[w] = this->clipped_table_[sense.arm][sense.channel];
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
    this->log_tempco_(w, r.way[w].self_check);
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
    this->energy_[w]->publish_state(reading.energy_wh);
  }

  // Faults go out as soon as they change; the binary sensors drop repeats themselves.
  for (int w = 0; w < blade_core::WAYS; w++)
    this->blown_[w]->publish_state(r.faults.way[w][blade_core::WAY_BLOWN]);
  std::string text = blade_core::fault_text(r.faults);
  if (!this->fault_text_->has_state() || this->fault_text_->state != text)
    this->fault_text_->publish_state(text);
  this->led_ = r.led;
  if (this->core_.install_mode() != this->install_mode_) {
    this->install_mode_ = this->core_.install_mode();
    ESP_LOGI(TAG, "Install mode %s", this->install_mode_ ? "on" : "ended");
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

void BladeReader::log_tempco_(int w, const blade_core::SelfCheck &check) {
  using blade_core::NOMINAL_ZERO_MV;
  if (check.done) {
    ESP_LOGI(TAG,
             "Way %d self-check: ΔT %+.1f K, zero measured %+.2f mV, predicted %+.2f mV, uncorrected %+.2f mV "
             "from nominal%s",
             w + 1, check.k, check.measured_mv - NOMINAL_ZERO_MV, check.predicted_mv - NOMINAL_ZERO_MV,
             check.uncorrected_mv - NOMINAL_ZERO_MV, check.worse() ? ", worse than none" : "");
  }
  const blade_core::Tempco &tempco = this->core_.record(w).tempco;
  blade_core::Tempco &logged = this->logged_tempco_[w];
  if (tempco.ma_per_k == logged.ma_per_k && tempco.samples == logged.samples &&
      tempco.self_check_streak == logged.self_check_streak)
    return;
  ESP_LOGI(TAG, "Way %d tempco %+.3f mA/K from %u samples, %s; self-check streak %u", w + 1, tempco.ma_per_k,
           tempco.samples, tempco.applied_ma_per_k() != 0.0f ? "applied" : "not applied", tempco.self_check_streak);
  logged = tempco;
}

void BladeReader::set_gain_trim(int way, float trim) {
  if (way < 1 || way > blade_core::WAYS) {
    ESP_LOGW(TAG, "set_gain_trim: no way %d; ways are 1 to %d", way, blade_core::WAYS);
    return;
  }
  if (!this->core_.set_gain_trim(way - 1, trim)) {
    ESP_LOGW(TAG, "set_gain_trim: way %d trim %.4f rejected, outside %.2f to %.2f", way, trim,
             blade_core::GAIN_TRIM_MIN, blade_core::GAIN_TRIM_MAX);
    return;
  }
  ESP_LOGI(TAG, "Way %d gain trim set to %.4f", way, trim);
  this->gain_trims_[way - 1]->publish_state(trim);
}

void BladeReader::dump_state() {
  for (int w = 0; w < blade_core::WAYS; w++) {
    ESP_LOGI(TAG, "Way %d: energy %" PRId64 " mWs", w + 1, this->core_.energy(w).mws);
    ESP_LOGI(TAG, "Way %d: gain trim %.4f", w + 1, this->core_.record(w).gain_trim);
    const blade_core::Zero &zero = this->core_.record(w).zero;
    if (!zero.taken) {
      ESP_LOGI(TAG, "Way %d: not zeroed", w + 1);
      continue;
    }
    ESP_LOGI(TAG, "Way %d: zero %.2f mV (%+.2f from nominal), Vbe %.1f mV (%.0f °C), taken %" PRIu32 " s after boot",
             w + 1, zero.mv, zero.mv - blade_core::NOMINAL_ZERO_MV, zero.vbe_mv, blade_core::diode_c(zero.vbe_mv),
             zero.at_s);
    const blade_core::Tempco &tempco = this->core_.record(w).tempco;
    ESP_LOGI(TAG, "Way %d: tempco %+.3f mA/K from %u samples (applied %+.3f), self-check streak %u", w + 1,
             tempco.ma_per_k, tempco.samples, tempco.applied_ma_per_k(), tempco.self_check_streak);
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
