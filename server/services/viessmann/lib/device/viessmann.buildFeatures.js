const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');

/**
 * @description Extract a numeric value from a Viessmann feature property.
 * @param {object} feature - The Viessmann API feature object.
 * @param {string} propName - Property name to extract (e.g. 'value', 'temperature').
 * @returns {number|null} The numeric value, or null if not found.
 */
function extractPropertyValue(feature, propName) {
  const props = feature.properties || {};
  if (props[propName] !== undefined) {
    const prop = props[propName];
    return typeof prop === 'object' ? prop.value : prop;
  }
  return null;
}

/**
 * @description Check if a Viessmann feature is enabled/available.
 * @param {object} feature - The Viessmann API feature object.
 * @returns {boolean} Whether the feature is enabled.
 */
function isFeatureEnabled(feature) {
  const props = feature.properties || {};
  if (props.status && props.status.value === 'error') {
    return false;
  }
  return true;
}

/**
 * @description Build Gladys features from Viessmann API features response.
 * @param {Array} viessmannFeatures - Array of Viessmann API feature objects.
 * @param {string} installationId - Installation ID.
 * @param {string} gatewaySerial - Gateway serial number.
 * @param {string} deviceId - Device ID.
 * @returns {Array} Array of Gladys feature definitions.
 * @example const features = buildFeaturesFromViessmann(apiFeatures, installId, gwSerial, devId);
 */
function buildFeaturesFromViessmann(viessmannFeatures, installationId, gatewaySerial, deviceId) {
  const features = [];
  const externalIdBase = `viessmann:${installationId}:${gatewaySerial}:${deviceId}`;

  viessmannFeatures.forEach((feature) => {
    const featureName = feature.feature || feature.uri || '';
    if (!isFeatureEnabled(feature)) {
      return;
    }

    // Outside temperature
    if (featureName === 'heating.sensors.temperature.outside') {
      const value = extractPropertyValue(feature, 'value');
      if (value !== null) {
        features.push({
          name: 'Outside temperature',
          external_id: `${externalIdBase}:outside_temperature`,
          selector: `${externalIdBase}:outside_temperature`,
          category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          unit: DEVICE_FEATURE_UNITS.CELSIUS,
          read_only: true,
          keep_history: true,
          has_feedback: false,
          min: -40,
          max: 60,
        });
      }
    }

    // Boiler temperature
    if (featureName === 'heating.boiler.sensors.temperature.main') {
      const value = extractPropertyValue(feature, 'value');
      if (value !== null) {
        features.push({
          name: 'Boiler temperature',
          external_id: `${externalIdBase}:boiler_temperature`,
          selector: `${externalIdBase}:boiler_temperature`,
          category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          unit: DEVICE_FEATURE_UNITS.CELSIUS,
          read_only: true,
          keep_history: true,
          has_feedback: false,
          min: 0,
          max: 100,
        });
      }
    }

    // Common supply temperature
    if (featureName === 'heating.boiler.sensors.temperature.commonSupply') {
      const value = extractPropertyValue(feature, 'value');
      if (value !== null) {
        features.push({
          name: 'Common supply temperature',
          external_id: `${externalIdBase}:common_supply_temperature`,
          selector: `${externalIdBase}:common_supply_temperature`,
          category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          unit: DEVICE_FEATURE_UNITS.CELSIUS,
          read_only: true,
          keep_history: true,
          has_feedback: false,
          min: 0,
          max: 100,
        });
      }
    }

    // Return temperature
    if (featureName === 'heating.sensors.temperature.return') {
      const value = extractPropertyValue(feature, 'value');
      if (value !== null) {
        features.push({
          name: 'Return temperature',
          external_id: `${externalIdBase}:return_temperature`,
          selector: `${externalIdBase}:return_temperature`,
          category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          unit: DEVICE_FEATURE_UNITS.CELSIUS,
          read_only: true,
          keep_history: true,
          has_feedback: false,
          min: 0,
          max: 100,
        });
      }
    }

    // DHW outlet temperature
    if (featureName === 'heating.dhw.sensors.temperature.outlet') {
      const value = extractPropertyValue(feature, 'value');
      if (value !== null) {
        features.push({
          name: 'DHW outlet temperature',
          external_id: `${externalIdBase}:dhw_outlet_temperature`,
          selector: `${externalIdBase}:dhw_outlet_temperature`,
          category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          unit: DEVICE_FEATURE_UNITS.CELSIUS,
          read_only: true,
          keep_history: true,
          has_feedback: false,
          min: 0,
          max: 90,
        });
      }
    }

    // DHW hot water storage temperature
    if (featureName === 'heating.dhw.sensors.temperature.hotWaterStorage') {
      const value = extractPropertyValue(feature, 'value');
      if (value !== null) {
        features.push({
          name: 'Hot water storage temperature',
          external_id: `${externalIdBase}:dhw_storage_temperature`,
          selector: `${externalIdBase}:dhw_storage_temperature`,
          category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          unit: DEVICE_FEATURE_UNITS.CELSIUS,
          read_only: true,
          keep_history: true,
          has_feedback: false,
          min: 0,
          max: 90,
        });
      }
    }

    // DHW target temperature (writable)
    if (featureName === 'heating.dhw.temperature.main') {
      const value = extractPropertyValue(feature, 'value');
      if (value !== null) {
        features.push({
          name: 'DHW target temperature',
          external_id: `${externalIdBase}:dhw_target_temperature`,
          selector: `${externalIdBase}:dhw_target_temperature`,
          category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
          type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
          unit: DEVICE_FEATURE_UNITS.CELSIUS,
          read_only: false,
          keep_history: true,
          has_feedback: false,
          min: 10,
          max: 60,
        });
      }
    }

    // Circuit room temperature (heating.circuits.X.sensors.temperature.room)
    const circuitRoomMatch = featureName.match(/^heating\.circuits\.(\d+)\.sensors\.temperature\.room$/);
    if (circuitRoomMatch) {
      const circuitId = circuitRoomMatch[1];
      const value = extractPropertyValue(feature, 'value');
      if (value !== null) {
        features.push({
          name: `Circuit ${circuitId} room temperature`,
          external_id: `${externalIdBase}:circuit_${circuitId}_room_temperature`,
          selector: `${externalIdBase}:circuit_${circuitId}_room_temperature`,
          category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          unit: DEVICE_FEATURE_UNITS.CELSIUS,
          read_only: true,
          keep_history: true,
          has_feedback: false,
          min: -10,
          max: 50,
        });
      }
    }

    // Circuit supply temperature (heating.circuits.X.sensors.temperature.supply)
    const circuitSupplyMatch = featureName.match(/^heating\.circuits\.(\d+)\.sensors\.temperature\.supply$/);
    if (circuitSupplyMatch) {
      const circuitId = circuitSupplyMatch[1];
      const value = extractPropertyValue(feature, 'value');
      if (value !== null) {
        features.push({
          name: `Circuit ${circuitId} supply temperature`,
          external_id: `${externalIdBase}:circuit_${circuitId}_supply_temperature`,
          selector: `${externalIdBase}:circuit_${circuitId}_supply_temperature`,
          category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          unit: DEVICE_FEATURE_UNITS.CELSIUS,
          read_only: true,
          keep_history: true,
          has_feedback: false,
          min: 0,
          max: 100,
        });
      }
    }

    // Burner active state (heating.burners.X.active)
    const burnerActiveMatch = featureName.match(/^heating\.burners\.(\d+)\.active$/);
    if (burnerActiveMatch) {
      const burnerId = burnerActiveMatch[1];
      features.push({
        name: `Burner ${burnerId} active`,
        external_id: `${externalIdBase}:burner_${burnerId}_active`,
        selector: `${externalIdBase}:burner_${burnerId}_active`,
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        read_only: true,
        keep_history: true,
        has_feedback: false,
        min: 0,
        max: 1,
      });
    }

    // Burner modulation (heating.burners.X.modulation)
    const burnerModMatch = featureName.match(/^heating\.burners\.(\d+)\.modulation$/);
    if (burnerModMatch) {
      const burnerId = burnerModMatch[1];
      const value = extractPropertyValue(feature, 'value');
      if (value !== null) {
        features.push({
          name: `Burner ${burnerId} modulation`,
          external_id: `${externalIdBase}:burner_${burnerId}_modulation`,
          selector: `${externalIdBase}:burner_${burnerId}_modulation`,
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.DIMMER,
          unit: DEVICE_FEATURE_UNITS.PERCENT,
          read_only: true,
          keep_history: true,
          has_feedback: false,
          min: 0,
          max: 100,
        });
      }
    }

    // DHW charging state
    if (featureName === 'heating.dhw.charging') {
      features.push({
        name: 'DHW charging',
        external_id: `${externalIdBase}:dhw_charging`,
        selector: `${externalIdBase}:dhw_charging`,
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        read_only: true,
        keep_history: true,
        has_feedback: false,
        min: 0,
        max: 1,
      });
    }

    // DHW primary pump
    if (featureName === 'heating.dhw.pumps.primary') {
      features.push({
        name: 'DHW primary pump',
        external_id: `${externalIdBase}:dhw_pump_primary`,
        selector: `${externalIdBase}:dhw_pump_primary`,
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        read_only: true,
        keep_history: true,
        has_feedback: false,
        min: 0,
        max: 1,
      });
    }

    // DHW circulation pump
    if (featureName === 'heating.dhw.pumps.circulation') {
      features.push({
        name: 'DHW circulation pump',
        external_id: `${externalIdBase}:dhw_pump_circulation`,
        selector: `${externalIdBase}:dhw_pump_circulation`,
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        read_only: true,
        keep_history: true,
        has_feedback: false,
        min: 0,
        max: 1,
      });
    }

    // Circuit active operating mode (heating.circuits.X.operating.modes.active)
    const circuitModeMatch = featureName.match(/^heating\.circuits\.(\d+)\.operating\.modes\.active$/);
    if (circuitModeMatch) {
      const circuitId = circuitModeMatch[1];
      features.push({
        name: `Circuit ${circuitId} operating mode`,
        external_id: `${externalIdBase}:circuit_${circuitId}_operating_mode`,
        selector: `${externalIdBase}:circuit_${circuitId}_operating_mode`,
        category: DEVICE_FEATURE_CATEGORIES.TEXT,
        type: DEVICE_FEATURE_TYPES.TEXT.TEXT,
        read_only: false,
        keep_history: true,
        has_feedback: false,
        min: 0,
        max: 0,
      });
    }

    // Circuit active program (heating.circuits.X.operating.programs.active)
    const circuitProgramMatch = featureName.match(/^heating\.circuits\.(\d+)\.operating\.programs\.active$/);
    if (circuitProgramMatch) {
      const circuitId = circuitProgramMatch[1];
      features.push({
        name: `Circuit ${circuitId} active program`,
        external_id: `${externalIdBase}:circuit_${circuitId}_active_program`,
        selector: `${externalIdBase}:circuit_${circuitId}_active_program`,
        category: DEVICE_FEATURE_CATEGORIES.TEXT,
        type: DEVICE_FEATURE_TYPES.TEXT.TEXT,
        read_only: true,
        keep_history: true,
        has_feedback: false,
        min: 0,
        max: 0,
      });
    }

    // Circuit comfort program temperature (heating.circuits.X.operating.programs.comfort)
    const comfortMatch = featureName.match(/^heating\.circuits\.(\d+)\.operating\.programs\.comfort$/);
    if (comfortMatch) {
      const circuitId = comfortMatch[1];
      const temp = extractPropertyValue(feature, 'temperature');
      if (temp !== null) {
        features.push({
          name: `Circuit ${circuitId} comfort temperature`,
          external_id: `${externalIdBase}:circuit_${circuitId}_comfort_temperature`,
          selector: `${externalIdBase}:circuit_${circuitId}_comfort_temperature`,
          category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
          type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
          unit: DEVICE_FEATURE_UNITS.CELSIUS,
          read_only: false,
          keep_history: true,
          has_feedback: false,
          min: 4,
          max: 37,
        });
      }
    }

    // Circuit eco program temperature
    const ecoMatch = featureName.match(/^heating\.circuits\.(\d+)\.operating\.programs\.eco$/);
    if (ecoMatch) {
      const circuitId = ecoMatch[1];
      const temp = extractPropertyValue(feature, 'temperature');
      if (temp !== null) {
        features.push({
          name: `Circuit ${circuitId} eco temperature`,
          external_id: `${externalIdBase}:circuit_${circuitId}_eco_temperature`,
          selector: `${externalIdBase}:circuit_${circuitId}_eco_temperature`,
          category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
          type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
          unit: DEVICE_FEATURE_UNITS.CELSIUS,
          read_only: false,
          keep_history: true,
          has_feedback: false,
          min: 3,
          max: 37,
        });
      }
    }

    // Circuit normal program temperature
    const normalMatch = featureName.match(/^heating\.circuits\.(\d+)\.operating\.programs\.normal$/);
    if (normalMatch) {
      const circuitId = normalMatch[1];
      const temp = extractPropertyValue(feature, 'temperature');
      if (temp !== null) {
        features.push({
          name: `Circuit ${circuitId} normal temperature`,
          external_id: `${externalIdBase}:circuit_${circuitId}_normal_temperature`,
          selector: `${externalIdBase}:circuit_${circuitId}_normal_temperature`,
          category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
          type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
          unit: DEVICE_FEATURE_UNITS.CELSIUS,
          read_only: false,
          keep_history: true,
          has_feedback: false,
          min: 3,
          max: 37,
        });
      }
    }

    // Circuit reduced program temperature
    const reducedMatch = featureName.match(/^heating\.circuits\.(\d+)\.operating\.programs\.reduced$/);
    if (reducedMatch) {
      const circuitId = reducedMatch[1];
      const temp = extractPropertyValue(feature, 'temperature');
      if (temp !== null) {
        features.push({
          name: `Circuit ${circuitId} reduced temperature`,
          external_id: `${externalIdBase}:circuit_${circuitId}_reduced_temperature`,
          selector: `${externalIdBase}:circuit_${circuitId}_reduced_temperature`,
          category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
          type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
          unit: DEVICE_FEATURE_UNITS.CELSIUS,
          read_only: false,
          keep_history: true,
          has_feedback: false,
          min: 3,
          max: 37,
        });
      }
    }

    // Circuit circulation pump (heating.circuits.X.circulation.pump)
    const circPumpMatch = featureName.match(/^heating\.circuits\.(\d+)\.circulation\.pump$/);
    if (circPumpMatch) {
      const circuitId = circPumpMatch[1];
      features.push({
        name: `Circuit ${circuitId} circulation pump`,
        external_id: `${externalIdBase}:circuit_${circuitId}_circulation_pump`,
        selector: `${externalIdBase}:circuit_${circuitId}_circulation_pump`,
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        read_only: true,
        keep_history: true,
        has_feedback: false,
        min: 0,
        max: 1,
      });
    }
  });

  logger.debug(`Built ${features.length} Gladys feature(s) from Viessmann API`);
  return features;
}

module.exports = {
  buildFeaturesFromViessmann,
  extractPropertyValue,
};
