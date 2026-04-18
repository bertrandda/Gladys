const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

const { GLADYS_VARIABLES, STATUS } = require('./utils/viessmann.constants');

/**
 * @description Initialize service with properties and connect to devices.
 * @example viessmann.init();
 */
async function init() {
  await this.getConfiguration();
  this.configured = true;
  await this.getAccessToken();
  await this.getRefreshToken();
  try {
    const response = await this.refreshingTokens();
    if (response.success) {
      await this.pollRefreshingToken();
      await this.refreshViessmannValues();
      await this.pollRefreshingValues();
    }
  } catch (e) {
    logger.warn('Viessmann: Unable to initialize, service may not be configured yet');
  }
}

/**
 * @description Get Viessmann access token from Gladys variable store.
 * @returns {Promise} Viessmann access token.
 * @example await viessmann.getAccessToken();
 */
async function getAccessToken() {
  logger.debug('Loading Viessmann access token...');
  const { serviceId } = this;
  try {
    this.accessToken = await this.gladys.variable.getValue(GLADYS_VARIABLES.ACCESS_TOKEN, serviceId);
    if (!this.accessToken || this.accessToken === '') {
      const tokens = { accessToken: '', refreshToken: '', expireIn: '' };
      await this.setTokens(tokens);
      await this.saveStatus({ statusType: STATUS.DISCONNECTED, message: null });
      return undefined;
    }
    logger.debug('Viessmann access token well loaded');
    return this.accessToken;
  } catch (e) {
    this.saveStatus({ statusType: STATUS.NOT_INITIALIZED, message: null });
    throw new ServiceNotConfiguredError('Viessmann is not configured.');
  }
}

/**
 * @description Get Viessmann refresh token from Gladys variable store.
 * @returns {Promise} Viessmann refresh token.
 * @example await viessmann.getRefreshToken();
 */
async function getRefreshToken() {
  logger.debug('Loading Viessmann refresh token...');
  const { serviceId } = this;
  try {
    this.refreshToken = await this.gladys.variable.getValue(GLADYS_VARIABLES.REFRESH_TOKEN, serviceId);
    this.expireInToken = await this.gladys.variable.getValue(GLADYS_VARIABLES.EXPIRE_IN_TOKEN, serviceId);
    if (!this.refreshToken) {
      const tokens = { accessToken: '', refreshToken: '', expireIn: '' };
      await this.setTokens(tokens);
      await this.saveStatus({ statusType: STATUS.DISCONNECTED, message: null });
      return undefined;
    }
    logger.debug('Viessmann refresh token well loaded');
    return this.refreshToken;
  } catch (e) {
    this.saveStatus({ statusType: STATUS.NOT_INITIALIZED, message: null });
    throw new ServiceNotConfiguredError('Viessmann is not configured.');
  }
}

module.exports = {
  init,
  getAccessToken,
  getRefreshToken,
};
