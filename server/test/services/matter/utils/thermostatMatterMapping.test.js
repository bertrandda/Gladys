const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;

const { AC_MODE, THERMOSTAT_MODE, THERMOSTAT_OPERATING_STATE } = require('../../../../utils/constants');
const {
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
} = require('../../../../services/matter/utils/thermostatMatterMapping');

describe('Matter thermostatMatterMapping', () => {
  afterEach(() => {
    sinon.reset();
  });

  it('should convert Matter system modes to Gladys AC modes', () => {
    expect(matterSystemModeToGladysAcMode(MATTER_SYSTEM_MODE.AUTO)).to.eq(AC_MODE.AUTO);
    expect(matterSystemModeToGladysAcMode(MATTER_SYSTEM_MODE.COOL)).to.eq(AC_MODE.COOLING);
    expect(matterSystemModeToGladysAcMode(MATTER_SYSTEM_MODE.HEAT)).to.eq(AC_MODE.HEATING);
    expect(matterSystemModeToGladysAcMode(MATTER_SYSTEM_MODE.EMERGENCY_HEAT)).to.eq(AC_MODE.HEATING);
    expect(matterSystemModeToGladysAcMode(MATTER_SYSTEM_MODE.PRECOOLING)).to.eq(AC_MODE.COOLING);
    expect(matterSystemModeToGladysAcMode(MATTER_SYSTEM_MODE.FAN_ONLY)).to.eq(AC_MODE.FAN);
    expect(matterSystemModeToGladysAcMode(MATTER_SYSTEM_MODE.DRY)).to.eq(AC_MODE.DRYING);
    expect(matterSystemModeToGladysAcMode(MATTER_SYSTEM_MODE.SLEEP)).to.eq(AC_MODE.AUTO);
  });

  it('should return null for Matter system modes without Gladys equivalent', () => {
    expect(matterSystemModeToGladysAcMode(MATTER_SYSTEM_MODE.OFF)).to.eq(null);
    expect(matterSystemModeToGladysAcMode(99)).to.eq(null);
  });

  it('should convert Gladys AC modes to Matter system modes', () => {
    expect(gladysAcModeToMatterSystemMode(AC_MODE.AUTO)).to.eq(MATTER_SYSTEM_MODE.AUTO);
    expect(gladysAcModeToMatterSystemMode(AC_MODE.COOLING)).to.eq(MATTER_SYSTEM_MODE.COOL);
    expect(gladysAcModeToMatterSystemMode(AC_MODE.HEATING)).to.eq(MATTER_SYSTEM_MODE.HEAT);
    expect(gladysAcModeToMatterSystemMode(AC_MODE.DRYING)).to.eq(MATTER_SYSTEM_MODE.DRY);
    expect(gladysAcModeToMatterSystemMode(AC_MODE.FAN)).to.eq(MATTER_SYSTEM_MODE.FAN_ONLY);
  });

  it('should throw for an unsupported Gladys AC mode', () => {
    expect(() => gladysAcModeToMatterSystemMode(99)).to.throw('Unsupported air conditioning mode: 99');
  });

  it('should build supported options for a full-featured air conditioner', () => {
    expect(getAcModeSupportedOptions({ heating: true, cooling: true, autoMode: true })).to.deep.equal([
      { value: AC_MODE.AUTO, label: 'Auto' },
      { value: AC_MODE.COOLING, label: 'Cool' },
      { value: AC_MODE.HEATING, label: 'Heat' },
      { value: AC_MODE.DRYING, label: 'Dry' },
      { value: AC_MODE.FAN, label: 'Fan' },
    ]);
  });

  it('should build supported options for a cooling-only device', () => {
    expect(getAcModeSupportedOptions({ cooling: true })).to.deep.equal([
      { value: AC_MODE.COOLING, label: 'Cool' },
      { value: AC_MODE.DRYING, label: 'Dry' },
      { value: AC_MODE.FAN, label: 'Fan' },
    ]);
  });

  it('should build supported options without auto mode', () => {
    expect(getAcModeSupportedOptions({ heating: true, cooling: true })).to.deep.equal([
      { value: AC_MODE.COOLING, label: 'Cool' },
      { value: AC_MODE.HEATING, label: 'Heat' },
      { value: AC_MODE.DRYING, label: 'Dry' },
      { value: AC_MODE.FAN, label: 'Fan' },
    ]);
  });

  it('should build supported options for a heating-only device', () => {
    expect(getAcModeSupportedOptions({ heating: true, autoMode: true })).to.deep.equal([
      { value: AC_MODE.AUTO, label: 'Auto' },
      { value: AC_MODE.HEATING, label: 'Heat' },
    ]);
  });

  it('should return no options when cooling and heating are disabled', () => {
    expect(getAcModeSupportedOptions({})).to.deep.equal([]);
  });

  it('should convert Matter system modes to Gladys thermostat modes', () => {
    expect(matterSystemModeToGladysThermostatMode(MATTER_SYSTEM_MODE.OFF)).to.eq(THERMOSTAT_MODE.OFF);
    expect(matterSystemModeToGladysThermostatMode(MATTER_SYSTEM_MODE.HEAT)).to.eq(THERMOSTAT_MODE.HEATING);
    expect(matterSystemModeToGladysThermostatMode(MATTER_SYSTEM_MODE.EMERGENCY_HEAT)).to.eq(THERMOSTAT_MODE.HEATING);
    expect(matterSystemModeToGladysThermostatMode(MATTER_SYSTEM_MODE.AUTO)).to.eq(THERMOSTAT_MODE.AUTO);
    expect(matterSystemModeToGladysThermostatMode(MATTER_SYSTEM_MODE.COOL)).to.eq(null);
    expect(matterSystemModeToGladysThermostatMode(undefined)).to.eq(null);
  });

  it('should convert Gladys thermostat modes to Matter system modes', () => {
    expect(gladysThermostatModeToMatterSystemMode(THERMOSTAT_MODE.OFF)).to.eq(MATTER_SYSTEM_MODE.OFF);
    expect(gladysThermostatModeToMatterSystemMode(THERMOSTAT_MODE.HEATING)).to.eq(MATTER_SYSTEM_MODE.HEAT);
    expect(gladysThermostatModeToMatterSystemMode(THERMOSTAT_MODE.AUTO)).to.eq(MATTER_SYSTEM_MODE.AUTO);
  });

  it('should throw for an unsupported Gladys thermostat mode', () => {
    expect(() => gladysThermostatModeToMatterSystemMode(THERMOSTAT_MODE.COOLING)).to.throw(
      'Unsupported thermostat mode: 2',
    );
  });

  it('should build thermostat mode options of a heating-only thermostat', () => {
    expect(getThermostatModeSupportedOptions({ heating: true })).to.deep.equal([
      { value: THERMOSTAT_MODE.OFF, label: 'Off' },
      { value: THERMOSTAT_MODE.HEATING, label: 'Heat' },
    ]);
    expect(getThermostatModeSupportedOptions({ heating: true, autoMode: true })).to.deep.equal([
      { value: THERMOSTAT_MODE.OFF, label: 'Off' },
      { value: THERMOSTAT_MODE.HEATING, label: 'Heat' },
      { value: THERMOSTAT_MODE.AUTO, label: 'Auto' },
    ]);
  });

  it('should convert the Matter running state to a Gladys operating state', () => {
    expect(matterRunningStateToGladysOperatingState({ heat: true })).to.eq(THERMOSTAT_OPERATING_STATE.HEATING);
    expect(matterRunningStateToGladysOperatingState({ heatStage2: true })).to.eq(THERMOSTAT_OPERATING_STATE.HEATING);
    expect(matterRunningStateToGladysOperatingState({ cool: true })).to.eq(THERMOSTAT_OPERATING_STATE.COOLING);
    expect(matterRunningStateToGladysOperatingState({ coolStage2: true })).to.eq(THERMOSTAT_OPERATING_STATE.COOLING);
    expect(matterRunningStateToGladysOperatingState({ fan: true })).to.eq(THERMOSTAT_OPERATING_STATE.IDLE);
    expect(matterRunningStateToGladysOperatingState(null)).to.eq(null);
    expect(matterRunningStateToGladysOperatingState(undefined)).to.eq(null);
  });

  it('should tell if a cluster client supports an attribute', () => {
    const clusterClient = { isAttributeSupportedByName: (name) => name === 'thermostatRunningState' };
    expect(isAttributeSupported(clusterClient, 'thermostatRunningState')).to.eq(true);
    expect(isAttributeSupported(clusterClient, 'absMinHeatSetpointLimit')).to.eq(false);
    expect(isAttributeSupported({}, 'thermostatRunningState')).to.eq(true);
    expect(isAttributeSupported({}, 'thermostatRunningState', false)).to.eq(false);
  });

  it('should read the user setpoint limits of a thermostat', async () => {
    const clusterClient = {
      getMinHeatSetpointLimitAttribute: fake.resolves(500),
      getMaxHeatSetpointLimitAttribute: fake.resolves(2800),
    };
    expect(await getSetpointLimits(clusterClient, 'heat')).to.deep.equal({ min: 5, max: 28 });
  });

  it('should fall back on the absolute setpoint limits of a thermostat', async () => {
    const clusterClient = {
      isAttributeSupportedByName: (name) => name.startsWith('abs'),
      getMinCoolSetpointLimitAttribute: fake.resolves(1000),
      getAbsMinCoolSetpointLimitAttribute: fake.resolves(1800),
      getAbsMaxCoolSetpointLimitAttribute: fake.resolves(3000),
    };
    expect(await getSetpointLimits(clusterClient, 'cool')).to.deep.equal({ min: 18, max: 30 });
  });

  it('should fall back on the Matter default setpoint limits', async () => {
    const clusterClient = {
      getMinHeatSetpointLimitAttribute: fake.rejects(new Error('read failed')),
      getAbsMinHeatSetpointLimitAttribute: fake.resolves(null),
    };
    expect(await getSetpointLimits(clusterClient, 'heat')).to.deep.equal({ min: 7, max: 30 });
    expect(await getSetpointLimits({}, 'cool')).to.deep.equal({ min: 16, max: 32 });
  });
});
