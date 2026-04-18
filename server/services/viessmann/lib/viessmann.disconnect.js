const logger = require('../../../utils/logger');
const { STATUS } = require('./utils/viessmann.constants');

/**
 * @description Disconnect from Viessmann service.
 * @example disconnect();
 */
async function disconnect() {
  logger.debug('Disconnecting from Viessmann...');
  this.saveStatus({ statusType: STATUS.DISCONNECTING, message: null });
  const tokens = { accessToken: '', refreshToken: '', expireIn: 0 };
  await this.setTokens(tokens);
  clearInterval(this.pollRefreshToken);
  clearInterval(this.pollRefreshValues);
  this.saveStatus({ statusType: STATUS.DISCONNECTED, message: null });
  logger.debug('Viessmann disconnected');
}

module.exports = {
  disconnect,
};
