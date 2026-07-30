const logger = require('../../../utils/logger');
const { GLADYS_VARIABLES } = require('./utils/viessmann.constants');

/**
 * @description Save Viessmann tokens to Gladys variable store.
 * @param {object} tokens - Viessmann tokens.
 * @returns {Promise<boolean>} Whether tokens were saved successfully.
 * @example await viessmann.setTokens({ accessToken, refreshToken, expireIn });
 */
async function setTokens(tokens) {
  logger.debug('Storing Viessmann tokens...');
  const { serviceId } = this;
  const { accessToken, refreshToken, expireIn } = tokens;
  try {
    await this.gladys.variable.setValue(GLADYS_VARIABLES.ACCESS_TOKEN, accessToken, serviceId);
    await this.gladys.variable.setValue(GLADYS_VARIABLES.REFRESH_TOKEN, refreshToken, serviceId);
    await this.gladys.variable.setValue(GLADYS_VARIABLES.EXPIRE_IN_TOKEN, expireIn, serviceId);
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.expireInToken = expireIn;
    logger.debug('Viessmann tokens well stored');
    return true;
  } catch (e) {
    logger.error('Viessmann tokens stored errored', e);
    return false;
  }
}

module.exports = {
  setTokens,
};
