#pragma once

#include <cstdint>

// The core's fixed figures, shared with its tests. Behaviour: docs/reference/firmware.md.

namespace blade_core {

constexpr int WAYS = 12;

// CC6905 at 3.3 V: 1.65 V at no current, 44 mV/A.
constexpr float NOMINAL_ZERO_MV = 1650.0f;
constexpr float GAIN_MV_PER_A = 44.0f;

// The even arm's sense lines are divided by 0.820 to fit the ADC's 12 dB range.
constexpr float EVEN_ARM_DIVIDER = 0.820f;

// Each way's voltage reaches its mux through 100 kΩ over 6.8 kΩ.
constexpr float VOLTAGE_DIVIDER = (100.0f + 6.8f) / 6.8f;

// A way is live from 6 V and dead below 2 V, and keeps its state in between. Both suit 12 V and
// 24 V panels.
constexpr float LIVE_V = 6.0f;
constexpr float DEAD_V = 2.0f;

// A blown fuse is a live way dead this long while another way stays live, cleared once the way
// has been live for BLOWN_CLEARS_AFTER_MS.
constexpr uint32_t BLOWN_AFTER_MS = 1000;
constexpr uint32_t BLOWN_CLEARS_AFTER_MS = 5000;

// Diode-connected MMBT3904s, read through the ADC on yoke B. Absolute to ±5–10 °C.
constexpr float VBE_AT_25C_MV = 590.0f;
constexpr float VBE_MV_PER_C = -2.0f;

// Publish rule: a reading that moves by more than its step is published once at least
// PUBLISH_MIN_MS has passed since the last, so within about 1 s; otherwise every
// PUBLISH_EVERY_MS. The steps sit above the arm's noise after 64-sample averaging.
constexpr uint32_t PUBLISH_MIN_MS = 1000;
constexpr uint32_t PUBLISH_EVERY_MS = 30000;
constexpr float CURRENT_STEP_A = 0.05f;
constexpr float VOLTAGE_STEP_V = 0.2f;
constexpr float TEMPERATURE_STEP_C = 1.0f;

}  // namespace blade_core
