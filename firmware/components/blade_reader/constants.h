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

// Zero rule: a way dead for ZERO_DEAD_MS takes the mean of the next ZERO_MEAN_MS as its zero.
constexpr uint32_t ZERO_DEAD_MS = 5000;
constexpr uint32_t ZERO_MEAN_MS = 10000;

// Temperature tracking of the zero. The Vbe it follows is smoothed with this time constant.
constexpr uint32_t VBE_SMOOTHING_MS = 60000;
// It follows the even arm's diode, or the chin's while the even arm's Vbe is outside this range,
// which spans about −130 °C to 170 °C: anything beyond is a shorted or open diode.
constexpr float VBE_PLAUSIBLE_MIN_MV = 300.0f;
constexpr float VBE_PLAUSIBLE_MAX_MV = 900.0f;
// A re-zero this far from the stored zero's temperature is a tempco sample, blended in at this
// weight. The tempco is in mA/K of zero drift, clamped to ±TEMPCO_LIMIT_MA_PER_K.
constexpr float TEMPCO_SAMPLE_MIN_K = 10.0f;
constexpr float TEMPCO_BLEND = 0.25f;
constexpr float TEMPCO_LIMIT_MA_PER_K = 5.0f;
// The tempco is applied once this many latest samples agree in sign and lie within
// TEMPCO_AGREE_MA_PER_K of each other; until then 0 is.
constexpr int TEMPCO_CONFIDENT_SAMPLES = 3;
constexpr float TEMPCO_AGREE_MA_PER_K = 2.0f;

}  // namespace blade_core
