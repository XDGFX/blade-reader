#pragma once

#include <cstddef>
#include <cstdint>

// The core's fixed figures, shared with its tests. Behaviour: docs/reference/firmware.md.

namespace blade_core {

constexpr int WAYS = 12;

// CC6905 at 3.3 V: 1.65 V at no current, 44 mV/A.
constexpr float NOMINAL_ZERO_MV = 1650.0f;
constexpr float GAIN_MV_PER_A = 44.0f;

// Each way's gain trim, set over the API, must lie within these.
constexpr float GAIN_TRIM_MIN = 0.90f;
constexpr float GAIN_TRIM_MAX = 1.10f;

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

// A way is over range above OVER_RANGE_A for OVER_RANGE_AFTER_MS, or straight away on a clipped
// reading, and clears after OVER_RANGE_CLEARS_AFTER_MS at OVER_RANGE_A or less with no clipping.
constexpr float OVER_RANGE_A = 30.0f;
constexpr uint32_t OVER_RANGE_AFTER_MS = 1000;
constexpr uint32_t OVER_RANGE_CLEARS_AFTER_MS = 5000;

// Diode-connected MMBT3904s, read through the ADC on yoke B. Absolute to ±5–10 °C.
constexpr float VBE_AT_25C_MV = 590.0f;
constexpr float VBE_MV_PER_C = -2.0f;

// The board is over temperature once its hottest diode reaches the threshold, which the YAML sets
// and which is OVER_TEMPERATURE_C until it does, and clears OVER_TEMPERATURE_CLEARS_K below it.
constexpr float OVER_TEMPERATURE_C = 85.0f;
constexpr float OVER_TEMPERATURE_CLEARS_K = 5.0f;

// The longest fault text, in bytes, that Home Assistant keeps.
constexpr size_t FAULT_TEXT_MAX = 255;

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

// Energy totals are kept in mWs and published in Wh.
constexpr double MWS_PER_WH = 3600.0 * 1000.0;
// Install mode lasts at most this long after boot.
constexpr uint32_t INSTALL_MODE_MS = 3600000;

// The red LED's blink periods: about 4 Hz and 1 Hz, lit for the first half of each.
constexpr uint32_t FAST_BLINK_MS = 250;
constexpr uint32_t SLOW_BLINK_MS = 1000;

}  // namespace blade_core
