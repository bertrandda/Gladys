const {
  PowerSource,
  // eslint-disable-next-line import/no-unresolved
} = require('@matter/main/clusters');

/**
 * @description Convert the Matter PowerSource BatChargeLevel attribute to the Gladys battery-low
 * binary state: low as soon as the device reports a warning or a critical level.
 * @param {number} batChargeLevel - Matter BatChargeLevel value (Ok, Warning, Critical).
 * @returns {number|null} 1 when the battery is low, 0 when it is ok, null when unknown.
 * @example
 * const batteryLow = matterBatChargeLevelToGladysBatteryLow(PowerSource.BatChargeLevel.Warning);
 */
function matterBatChargeLevelToGladysBatteryLow(batChargeLevel) {
  if (batChargeLevel === null || batChargeLevel === undefined) {
    return null;
  }
  return batChargeLevel === PowerSource.BatChargeLevel.Ok ? 0 : 1;
}

module.exports = {
  matterBatChargeLevelToGladysBatteryLow,
};
