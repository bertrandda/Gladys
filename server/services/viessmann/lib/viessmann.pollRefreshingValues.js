const { STATUS } = require('./utils/viessmann.constants');
const logger = require('../../../utils/logger');

/**
 * @description Poll and refresh values of Viessmann devices.
 * @example refreshViessmannValues();
 */
async function refreshViessmannValues() {
  logger.debug('Looking for Viessmann devices values...');
  await this.saveStatus({ statusType: STATUS.GET_DEVICES_VALUES, message: null });

  let installations = [];
  try {
    installations = await this.loadInstallations();
  } catch (e) {
    await this.saveStatus({
      statusType: STATUS.ERROR.GET_DEVICES_VALUES,
      message: 'get_devices_value_fail',
    });
    logger.error('Unable to load Viessmann installations', e);
  }

  for (const installation of installations) {
    try {
      await this.updateDeviceValues(installation);
    } catch (e) {
      logger.error(`Error updating Viessmann device values for installation ${installation.installationId}`, e);
    }
  }

  await this.saveStatus({ statusType: STATUS.CONNECTED, message: null });
}

/**
 * @description Schedule periodic device value polling (every 120 seconds).
 * @example pollRefreshingValues();
 */
function pollRefreshingValues() {
  this.pollRefreshValues = setInterval(async () => {
    try {
      await this.refreshViessmannValues();
    } catch (error) {
      logger.error('Error refreshing Viessmann values: ', error);
    }
  }, 120 * 1000);
}

module.exports = {
  pollRefreshingValues,
  refreshViessmannValues,
};
