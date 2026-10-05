const { fetch } = require('undici');
const logger = require('../../../utils/logger');
const { API, STATUS, PARAMS } = require('./utils/viessmann.constants');
const { BadParameters } = require('../../../utils/coreErrors');

/**
 * @description Resolve the Viessmann API feature name and action from the Gladys feature external_id suffix.
 * @param {string} suffix - The feature suffix (e.g. 'dhw_target_temperature', 'circuit_0_comfort_temperature').
 * @returns {object|null} Object with { featurePath, action, bodyKey } or null.
 */
function resolveWriteAction(suffix) {
  // DHW target temperature
  if (suffix === 'dhw_target_temperature') {
    return {
      featurePath: 'heating.dhw.temperature.main',
      action: 'setTargetTemperature',
      bodyKey: 'temperature',
    };
  }

  // Circuit comfort temperature
  const comfortMatch = suffix.match(/^circuit_(\d+)_comfort_temperature$/);
  if (comfortMatch) {
    return {
      featurePath: `heating.circuits.${comfortMatch[1]}.operating.programs.comfort`,
      action: 'setTemperature',
      bodyKey: 'targetTemperature',
    };
  }

  // Circuit eco temperature
  const ecoMatch = suffix.match(/^circuit_(\d+)_eco_temperature$/);
  if (ecoMatch) {
    return {
      featurePath: `heating.circuits.${ecoMatch[1]}.operating.programs.eco`,
      action: 'setTemperature',
      bodyKey: 'targetTemperature',
    };
  }

  // Circuit normal temperature
  const normalMatch = suffix.match(/^circuit_(\d+)_normal_temperature$/);
  if (normalMatch) {
    return {
      featurePath: `heating.circuits.${normalMatch[1]}.operating.programs.normal`,
      action: 'setTemperature',
      bodyKey: 'targetTemperature',
    };
  }

  // Circuit reduced temperature
  const reducedMatch = suffix.match(/^circuit_(\d+)_reduced_temperature$/);
  if (reducedMatch) {
    return {
      featurePath: `heating.circuits.${reducedMatch[1]}.operating.programs.reduced`,
      action: 'setTemperature',
      bodyKey: 'targetTemperature',
    };
  }

  // Circuit operating mode
  const modeMatch = suffix.match(/^circuit_(\d+)_operating_mode$/);
  if (modeMatch) {
    return {
      featurePath: `heating.circuits.${modeMatch[1]}.operating.modes.active`,
      action: 'setMode',
      bodyKey: 'mode',
    };
  }

  return null;
}

/**
 * @description Send a new device feature value to the Viessmann API.
 * @param {object} device - Updated Gladys device.
 * @param {object} deviceFeature - Updated Gladys device feature.
 * @param {string|number} value - The new value.
 * @example setValue(device, deviceFeature, 21);
 */
async function setValue(device, deviceFeature, value) {
  const externalId = deviceFeature.external_id;
  const installationId = device.params.find((p) => p.name === PARAMS.INSTALLATION_ID);
  const gatewaySerial = device.params.find((p) => p.name === PARAMS.GATEWAY_SERIAL);
  const deviceId = device.params.find((p) => p.name === PARAMS.DEVICE_ID);

  if (!installationId || !gatewaySerial || !deviceId) {
    throw new BadParameters(
      `Viessmann device "${externalId}" should contain parameters installation_id, gateway_serial, and device_id`,
    );
  }

  // Extract the feature suffix from external_id
  // Format: viessmann:<installationId>:<gatewaySerial>:<deviceId>:<suffix>
  const parts = externalId.split(':');
  if (parts.length < 5 || parts[0] !== 'viessmann') {
    throw new BadParameters(`Viessmann device external_id is invalid: "${externalId}"`);
  }
  const suffix = parts.slice(4).join(':');

  const writeAction = resolveWriteAction(suffix);
  if (!writeAction) {
    throw new BadParameters(`Viessmann feature "${suffix}" does not support write operations`);
  }

  const { featurePath, action, bodyKey } = writeAction;
  const url = `${API.FEATURES_BASE}/${installationId.value}/gateways/${gatewaySerial.value}/devices/${deviceId.value}/features/${featurePath}/commands/${action}`;

  logger.debug(`Viessmann setValue: ${url} with ${bodyKey}=${value}`);

  try {
    const requestBody = {};
    requestBody[bodyKey] = value;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    const rawBody = await response.text();
    if (!response.ok) {
      logger.error('Viessmann setValue error: ', response.status, rawBody);
      await this.saveStatus({
        statusType: STATUS.ERROR.SET_DEVICES_VALUES,
        message: 'set_devices_value_fail',
      });
    } else {
      logger.debug(`Viessmann value set successfully: ${featurePath}/${action} = ${value}`);
    }
  } catch (e) {
    logger.error('Viessmann setValue error: ', e);
  }
}

module.exports = {
  setValue,
  resolveWriteAction,
};
