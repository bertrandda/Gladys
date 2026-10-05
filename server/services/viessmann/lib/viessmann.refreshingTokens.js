const { fetch } = require('undici');

const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

const { STATUS, API } = require('./utils/viessmann.constants');

/**
 * @description Refresh Viessmann access token using refresh token.
 * @returns {Promise} Refresh result.
 * @example await viessmann.refreshingTokens();
 */
async function refreshingTokens() {
  const { clientId } = this.configuration;
  if (!clientId) {
    await this.saveStatus({ statusType: STATUS.NOT_INITIALIZED, message: null });
    throw new ServiceNotConfiguredError('Viessmann is not configured.');
  }
  if (!this.accessToken || !this.refreshToken) {
    logger.debug('Viessmann no access or no refresh token');
    await this.saveStatus({ statusType: STATUS.DISCONNECTED, message: null });
    throw new ServiceNotConfiguredError('Viessmann is not connected.');
  }
  await this.saveStatus({ statusType: STATUS.PROCESSING_TOKEN, message: null });
  logger.debug('Loading Viessmann refreshing tokens...');

  const tokenForm = {
    grant_type: 'refresh_token',
    client_id: clientId,
    refresh_token: this.refreshToken,
  };
  try {
    const response = await fetch(API.TOKEN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(tokenForm).toString(),
    });
    const rawBody = await response.text();
    if (!response.ok) {
      logger.error('Error getting Viessmann refresh token: ', response.status, rawBody);
      throw new Error(`HTTP error ${response.status} - ${rawBody}`);
    }
    const data = JSON.parse(rawBody);
    const tokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expireIn: data.expires_in,
    };
    await this.setTokens(tokens);
    await this.saveStatus({ statusType: STATUS.CONNECTED, message: null });
    logger.debug('Viessmann tokens refreshed successfully with status: ', this.status);
    return { success: true };
  } catch (e) {
    logger.error('Viessmann refresh token failed, disconnecting: ', e);
    const tokens = { accessToken: '', refreshToken: '', expireIn: '' };
    await this.setTokens(tokens);
    await this.saveStatus({ statusType: STATUS.ERROR.PROCESSING_TOKEN, message: 'refresh_token_fail' });
    throw new ServiceNotConfiguredError(`VIESSMANN: Service is not connected with error ${e}`);
  }
}

module.exports = {
  refreshingTokens,
};
