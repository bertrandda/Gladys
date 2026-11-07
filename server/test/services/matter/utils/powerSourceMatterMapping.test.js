const { expect } = require('chai');
const {
  PowerSource,
  // eslint-disable-next-line import/no-unresolved
} = require('@matter/main/clusters');

const {
  matterBatChargeLevelToGladysBatteryLow,
} = require('../../../../services/matter/utils/powerSourceMatterMapping');

describe('Matter powerSourceMatterMapping', () => {
  it('should convert the battery charge level to the battery-low state', () => {
    expect(matterBatChargeLevelToGladysBatteryLow(PowerSource.BatChargeLevel.Ok)).to.eq(0);
    expect(matterBatChargeLevelToGladysBatteryLow(PowerSource.BatChargeLevel.Warning)).to.eq(1);
    expect(matterBatChargeLevelToGladysBatteryLow(PowerSource.BatChargeLevel.Critical)).to.eq(1);
  });

  it('should return null when the battery charge level is unknown', () => {
    expect(matterBatChargeLevelToGladysBatteryLow(null)).to.eq(null);
    expect(matterBatChargeLevelToGladysBatteryLow(undefined)).to.eq(null);
  });
});
