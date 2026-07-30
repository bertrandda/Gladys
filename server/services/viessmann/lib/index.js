const { init, getAccessToken, getRefreshToken } = require('./viessmann.init');
const { connect } = require('./viessmann.connect');
const { retrieveTokens } = require('./viessmann.retrieveTokens');
const { refreshingTokens } = require('./viessmann.refreshingTokens');
const { setTokens } = require('./viessmann.setTokens');
const { disconnect } = require('./viessmann.disconnect');
const { getConfiguration, saveConfiguration } = require('./viessmann.configuration');
const { getStatus, saveStatus } = require('./viessmann.status');
const { pollRefreshingToken } = require('./viessmann.pollRefreshingToken');
const { pollRefreshingValues, refreshViessmannValues } = require('./viessmann.pollRefreshingValues');
const { loadInstallations, loadDeviceFeatures } = require('./viessmann.loadDevices');
const { discoverDevices } = require('./viessmann.discoverDevices');
const { setValue } = require('./viessmann.setValue');
const { updateDeviceValues } = require('./update/viessmann.updateDeviceValues');

const { STATUS } = require('./utils/viessmann.constants');

const ViessmannHandler = function ViessmannHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.configuration = {
    clientId: null,
  };
  this.configured = false;
  this.connected = false;
  this.accessToken = null;
  this.refreshToken = null;
  this.expireInToken = null;
  this.stateGetAccessToken = null;
  this.codeVerifier = null;
  this.status = STATUS.NOT_INITIALIZED;
  this.pollRefreshToken = undefined;
  this.pollRefreshValues = undefined;
  this.discoveredDevices = [];
};

ViessmannHandler.prototype.init = init;
ViessmannHandler.prototype.connect = connect;
ViessmannHandler.prototype.retrieveTokens = retrieveTokens;
ViessmannHandler.prototype.refreshingTokens = refreshingTokens;
ViessmannHandler.prototype.setTokens = setTokens;
ViessmannHandler.prototype.disconnect = disconnect;
ViessmannHandler.prototype.getConfiguration = getConfiguration;
ViessmannHandler.prototype.saveConfiguration = saveConfiguration;
ViessmannHandler.prototype.getStatus = getStatus;
ViessmannHandler.prototype.saveStatus = saveStatus;
ViessmannHandler.prototype.getAccessToken = getAccessToken;
ViessmannHandler.prototype.getRefreshToken = getRefreshToken;
ViessmannHandler.prototype.pollRefreshingToken = pollRefreshingToken;
ViessmannHandler.prototype.pollRefreshingValues = pollRefreshingValues;
ViessmannHandler.prototype.refreshViessmannValues = refreshViessmannValues;
ViessmannHandler.prototype.loadInstallations = loadInstallations;
ViessmannHandler.prototype.loadDeviceFeatures = loadDeviceFeatures;
ViessmannHandler.prototype.discoverDevices = discoverDevices;
ViessmannHandler.prototype.setValue = setValue;
ViessmannHandler.prototype.updateDeviceValues = updateDeviceValues;

module.exports = ViessmannHandler;
