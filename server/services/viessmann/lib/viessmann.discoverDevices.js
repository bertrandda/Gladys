const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const { STATUS, PARAMS } = require('./utils/viessmann.constants');
const { buildFeaturesFromViessmann } = require('./device/viessmann.buildFeatures');

/**
 * @description Discover Viessmann cloud devices.
 * @returns {Promise} List of discovered devices.
 * @example await discoverDevices();
 */
async function discoverDevices() {
  logger.debug('Looking for Viessmann devices...');
  if (this.status !== STATUS.CONNECTED) {
    await this.saveStatus({ statusType: this.status, message: null });
    throw new ServiceNotConfiguredError('Unable to discover Viessmann devices until service is well configured');
  }
  this.discoveredDevices = [];
  await this.saveStatus({ statusType: STATUS.DISCOVERING_DEVICES, message: null });

  let installations = [];
  try {
    installations = await this.loadInstallations();
    logger.info(`${installations.length} Viessmann installation(s) found`);
  } catch (e) {
    logger.error('Unable to load Viessmann installations', e);
  }

  for (const installation of installations) {
    const { installationId, gatewaySerial, devices: gwDevices } = installation;

    // If gateway has listed devices, use them; otherwise default to device "0"
    const deviceIds = gwDevices && gwDevices.length > 0 ? gwDevices.map((d) => d.id) : ['0'];

    for (const deviceId of deviceIds) {
      try {
        const features = await this.loadDeviceFeatures(installationId, gatewaySerial, deviceId);
        const gladysFeatures = buildFeaturesFromViessmann(features, installationId, gatewaySerial, deviceId);

        if (gladysFeatures.length > 0) {
          const externalId = `viessmann:${installationId}:${gatewaySerial}:${deviceId}`;
          const deviceName = `Viessmann ${gatewaySerial} Device ${deviceId}`;

          const device = {
            name: deviceName,
            external_id: externalId,
            selector: externalId,
            model: 'Viessmann',
            service_id: this.serviceId,
            should_poll: false,
            features: gladysFeatures,
            params: [
              { name: PARAMS.INSTALLATION_ID, value: String(installationId) },
              { name: PARAMS.GATEWAY_SERIAL, value: gatewaySerial },
              { name: PARAMS.DEVICE_ID, value: String(deviceId) },
            ],
          };

          this.discoveredDevices.push(device);
        }
      } catch (e) {
        logger.error(
          `Error loading features for installation ${installationId}, gateway ${gatewaySerial}, device ${deviceId}`,
          e,
        );
      }
    }
  }

  const discoveredDevices = this.discoveredDevices.filter((device) => {
    const existInGladys = this.gladys.stateManager.get('deviceByExternalId', device.external_id);
    return existInGladys === null;
  });

  await this.saveStatus({ statusType: STATUS.CONNECTED, message: null });
  logger.debug(`${discoveredDevices.length} new Viessmann device(s) found`);
  return discoveredDevices;
}

module.exports = {
  discoverDevices,
};
