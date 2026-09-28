const { EVENTS } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { extractPropertyValue } = require('../device/viessmann.buildFeatures');

/**
 * @description Map Viessmann feature name to Gladys external_id suffix and property to read.
 */
const FEATURE_MAPPING = {
  'heating.sensors.temperature.outside': { suffix: 'outside_temperature', prop: 'value' },
  'heating.boiler.sensors.temperature.main': { suffix: 'boiler_temperature', prop: 'value' },
  'heating.boiler.sensors.temperature.commonSupply': { suffix: 'common_supply_temperature', prop: 'value' },
  'heating.sensors.temperature.return': { suffix: 'return_temperature', prop: 'value' },
  'heating.dhw.sensors.temperature.outlet': { suffix: 'dhw_outlet_temperature', prop: 'value' },
  'heating.dhw.sensors.temperature.hotWaterStorage': { suffix: 'dhw_storage_temperature', prop: 'value' },
  'heating.dhw.temperature.main': { suffix: 'dhw_target_temperature', prop: 'value' },
  'heating.dhw.charging': { suffix: 'dhw_charging', prop: 'active', binary: true },
  'heating.dhw.pumps.primary': { suffix: 'dhw_pump_primary', prop: 'status', binary: true },
  'heating.dhw.pumps.circulation': { suffix: 'dhw_pump_circulation', prop: 'status', binary: true },
};

/**
 * @description Regex-based feature mappings for dynamic circuit/burner IDs.
 */
const REGEX_FEATURE_MAPPING = [
  {
    regex: /^heating\.circuits\.(\d+)\.sensors\.temperature\.room$/,
    suffix: (m) => `circuit_${m[1]}_room_temperature`,
    prop: 'value',
  },
  {
    regex: /^heating\.circuits\.(\d+)\.sensors\.temperature\.supply$/,
    suffix: (m) => `circuit_${m[1]}_supply_temperature`,
    prop: 'value',
  },
  {
    regex: /^heating\.burners\.(\d+)\.active$/,
    suffix: (m) => `burner_${m[1]}_active`,
    prop: 'value',
    binary: true,
  },
  {
    regex: /^heating\.burners\.(\d+)\.modulation$/,
    suffix: (m) => `burner_${m[1]}_modulation`,
    prop: 'value',
  },
  {
    regex: /^heating\.circuits\.(\d+)\.operating\.modes\.active$/,
    suffix: (m) => `circuit_${m[1]}_operating_mode`,
    prop: 'value',
    text: true,
  },
  {
    regex: /^heating\.circuits\.(\d+)\.operating\.programs\.active$/,
    suffix: (m) => `circuit_${m[1]}_active_program`,
    prop: 'value',
    text: true,
  },
  {
    regex: /^heating\.circuits\.(\d+)\.operating\.programs\.comfort$/,
    suffix: (m) => `circuit_${m[1]}_comfort_temperature`,
    prop: 'temperature',
  },
  {
    regex: /^heating\.circuits\.(\d+)\.operating\.programs\.eco$/,
    suffix: (m) => `circuit_${m[1]}_eco_temperature`,
    prop: 'temperature',
  },
  {
    regex: /^heating\.circuits\.(\d+)\.operating\.programs\.normal$/,
    suffix: (m) => `circuit_${m[1]}_normal_temperature`,
    prop: 'temperature',
  },
  {
    regex: /^heating\.circuits\.(\d+)\.operating\.programs\.reduced$/,
    suffix: (m) => `circuit_${m[1]}_reduced_temperature`,
    prop: 'temperature',
  },
  {
    regex: /^heating\.circuits\.(\d+)\.circulation\.pump$/,
    suffix: (m) => `circuit_${m[1]}_circulation_pump`,
    prop: 'status',
    binary: true,
  },
];

/**
 * @description Resolve a Viessmann feature to { suffix, value } for Gladys state emission.
 * @param {object} apiFeature - A single Viessmann feature from the API.
 * @returns {Array} Array of { suffix, value } objects (may contain 0..n entries).
 */
function resolveFeatureValues(apiFeature) {
  const featureName = apiFeature.feature || '';
  const results = [];

  // Check static mapping
  const staticMap = FEATURE_MAPPING[featureName];
  if (staticMap) {
    let value = extractPropertyValue(apiFeature, staticMap.prop);
    if (value !== null) {
      if (staticMap.binary) {
        value = value === true || value === 'on' || value === 1 ? 1 : 0;
      }
      results.push({ suffix: staticMap.suffix, value, text: staticMap.text });
    }
    return results;
  }

  // Check regex mappings
  for (const mapping of REGEX_FEATURE_MAPPING) {
    const match = featureName.match(mapping.regex);
    if (match) {
      let value = extractPropertyValue(apiFeature, mapping.prop);
      if (value !== null) {
        if (mapping.binary) {
          value = value === true || value === 'on' || value === 1 ? 1 : 0;
        }
        results.push({ suffix: mapping.suffix(match), value, text: mapping.text });
      }
      break;
    }
  }

  return results;
}

/**
 * @description Update values of a Viessmann device in Gladys from API features.
 * @param {object} installation - Installation info with installationId, gatewaySerial.
 * @example await viessmann.updateDeviceValues(installation);
 */
async function updateDeviceValues(installation) {
  const { installationId, gatewaySerial, devices: gwDevices } = installation;
  const deviceIds = gwDevices && gwDevices.length > 0 ? gwDevices.map((d) => d.id) : ['0'];

  for (const deviceId of deviceIds) {
    const externalIdBase = `viessmann:${installationId}:${gatewaySerial}:${deviceId}`;
    const deviceInGladys = this.gladys.stateManager.get('deviceByExternalId', externalIdBase);

    if (!deviceInGladys) {
      logger.debug(`Viessmann device ${externalIdBase} not found in Gladys, skipping`);
      continue;
    }

    let apiFeatures;
    try {
      apiFeatures = await this.loadDeviceFeatures(installationId, gatewaySerial, deviceId);
    } catch (e) {
      logger.error(`Error loading features for Viessmann device ${externalIdBase}`, e);
      continue;
    }

    for (const apiFeature of apiFeatures) {
      const featureValues = resolveFeatureValues(apiFeature);

      for (const { suffix, value, text } of featureValues) {
        const featureExternalId = `${externalIdBase}:${suffix}`;
        const gladysFeature = deviceInGladys.features.find((f) => f.external_id === featureExternalId);

        if (gladysFeature) {
          try {
            if (text) {
              this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                device_feature_external_id: featureExternalId,
                state: value,
                text: String(value),
              });
            } else {
              this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                device_feature_external_id: featureExternalId,
                state: value,
              });
            }
          } catch (e) {
            logger.error(`Error emitting state for feature ${featureExternalId}`, e);
          }
        }
      }
    }
  }
}

module.exports = {
  updateDeviceValues,
  resolveFeatureValues,
};
