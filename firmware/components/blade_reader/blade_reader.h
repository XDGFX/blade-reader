#pragma once

// The glue round the core: drives the muxes and ADCs, hands the core each finished sweep and
// publishes what it returns.

#include <string>

#include "esp_adc/adc_cali.h"

#include "esphome/components/adc/adc_sensor.h"
#include "esphome/components/binary_sensor/binary_sensor.h"
#include "esphome/components/button/button.h"
#include "esphome/components/output/binary_output.h"
#include "esphome/components/sensor/sensor.h"
#include "esphome/components/text_sensor/text_sensor.h"
#include "esphome/core/component.h"
#include "esphome/core/hal.h"
#include "esphome/core/helpers.h"

#include "core.h"

namespace esphome::blade_reader {

// Each arm has its own mux and ADC pin; the two muxes share one select.
enum Arm : uint8_t { ODD_ARM, EVEN_ARM, ARMS };

constexpr uint8_t MUX_CHANNELS = 16;
constexpr uint8_t SELECT_BITS = 4;
// How long a mux is left to settle after a change of select.
constexpr uint32_t SETTLE_US = 2000;
// Samples averaged per channel; any one at either end of the 12-bit ADC flags the channel clipped.
constexpr uint8_t SAMPLES = 64;
constexpr int RAW_MAX = 4095;

class BladeReader : public Component {
 public:
  void setup() override;
  void loop() override;
  void dump_config() override;
  float get_setup_priority() const override { return setup_priority::DATA; }

  void set_select_pin(uint8_t bit, GPIOPin *pin) { this->select_pins_[bit] = pin; }
  void set_adc(Arm arm, adc::ADCSensor *adc, uint8_t gpio) {
    this->adcs_[arm] = adc;
    this->adc_gpios_[arm] = gpio;
  }
  void set_over_temperature_c(float c) { this->core_.set_over_temperature_c(c); }
  void set_fault_led(output::BinaryOutput *led) { this->fault_led_ = led; }
  void set_way(uint8_t way, uint8_t sense_channel, uint8_t voltage_channel, sensor::Sensor *current,
               sensor::Sensor *power, sensor::Sensor *voltage);
  void set_diode(blade_core::Diode diode, Arm arm, uint8_t channel, sensor::Sensor *temperature);
  void set_spare(blade_core::Spare spare, Arm arm, uint8_t channel, sensor::Sensor *level);
  void set_panel_voltage_sensor(sensor::Sensor *s) { this->panel_voltage_ = s; }
  void set_blown_sensor(uint8_t way, binary_sensor::BinarySensor *s) { this->blown_[way - 1] = s; }
  void set_fault_text_sensor(text_sensor::TextSensor *s) { this->fault_text_ = s; }

  void clear_faults() { this->core_.clear_faults(); }

 protected:
  struct Tap {
    Arm arm;
    uint8_t channel;
  };
  struct WayEntities {
    Tap sense, voltage;
    sensor::Sensor *current, *power, *voltage_sensor;
  };

  void select_(uint8_t channel);
  bool calibrate_(Arm arm);
  void read_(Arm arm);
  float mv_(Tap tap) const { return this->mv_table_[tap.arm][tap.channel]; }
  blade_core::Sweep collect_(uint32_t now_ms) const;
  void publish_(const blade_core::Readings &r);

  GPIOPin *select_pins_[SELECT_BITS]{};
  // The ADC sensors give raw counts one at a time (the YAML checks raw: true, samples: 1); the
  // glue averages and calibrates them itself, because ESPHome's averaging hides a clipped sample.
  adc::ADCSensor *adcs_[ARMS]{};
  uint8_t adc_gpios_[ARMS]{};
  adc_cali_handle_t calibration_[ARMS]{};
  output::BinaryOutput *fault_led_{nullptr};

  WayEntities ways_[blade_core::WAYS]{};
  Tap diode_taps_[blade_core::DIODES]{};
  sensor::Sensor *diodes_[blade_core::DIODES]{};
  Tap spare_taps_[blade_core::SPARES]{};
  sensor::Sensor *spares_[blade_core::SPARES]{};
  sensor::Sensor *panel_voltage_{nullptr};
  binary_sensor::BinarySensor *blown_[blade_core::WAYS]{};
  text_sensor::TextSensor *fault_text_{nullptr};

  // Each mux channel's last averaged reading, in mV at the ADC pin.
  float mv_table_[ARMS][MUX_CHANNELS]{};
  bool clipped_table_[ARMS][MUX_CHANNELS]{};
  uint8_t channel_{0};
  uint32_t selected_at_us_{0};
  HighFrequencyLoopRequester high_freq_;
  blade_core::Core core_;
};

class ClearFaultsButton : public button::Button, public Parented<BladeReader> {
 protected:
  void press_action() override { this->parent_->clear_faults(); }
};

}  // namespace esphome::blade_reader
