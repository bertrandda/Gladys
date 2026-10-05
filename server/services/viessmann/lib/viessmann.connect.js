const crypto = require('crypto');

const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

const { STATUS, API, REDIRECT_URI, VIESSMANN_SCOPES } = require('./utils/viessmann.constants');

/**
 * @description Connect to Viessmann and generate authorization URL.
 * @returns {Promise} Viessmann authorization URL and state.
 * @example connect();
 */
async function connect() {
  const { clientId } = this.configuration;
  if (!clientId) {
    await this.saveStatus({ statusType: STATUS.NOT_INITIALIZED, message: null });
    throw new ServiceNotConfiguredError('Viessmann is not configured.');
  }
  await this.saveStatus({ statusType: STATUS.CONNECTING, message: null });
  logger.debug('Connecting to Viessmann...');

  this.stateGetAccessToken = crypto.randomBytes(16).toString('hex');
  // Generate PKCE code verifier and challenge
  this.codeVerifier = crypto.randomBytes(32).toString('hex');
  const codeChallenge = crypto.createHash('sha256').update(this.codeVerifier).digest('base64url');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    scope: VIESSMANN_SCOPES,
    state: this.stateGetAccessToken,
  });

  this.redirectUri = `${API.AUTHORIZE}?${params.toString()}`;
  this.configured = true;
  return { authUrl: this.redirectUri, state: this.stateGetAccessToken };
}

module.exports = {
  connect,
};
