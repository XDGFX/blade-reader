#pragma once

// The glue round the core: drives the muxes and ADCs, hands the core each finished sweep and
// publishes what it returns.

#include <string>

#include "esphome/components/binary_sensor/binary_sensor.h"
#include "esphome/components/button/button.h"
#include "esphome/components/output/binary_output.h"
#include "esphome/components/sensor/sensor.h"
#include "esphome/components/text_sensor/text_sensor.h"
#include "esphome/components/voltage_sampler/voltage_sampler.h"
#include "esphome/core/component.h"
#include "esphome/core/hal.h"
#include "esphome/core/helpers.h"
#include "esphome/core/preferences.h"

#include "core.h"
#include "core_storage.h"

namespace esphome::blade_reader {

// The core's records in ESPHome's preferences, under fixed keys of the component's own rather
// than name hashes, so they survive renames and updates. A save is synced to flash at once.
class PreferenceStorage : public blade_core::Storage {
 public:
  bool load(blade_core::RecordKey key, blade_core::RecordBytes &bytes) override;
  void save(blade_core::RecordKey key, const blade_core::RecordBytes &bytes) override;

 protected:
  ESPPreferenceObject &preference_(blade_core::RecordKey key);

  // One per record kind and way, made on first use.
  ESPPreferenceObject preferences_[blade_core::RECORD_KINDS][blade_core::WAYS];
  bool made_[blade_core::RECORD_KINDS][blade_core::WAYS]{};
};

// Each arm has its own mux and ADC pin; the two muxes share one select.
enum Arm : uint8_t { ODD_ARM, EVEN_ARM, ARMS };

constexpr uint8_t MUX_CHANNELS = 16;
constexpr uint8_t SELECT_BITS = 4;
// How long a mux is left to settle after a change of select.
constexpr uint32_t SETTLE_US = 2000;

class BladeReader : public Component {
 public:
  void setup() override;
  void loop() override;
  void dump_config() override;
  float get_setup_priority() const override { return setup_priority::DATA; }

  void set_select_pin(uint8_t bit, GPIOPin *pin) { this->select_pins_[bit] = pin; }
  void set_adc(Arm arm, voltage_sampler::VoltageSampler *adc) { this->adcs_[arm] = adc; }
  void set_fault_led(output::BinaryOutput *led) { this->fault_led_ = led; }
  void set_way(uint8_t way, uint8_t sense_channel, uint8_t voltage_channel, sensor::Sensor *current,
               sensor::Sensor *power, sensor::Sensor *voltage);
  void set_diode(blade_core::Diode diode, Arm arm, uint8_t channel, sensor::Sensor *temperature);
  void set_spare(blade_core::Spare spare, Arm arm, uint8_t channel, sensor::Sensor *level);
  void set_panel_voltage_sensor(sensor::Sensor *s) { this->panel_voltage_ = s; }
  void set_zero_sensors(uint8_t way, sensor::Sensor *offset, sensor::Sensor *temperature, sensor::Sensor *time) {
    this->zeros_[way - 1] = {offset, temperature, time};
  }
  void set_not_zeroed_text_sensor(text_sensor::TextSensor *s) { this->not_zeroed_ = s; }

  // Logs every way's stored record.
  void dump_state();

  void set_blown_sensor(uint8_t way, binary_sensor::BinarySensor *s) { this->blown_[way - 1] = s; }
  void set_fault_text_sensor(text_sensor::TextSensor *s) { this->fault_text_ = s; }

  void clear_faults() { this->core_.clear_faults(); }

 protected:
  // A way's zero, as hidden diagnostics: mV from nominal, its temperature and when it was taken.
  struct ZeroEntities {
    sensor::Sensor *offset, *temperature, *time;
  };

  struct Tap {
    Arm arm;
    uint8_t channel;
  };
  struct WayEntities {
    Tap sense, voltage;
    sensor::Sensor *current, *power, *voltage_sensor;
  };

  void select_(uint8_t channel);
  float mv_(Tap tap) const { return this->mv_table_[tap.arm][tap.channel]; }
  blade_core::Sweep collect_(uint32_t now_ms) const;
  void publish_(const blade_core::Readings &r);
  void publish_zero_(int way_index);
  void update_fault_led_();

  GPIOPin *select_pins_[SELECT_BITS]{};
  voltage_sampler::VoltageSampler *adcs_[ARMS]{};
  output::BinaryOutput *fault_led_{nullptr};
  blade_core::Led led_{blade_core::LED_OFF};
  bool led_lit_{false};
  bool install_mode_{false};

  WayEntities ways_[blade_core::WAYS]{};
  Tap diode_taps_[blade_core::DIODES]{};
  sensor::Sensor *diodes_[blade_core::DIODES]{};
  Tap spare_taps_[blade_core::SPARES]{};
  sensor::Sensor *spares_[blade_core::SPARES]{};
  sensor::Sensor *panel_voltage_{nullptr};
  ZeroEntities zeros_[blade_core::WAYS]{};
  text_sensor::TextSensor *not_zeroed_{nullptr};
  binary_sensor::BinarySensor *blown_[blade_core::WAYS]{};
  text_sensor::TextSensor *fault_text_{nullptr};

  // Each mux channel's last averaged reading, in mV at the ADC pin.
  float mv_table_[ARMS][MUX_CHANNELS]{};
  uint8_t channel_{0};
  uint32_t selected_at_us_{0};
  HighFrequencyLoopRequester high_freq_;
  PreferenceStorage storage_;
  blade_core::Core core_;
};

class ClearFaultsButton : public button::Button, public Parented<BladeReader> {
 protected:
  void press_action() override { this->parent_->clear_faults(); }
};

}  // namespace esphome::blade_reader
