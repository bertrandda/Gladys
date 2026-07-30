const { fetch } = require('undici');

const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

const { STATUS, API, REDIRECT_URI } = require('./utils/viessmann.constants');

/**
 * @description Viessmann retrieve access and refresh tokens using authorization code.
 * @param {object} body - Object containing codeOAuth and state.
 * @returns {Promise<object>} Success result.
 * @example await viessmann.retrieveTokens({ codeOAuth, state });
 */
async function retrieveTokens(body) {
  logger.debug('Getting tokens from Viessmann API...');
  const { clientId } = this.configuration;
  const { codeOAuth, state } = body;
  if (!clientId || !codeOAuth) {
    await this.saveStatus({ statusType: STATUS.NOT_INITIALIZED, message: null });
    throw new ServiceNotConfiguredError('Viessmann is not configured.');
  }
  if (state !== this.stateGetAccessToken) {
    await this.saveStatus({ statusType: STATUS.DISCONNECTED, message: null });
    throw new ServiceNotConfiguredError(
      'Viessmann did not connect correctly. The return does not correspond to the initial request.',
    );
  }
  await this.saveStatus({ statusType: STATUS.PROCESSING_TOKEN, message: null });

  const tokenForm = {
    grant_type: 'authorization_code',
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    code_verifier: this.codeVerifier,
    code: codeOAuth,
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
      logger.error('Error getting Viessmann access token: ', response.status, rawBody);
      throw new Error(`HTTP error ${response.status} - ${rawBody}`);
    }
    const data = JSON.parse(rawBody);
    const tokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expireIn: data.expires_in,
    };
    await this.setTokens(tokens);
    this.accessToken = tokens.accessToken;
    await this.saveStatus({ statusType: STATUS.CONNECTED });
    logger.debug('Viessmann tokens loaded successfully');
    await this.pollRefreshingValues();
    await this.pollRefreshingToken();
    return { success: true };
  } catch (e) {
    this.saveStatus({
      statusType: STATUS.ERROR.PROCESSING_TOKEN,
      message: 'get_access_token_fail',
    });
    logger.error('Error getting Viessmann access token: ', e);
    throw new ServiceNotConfiguredError(`VIESSMANN: Service is not connected with error ${e}`);
  }
}

module.exports = {
  retrieveTokens,
};
