const logger = require('../../../utils/logger');

/**
 * @description Refresh Viessmann tokens on expiry.
 * @example refreshViessmannTokens();
 */
async function refreshViessmannTokens() {
  const { expireInToken } = this;
  await this.refreshingTokens();
  if (this.expireInToken !== expireInToken) {
    logger.warn(`New Viessmann token expiration: ${this.expireInToken}s`);
    clearInterval(this.pollRefreshToken);
    await this.pollRefreshingToken();
  }
}

/**
 * @description Schedule periodic token refresh.
 * @example pollRefreshingToken();
 */
function pollRefreshingToken() {
  if (this.expireInToken > 0) {
    this.pollRefreshToken = setInterval(refreshViessmannTokens.bind(this), this.expireInToken * 1000);
  }
}

module.exports = {
  pollRefreshingToken,
};
