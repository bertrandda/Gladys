const { fetch } = require('undici');

const logger = require('../../../utils/logger');
const { API } = require('./utils/viessmann.constants');

/**
 * @description Load all Viessmann installations, gateways and devices.
 * @returns {Promise<Array>} Array of installation objects with gateway/device info.
 * @example await viessmann.loadInstallations();
 */
async function loadInstallations() {
  logger.debug('Loading Viessmann installations...');

  // Step 1: Get installations via gateways endpoint
  const response = await fetch(API.GATEWAYS, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${this.accessToken}`,
      Accept: 'application/json',
    },
  });
  const rawBody = await response.text();
  if (!response.ok) {
    logger.error('Viessmann error loading gateways: ', response.status, rawBody);
    throw new Error(`HTTP error ${response.status} - ${rawBody}`);
  }

  const data = JSON.parse(rawBody);
  const gateways = data.data || [];

  const installations = gateways.map((gw) => ({
    installationId: gw.installationId,
    gatewaySerial: gw.serial,
    gatewayType: gw.type,
    devices: gw.devices || [],
  }));

  logger.debug(`Viessmann found ${installations.length} installation(s)`);
  return installations;
}

/**
 * @description Load all features for a given device.
 * @param {string} installationId - Installation ID.
 * @param {string} gatewaySerial - Gateway serial number.
 * @param {string} deviceId - Device ID.
 * @returns {Promise<Array>} Array of features.
 * @example await viessmann.loadDeviceFeatures(installationId, gatewaySerial, deviceId);
 */
async function loadDeviceFeatures(installationId, gatewaySerial, deviceId) {
  const url = `${API.FEATURES_BASE}/${installationId}/gateways/${gatewaySerial}/devices/${deviceId}/features`;
  logger.debug(`Loading Viessmann features: ${url}`);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${this.accessToken}`,
      Accept: 'application/json',
    },
  });
  const rawBody = await response.text();
  if (!response.ok) {
    logger.error('Viessmann error loading features: ', response.status, rawBody);
    throw new Error(`HTTP error ${response.status} - ${rawBody}`);
  }

  const data = JSON.parse(rawBody);
  return data.data || [];
}

module.exports = {
  loadInstallations,
  loadDeviceFeatures,
};
