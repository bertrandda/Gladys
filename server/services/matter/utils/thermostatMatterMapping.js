const { AC_MODE, THERMOSTAT_MODE, THERMOSTAT_OPERATING_STATE } = require('../../../utils/constants');
const logger = require('../../../utils/logger');

// Matter Thermostat cluster SystemModeEnum values (Matter spec 4.3.9.10)
const MATTER_SYSTEM_MODE = {
  OFF: 0,
  AUTO: 1,
  COOL: 3,
  HEAT: 4,
  EMERGENCY_HEAT: 5,
  PRECOOLING: 6,
  FAN_ONLY: 7,
  DRY: 8,
  SLEEP: 9,
};

const MATTER_SYSTEM_MODE_TO_GLADYS = {
  [MATTER_SYSTEM_MODE.AUTO]: AC_MODE.AUTO,
  [MATTER_SYSTEM_MODE.COOL]: AC_MODE.COOLING,
  [MATTER_SYSTEM_MODE.HEAT]: AC_MODE.HEATING,
  [MATTER_SYSTEM_MODE.EMERGENCY_HEAT]: AC_MODE.HEATING,
  [MATTER_SYSTEM_MODE.PRECOOLING]: AC_MODE.COOLING,
  [MATTER_SYSTEM_MODE.FAN_ONLY]: AC_MODE.FAN,
  [MATTER_SYSTEM_MODE.DRY]: AC_MODE.DRYING,
  [MATTER_SYSTEM_MODE.SLEEP]: AC_MODE.AUTO,
};

const GLADYS_AC_MODE_TO_MATTER = {
  [AC_MODE.AUTO]: MATTER_SYSTEM_MODE.AUTO,
  [AC_MODE.COOLING]: MATTER_SYSTEM_MODE.COOL,
  [AC_MODE.HEATING]: MATTER_SYSTEM_MODE.HEAT,
  [AC_MODE.DRYING]: MATTER_SYSTEM_MODE.DRY,
  [AC_MODE.FAN]: MATTER_SYSTEM_MODE.FAN_ONLY,
};

// Heating-only thermostats (no cooling feature) expose their system mode through the
// thermostat mode feature (THERMOSTAT_MODE), which carries Off, unlike AC_MODE
const MATTER_SYSTEM_MODE_TO_GLADYS_THERMOSTAT_MODE = {
  [MATTER_SYSTEM_MODE.OFF]: THERMOSTAT_MODE.OFF,
  [MATTER_SYSTEM_MODE.AUTO]: THERMOSTAT_MODE.AUTO,
  [MATTER_SYSTEM_MODE.HEAT]: THERMOSTAT_MODE.HEATING,
  [MATTER_SYSTEM_MODE.EMERGENCY_HEAT]: THERMOSTAT_MODE.HEATING,
};

const GLADYS_THERMOSTAT_MODE_TO_MATTER = {
  [THERMOSTAT_MODE.OFF]: MATTER_SYSTEM_MODE.OFF,
  [THERMOSTAT_MODE.HEATING]: MATTER_SYSTEM_MODE.HEAT,
  [THERMOSTAT_MODE.AUTO]: MATTER_SYSTEM_MODE.AUTO,
};

const GLADYS_THERMOSTAT_MODE_LABELS = {
  [THERMOSTAT_MODE.OFF]: 'Off',
  [THERMOSTAT_MODE.HEATING]: 'Heat',
  [THERMOSTAT_MODE.AUTO]: 'Auto',
};

// Default setpoint limits of the Matter Thermostat cluster (Matter spec 4.3.9), in 0.01 °C,
// used when the device does not expose its own limits
const DEFAULT_SETPOINT_LIMITS = {
  heat: { min: 700, max: 3000 },
  cool: { min: 1600, max: 3200 },
};

const GLADYS_AC_MODE_LABELS = {
  [AC_MODE.AUTO]: 'Auto',
  [AC_MODE.COOLING]: 'Cool',
  [AC_MODE.HEATING]: 'Heat',
  [AC_MODE.DRYING]: 'Dry',
  [AC_MODE.FAN]: 'Fan',
};

/**
 * @description Convert Matter Thermostat SystemMode attribute value to Gladys AC mode.
 * Returns null when the mode has no Gladys equivalent (e.g. Off, which is handled
 * by the OnOff cluster / binary feature).
 * @param {number} matterSystemMode - SystemMode value from Matter device.
 * @returns {number|null} Gladys AC_MODE value, or null when not mappable.
 * @example
 * const gladysMode = matterSystemModeToGladysAcMode(3);
 */
function matterSystemModeToGladysAcMode(matterSystemMode) {
  if (Object.prototype.hasOwnProperty.call(MATTER_SYSTEM_MODE_TO_GLADYS, matterSystemMode)) {
    return MATTER_SYSTEM_MODE_TO_GLADYS[matterSystemMode];
  }
  return null;
}

/**
 * @description Convert Gladys AC mode to Matter Thermostat SystemMode attribute value.
 * @param {number} gladysAcMode - Gladys AC_MODE value.
 * @returns {number} Matter SystemMode value.
 * @example
 * const matterSystemMode = gladysAcModeToMatterSystemMode(1);
 */
function gladysAcModeToMatterSystemMode(gladysAcMode) {
  if (Object.prototype.hasOwnProperty.call(GLADYS_AC_MODE_TO_MATTER, gladysAcMode)) {
    return GLADYS_AC_MODE_TO_MATTER[gladysAcMode];
  }
  throw new Error(`Unsupported air conditioning mode: ${gladysAcMode}`);
}

/**
 * @description Build the supported_options list of the air conditioning mode feature
 * from the Thermostat cluster supported features.
 * The Matter Thermostat cluster has no capability flag for the Dry and FanOnly
 * system modes, so they are always exposed on cooling devices.
 * @param {object} supportedFeatures - Thermostat cluster supported features (heating/cooling/autoMode).
 * @returns {Array} Supported options ({ value, label }) sorted by Gladys AC_MODE value.
 * @example
 * const supportedOptions = getAcModeSupportedOptions({ heating: true, cooling: true, autoMode: true });
 */
function getAcModeSupportedOptions(supportedFeatures) {
  const modes = [];
  if (supportedFeatures.autoMode) {
    modes.push(AC_MODE.AUTO);
  }
  if (supportedFeatures.cooling) {
    modes.push(AC_MODE.COOLING);
    // Dry and FanOnly have no Matter capability flag; expose them on cooling devices
    modes.push(AC_MODE.DRYING, AC_MODE.FAN);
  }
  if (supportedFeatures.heating) {
    modes.push(AC_MODE.HEATING);
  }
  return modes
    .sort((a, b) => a - b)
    .map((mode) => ({
      value: mode,
      label: GLADYS_AC_MODE_LABELS[mode],
    }));
}

/**
 * @description Convert Matter Thermostat SystemMode attribute value to Gladys thermostat mode.
 * Used by heating-only thermostats, whose mode feature carries Off.
 * @param {number} matterSystemMode - SystemMode value from Matter device.
 * @returns {number|null} Gladys THERMOSTAT_MODE value, or null when not mappable.
 * @example
 * const gladysMode = matterSystemModeToGladysThermostatMode(4);
 */
function matterSystemModeToGladysThermostatMode(matterSystemMode) {
  if (Object.prototype.hasOwnProperty.call(MATTER_SYSTEM_MODE_TO_GLADYS_THERMOSTAT_MODE, matterSystemMode)) {
    return MATTER_SYSTEM_MODE_TO_GLADYS_THERMOSTAT_MODE[matterSystemMode];
  }
  return null;
}

/**
 * @description Convert Gladys thermostat mode to Matter Thermostat SystemMode attribute value.
 * @param {number} gladysThermostatMode - Gladys THERMOSTAT_MODE value.
 * @returns {number} Matter SystemMode value.
 * @example
 * const matterSystemMode = gladysThermostatModeToMatterSystemMode(0);
 */
function gladysThermostatModeToMatterSystemMode(gladysThermostatMode) {
  if (Object.prototype.hasOwnProperty.call(GLADYS_THERMOSTAT_MODE_TO_MATTER, gladysThermostatMode)) {
    return GLADYS_THERMOSTAT_MODE_TO_MATTER[gladysThermostatMode];
  }
  throw new Error(`Unsupported thermostat mode: ${gladysThermostatMode}`);
}

/**
 * @description Build the supported_options list of the thermostat mode feature of a
 * heating-only thermostat: Off and Heat, plus Auto when the device supports it.
 * @param {object} supportedFeatures - Thermostat cluster supported features.
 * @returns {Array} Supported options ({ value, label }) sorted by Gladys THERMOSTAT_MODE value.
 * @example
 * const supportedOptions = getThermostatModeSupportedOptions({ heating: true, autoMode: false });
 */
function getThermostatModeSupportedOptions(supportedFeatures) {
  const modes = [THERMOSTAT_MODE.OFF, THERMOSTAT_MODE.HEATING];
  if (supportedFeatures.autoMode) {
    modes.push(THERMOSTAT_MODE.AUTO);
  }
  return modes.map((mode) => ({
    value: mode,
    label: GLADYS_THERMOSTAT_MODE_LABELS[mode],
  }));
}

/**
 * @description Convert Matter Thermostat ThermostatRunningState bitmap to Gladys operating state.
 * @param {object} runningState - ThermostatRunningState bitmap ({ heat, cool, heatStage2, coolStage2, ... }).
 * @returns {number|null} Gladys THERMOSTAT_OPERATING_STATE value, or null when the bitmap is missing.
 * @example
 * const operatingState = matterRunningStateToGladysOperatingState({ heat: true });
 */
function matterRunningStateToGladysOperatingState(runningState) {
  if (runningState === null || runningState === undefined) {
    return null;
  }
  if (runningState.heat || runningState.heatStage2) {
    return THERMOSTAT_OPERATING_STATE.HEATING;
  }
  if (runningState.cool || runningState.coolStage2) {
    return THERMOSTAT_OPERATING_STATE.COOLING;
  }
  return THERMOSTAT_OPERATING_STATE.IDLE;
}

/**
 * @description Tell if a cluster client exposes an attribute.
 * @param {object} clusterClient - Matter cluster client.
 * @param {string} attributeName - Attribute name, such as thermostatRunningState.
 * @param {boolean} [whenUnknown] - Answer when the client cannot tell.
 * @returns {boolean} True when the attribute is supported.
 * @example
 * const supported = isAttributeSupported(thermostat, 'thermostatRunningState', false);
 */
function isAttributeSupported(clusterClient, attributeName, whenUnknown = true) {
  if (typeof clusterClient.isAttributeSupportedByName !== 'function') {
    return whenUnknown;
  }
  return clusterClient.isAttributeSupportedByName(attributeName);
}

/**
 * @description Read one setpoint limit attribute, returning null when it is missing or unreadable.
 * @param {object} clusterClient - Thermostat cluster client.
 * @param {string} attributeName - Attribute name, such as minHeatSetpointLimit.
 * @returns {Promise<number|null>} Limit in 0.01 °C, or null.
 * @example
 * const limit = await readSetpointLimit(thermostat, 'minHeatSetpointLimit');
 */
async function readSetpointLimit(clusterClient, attributeName) {
  const getterName = `get${attributeName.charAt(0).toUpperCase()}${attributeName.slice(1)}Attribute`;
  if (typeof clusterClient[getterName] !== 'function' || !isAttributeSupported(clusterClient, attributeName)) {
    return null;
  }
  try {
    const value = await clusterClient[getterName]();
    return typeof value === 'number' ? value : null;
  } catch (e) {
    logger.debug(`Matter: Could not read thermostat ${attributeName}: ${e.message}`);
    return null;
  }
}

/**
 * @description Get the setpoint range of a thermostat, in °C. The user-configurable limits
 * (Min/MaxHeatSetpointLimit) are preferred, then the absolute limits of the device, then
 * the defaults of the Matter specification.
 * @param {object} clusterClient - Thermostat cluster client.
 * @param {string} kind - 'heat' or 'cool'.
 * @returns {Promise<object>} The range ({ min, max }) in °C.
 * @example
 * const { min, max } = await getSetpointLimits(thermostat, 'heat');
 */
async function getSetpointLimits(clusterClient, kind) {
  const suffix = `${kind.charAt(0).toUpperCase()}${kind.slice(1)}SetpointLimit`;
  const defaults = DEFAULT_SETPOINT_LIMITS[kind];
  const readLimit = async (bound) => {
    const limit = await readSetpointLimit(clusterClient, `${bound.toLowerCase()}${suffix}`);
    if (limit !== null) {
      return limit;
    }
    const absLimit = await readSetpointLimit(clusterClient, `abs${bound}${suffix}`);
    return absLimit !== null ? absLimit : defaults[bound.toLowerCase()];
  };
  const min = await readLimit('Min');
  const max = await readLimit('Max');
  return { min: min / 100, max: max / 100 };
}

module.exports = {
  MATTER_SYSTEM_MODE,
  matterSystemModeToGladysAcMode,
  gladysAcModeToMatterSystemMode,
  getAcModeSupportedOptions,
  matterSystemModeToGladysThermostatMode,
  gladysThermostatModeToMatterSystemMode,
  getThermostatModeSupportedOptions,
  matterRunningStateToGladysOperatingState,
  isAttributeSupported,
  getSetpointLimits,
};
