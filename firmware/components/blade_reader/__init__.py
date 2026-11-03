"""blade_reader: sweeps every way of the yoke and publishes what the core works out.

The YAML gives the board (select pins, the two ADCs, the mux channel map and the fault LED);
the component makes every entity itself, so the ways are numbered the same on every board.
"""

from esphome import pins
import esphome.codegen as cg
from esphome.components import (
    binary_sensor,
    button,
    output,
    sensor,
    text_sensor,
)
from esphome.components.adc.sensor import CONF_SAMPLES, ADCSensor
import esphome.config_validation as cv
from esphome.core import CORE
import esphome.final_validate as fv
from esphome.const import (
    CONF_ATTENUATION,
    CONF_DISABLED_BY_DEFAULT,
    CONF_ID,
    CONF_NUMBER,
    CONF_PIN,
    CONF_RAW,
    CONF_NAME,
    DEVICE_CLASS_CURRENT,
    DEVICE_CLASS_DURATION,
    DEVICE_CLASS_ENERGY,
    DEVICE_CLASS_POWER,
    DEVICE_CLASS_PROBLEM,
    DEVICE_CLASS_TEMPERATURE,
    DEVICE_CLASS_VOLTAGE,
    ENTITY_CATEGORY_DIAGNOSTIC,
    STATE_CLASS_MEASUREMENT,
    STATE_CLASS_TOTAL,
    UNIT_AMPERE,
    UNIT_CELSIUS,
    UNIT_MILLIVOLT,
    UNIT_SECOND,
    UNIT_VOLT,
    UNIT_WATT,
    UNIT_WATT_HOURS,
)

AUTO_LOAD = ["binary_sensor", "button", "sensor", "text_sensor"]
DEPENDENCIES = ["output"]

WAYS = 12

CONF_SELECT_PINS = "select_pins"
CONF_ODD_ARM_ADC = "odd_arm_adc"
CONF_EVEN_ARM_ADC = "even_arm_adc"
CONF_OVER_TEMPERATURE = "over_temperature"
CONF_FAULT_LED = "fault_led"
CONF_WAYS = "ways"
CONF_SENSE = "sense"
CONF_VOLTAGE = "voltage"
CONF_DIODES = "diodes"
CONF_SPARES = "spares"
CONF_ENTITIES = "entities"

blade_reader_ns = cg.esphome_ns.namespace("blade_reader")
BladeReader = blade_reader_ns.class_("BladeReader", cg.Component)
ClearFaultsButton = blade_reader_ns.class_(
    "ClearFaultsButton", button.Button, cg.Parented.template(BladeReader)
)
Arm = blade_reader_ns.enum("Arm")
blade_core_ns = cg.global_ns.namespace("blade_core")
Diode = blade_core_ns.enum("Diode")
Spare = blade_core_ns.enum("Spare")

# (config key, core enum, arm whose mux reads it, entity name)
DIODES = [
    ("chin", Diode.DIODE_CHIN, Arm.ODD_ARM, "Chin temperature"),
    ("odd_arm", Diode.DIODE_ODD_ARM, Arm.ODD_ARM, "Odd arm temperature"),
    ("even_arm", Diode.DIODE_EVEN_ARM, Arm.EVEN_ARM, "Even arm temperature"),
]
SPARES = [
    ("odd_arm", Spare.SPARE_ODD_ARM, Arm.ODD_ARM, "Odd arm spare"),
    ("even_arm", Spare.SPARE_EVEN_ARM, Arm.EVEN_ARM, "Even arm spare"),
]

MUX_CHANNEL = cv.int_range(min=0, max=15)
HIDDEN_DIAGNOSTIC = {CONF_DISABLED_BY_DEFAULT: True}

CURRENT = sensor.sensor_schema(
    unit_of_measurement=UNIT_AMPERE,
    accuracy_decimals=2,
    device_class=DEVICE_CLASS_CURRENT,
    state_class=STATE_CLASS_MEASUREMENT,
)
POWER = sensor.sensor_schema(
    unit_of_measurement=UNIT_WATT,
    accuracy_decimals=1,
    device_class=DEVICE_CLASS_POWER,
    state_class=STATE_CLASS_MEASUREMENT,
)
VOLTAGE = sensor.sensor_schema(
    unit_of_measurement=UNIT_VOLT,
    accuracy_decimals=2,
    device_class=DEVICE_CLASS_VOLTAGE,
    state_class=STATE_CLASS_MEASUREMENT,
)
# Signed, so it can fall: `total`, not `total_increasing`.
ENERGY = sensor.sensor_schema(
    unit_of_measurement=UNIT_WATT_HOURS,
    accuracy_decimals=3,
    device_class=DEVICE_CLASS_ENERGY,
    state_class=STATE_CLASS_TOTAL,
)
WAY_VOLTAGE = sensor.sensor_schema(
    unit_of_measurement=UNIT_VOLT,
    accuracy_decimals=2,
    device_class=DEVICE_CLASS_VOLTAGE,
    state_class=STATE_CLASS_MEASUREMENT,
    entity_category=ENTITY_CATEGORY_DIAGNOSTIC,
)
TEMPERATURE = sensor.sensor_schema(
    unit_of_measurement=UNIT_CELSIUS,
    accuracy_decimals=0,
    device_class=DEVICE_CLASS_TEMPERATURE,
    state_class=STATE_CLASS_MEASUREMENT,
)
SPARE = sensor.sensor_schema(
    unit_of_measurement=UNIT_MILLIVOLT,
    accuracy_decimals=0,
    device_class=DEVICE_CLASS_VOLTAGE,
    state_class=STATE_CLASS_MEASUREMENT,
    entity_category=ENTITY_CATEGORY_DIAGNOSTIC,
)

ZERO_OFFSET = sensor.sensor_schema(
    unit_of_measurement=UNIT_MILLIVOLT,
    accuracy_decimals=1,
    device_class=DEVICE_CLASS_VOLTAGE,
    entity_category=ENTITY_CATEGORY_DIAGNOSTIC,
)
ZERO_TEMPERATURE = sensor.sensor_schema(
    unit_of_measurement=UNIT_CELSIUS,
    accuracy_decimals=0,
    device_class=DEVICE_CLASS_TEMPERATURE,
    entity_category=ENTITY_CATEGORY_DIAGNOSTIC,
)
# Seconds since the boot it was taken in, until there is a time source.
ZERO_TIME = sensor.sensor_schema(
    unit_of_measurement=UNIT_SECOND,
    accuracy_decimals=0,
    device_class=DEVICE_CLASS_DURATION,
    entity_category=ENTITY_CATEGORY_DIAGNOSTIC,
)
GAIN_TRIM = sensor.sensor_schema(
    accuracy_decimals=4,
    entity_category=ENTITY_CATEGORY_DIAGNOSTIC,
)
NOT_ZEROED = text_sensor.text_sensor_schema()
BLOWN = binary_sensor.binary_sensor_schema(device_class=DEVICE_CLASS_PROBLEM)
FAULT_TEXT = text_sensor.text_sensor_schema()
CLEAR_FAULTS = button.button_schema(ClearFaultsButton)

WAY_CHANNELS = cv.Schema(
    {cv.Required(CONF_SENSE): MUX_CHANNEL, cv.Required(CONF_VOLTAGE): MUX_CHANNEL}
)


def _make_entities(config):
    """Add every entity the component publishes, named the same on every board."""
    ways = []
    for n in range(1, WAYS + 1):
        ways.append(
            {
                "current": CURRENT({CONF_NAME: f"Way {n} current"}),
                "power": POWER({CONF_NAME: f"Way {n} power"}),
                "voltage": WAY_VOLTAGE(
                    {CONF_NAME: f"Way {n} voltage", **HIDDEN_DIAGNOSTIC}
                ),
                "zero_offset": ZERO_OFFSET(
                    {CONF_NAME: f"Way {n} zero", **HIDDEN_DIAGNOSTIC}
                ),
                "zero_temperature": ZERO_TEMPERATURE(
                    {CONF_NAME: f"Way {n} zero temperature", **HIDDEN_DIAGNOSTIC}
                ),
                "zero_time": ZERO_TIME(
                    {CONF_NAME: f"Way {n} zero time", **HIDDEN_DIAGNOSTIC}
                ),
                "blown": BLOWN({CONF_NAME: f"Way {n} blown fuse"}),
                "energy": ENERGY({CONF_NAME: f"Way {n} energy"}),
                "gain_trim": GAIN_TRIM(
                    {CONF_NAME: f"Way {n} gain trim", **HIDDEN_DIAGNOSTIC}
                ),
            }
        )
    config[CONF_ENTITIES] = {
        "ways": ways,
        "panel_voltage": VOLTAGE({CONF_NAME: "Panel voltage"}),
        "not_zeroed": NOT_ZEROED({CONF_NAME: "Not zeroed"}),
        "fault_text": FAULT_TEXT({CONF_NAME: "Fault text"}),
        "clear_faults": CLEAR_FAULTS({CONF_NAME: "Clear faults"}),
        "diodes": {key: TEMPERATURE({CONF_NAME: name}) for key, _, _, name in DIODES},
        "spares": {
            key: SPARE({CONF_NAME: name, **HIDDEN_DIAGNOSTIC})
            for key, _, _, name in SPARES
        },
    }
    return config


CONFIG_SCHEMA = cv.All(
    cv.Schema(
        {
            cv.GenerateID(): cv.declare_id(BladeReader),
            cv.Required(CONF_SELECT_PINS): cv.All(
                cv.ensure_list(pins.gpio_output_pin_schema), cv.Length(min=4, max=4)
            ),
            cv.Required(CONF_ODD_ARM_ADC): cv.use_id(ADCSensor),
            cv.Required(CONF_EVEN_ARM_ADC): cv.use_id(ADCSensor),
            cv.Required(CONF_FAULT_LED): cv.use_id(output.BinaryOutput),
            cv.Required(CONF_OVER_TEMPERATURE): cv.temperature,
            cv.Required(CONF_WAYS): cv.All(
                cv.ensure_list(WAY_CHANNELS), cv.Length(min=WAYS, max=WAYS)
            ),
            cv.Required(CONF_DIODES): cv.Schema(
                {cv.Required(key): MUX_CHANNEL for key, _, _, _ in DIODES}
            ),
            cv.Required(CONF_SPARES): cv.Schema(
                {cv.Required(key): MUX_CHANNEL for key, _, _, _ in SPARES}
            ),
        }
    ).extend(cv.COMPONENT_SCHEMA),
    _make_entities,
)


def _adc_config(full_config, adc_id):
    return next(c for c in full_config["sensor"] if c[CONF_ID] == adc_id)


def _validate_adcs(config):
    """The glue reads raw samples one at a time and calibrates them for the 12 dB range."""
    full_config = fv.full_config.get()
    for key in (CONF_ODD_ARM_ADC, CONF_EVEN_ARM_ADC):
        adc_config = _adc_config(full_config, config[key])
        if (
            not adc_config[CONF_RAW]
            or adc_config[CONF_SAMPLES] != 1
            or adc_config.get(CONF_ATTENUATION) != "12db"
        ):
            raise cv.Invalid(
                f"{key} needs raw: true, samples: 1 and attenuation: 12db", [key]
            )
    return config


FINAL_VALIDATE_SCHEMA = _validate_adcs


async def to_code(config):
    var = cg.new_Pvariable(config[CONF_ID])
    await cg.register_component(var, config)

    for bit, pin_config in enumerate(config[CONF_SELECT_PINS]):
        cg.add(var.set_select_pin(bit, await cg.gpio_pin_expression(pin_config)))
    for arm, key in ((Arm.ODD_ARM, CONF_ODD_ARM_ADC), (Arm.EVEN_ARM, CONF_EVEN_ARM_ADC)):
        gpio = _adc_config(CORE.config, config[key])[CONF_PIN][CONF_NUMBER]
        cg.add(var.set_adc(arm, await cg.get_variable(config[key]), gpio))
    cg.add(var.set_fault_led(await cg.get_variable(config[CONF_FAULT_LED])))
    cg.add(var.set_over_temperature_c(config[CONF_OVER_TEMPERATURE]))

    entities = config[CONF_ENTITIES]
    for n, (channels, way) in enumerate(zip(config[CONF_WAYS], entities["ways"]), 1):
        cg.add(
            var.set_way(
                n,
                channels[CONF_SENSE],
                channels[CONF_VOLTAGE],
                await sensor.new_sensor(way["current"]),
                await sensor.new_sensor(way["power"]),
                await sensor.new_sensor(way["voltage"]),
            )
        )
        cg.add(
            var.set_zero_sensors(
                n,
                await sensor.new_sensor(way["zero_offset"]),
                await sensor.new_sensor(way["zero_temperature"]),
                await sensor.new_sensor(way["zero_time"]),
            )
        )
        cg.add(
            var.set_blown_sensor(n, await binary_sensor.new_binary_sensor(way["blown"]))
        )
        cg.add(var.set_energy_sensor(n, await sensor.new_sensor(way["energy"])))
        cg.add(
            var.set_gain_trim_sensor(n, await sensor.new_sensor(way["gain_trim"]))
        )
    for key, diode, arm, _ in DIODES:
        temperature = await sensor.new_sensor(entities["diodes"][key])
        cg.add(var.set_diode(diode, arm, config[CONF_DIODES][key], temperature))
    for key, spare, arm, _ in SPARES:
        level = await sensor.new_sensor(entities["spares"][key])
        cg.add(var.set_spare(spare, arm, config[CONF_SPARES][key], level))
    cg.add(
        var.set_panel_voltage_sensor(
            await sensor.new_sensor(entities["panel_voltage"])
        )
    )
    cg.add(
        var.set_not_zeroed_text_sensor(
            await text_sensor.new_text_sensor(entities["not_zeroed"])
        )
    )
    cg.add(
        var.set_fault_text_sensor(
            await text_sensor.new_text_sensor(entities["fault_text"])
        )
    )
    clear_faults = await button.new_button(entities["clear_faults"])
    await cg.register_parented(clear_faults, var)
