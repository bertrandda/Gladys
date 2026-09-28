const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const logger = require('../../../utils/logger');
const { GLADYS_VARIABLES, STATUS } = require('./utils/viessmann.constants');

/**
 * @description Load Viessmann stored configuration.
 * @returns {Promise} Viessmann configuration.
 * @example await getConfiguration();
 */
async function getConfiguration() {
  logger.debug('Loading Viessmann configuration...');
  const { serviceId } = this;
  try {
    this.configuration.clientId = await this.gladys.variable.getValue(GLADYS_VARIABLES.CLIENT_ID, serviceId);
    logger.debug(`Viessmann configuration get: clientId='${this.configuration.clientId}'`);
    return this.configuration;
  } catch (e) {
    this.saveStatus({ statusType: STATUS.NOT_INITIALIZED, message: null });
    throw new ServiceNotConfiguredError('Viessmann is not configured.');
  }
}

/**
 * @description Save Viessmann configuration.
 * @param {object} configuration - Configuration to save.
 * @returns {Promise<boolean>} Whether config was saved.
 * @example await saveConfiguration({ clientId: '...' });
 */
async function saveConfiguration(configuration) {
  logger.debug('Saving Viessmann configuration...');
  const { clientId } = configuration;
  try {
    await this.gladys.variable.setValue(GLADYS_VARIABLES.CLIENT_ID, clientId, this.serviceId);
    this.configuration.clientId = clientId;
    logger.debug('Viessmann configuration well stored');
    return true;
  } catch (e) {
    logger.error('Viessmann configuration stored errored', e);
    return false;
  }
}

module.exports = {
  getConfiguration,
  saveConfiguration,
};
