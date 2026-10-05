const { WEBSOCKET_MESSAGE_TYPES, EVENTS } = require('../../../utils/constants');
const logger = require('../../../utils/logger');
const { STATUS } = require('./utils/viessmann.constants');

/**
 * @description Get Viessmann status.
 * @returns {object} Current Viessmann network status.
 * @example getStatus();
 */
function getStatus() {
  return {
    configured: this.configured,
    connected: this.connected,
    status: this.status,
  };
}

/**
 * @description Save and broadcast Viessmann status.
 * @param {object} status - Status to save.
 * @returns {boolean} Whether status was saved.
 * @example saveStatus({ statusType: 'connecting', message: null });
 */
function saveStatus(status) {
  logger.debug('Changing Viessmann status...');
  try {
    switch (status.statusType) {
      case STATUS.ERROR.CONNECTING:
        this.status = STATUS.DISCONNECTED;
        this.connected = false;
        this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
          type: WEBSOCKET_MESSAGE_TYPES.VIESSMANN.ERROR.CONNECTING,
          payload: { statusType: STATUS.CONNECTING, status: status.message },
        });
        break;
      case STATUS.ERROR.PROCESSING_TOKEN:
        this.status = STATUS.DISCONNECTED;
        this.connected = false;
        this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
          type: WEBSOCKET_MESSAGE_TYPES.VIESSMANN.ERROR.PROCESSING_TOKEN,
          payload: { statusType: STATUS.PROCESSING_TOKEN, status: status.message },
        });
        break;
      case STATUS.ERROR.CONNECTED:
        this.configured = true;
        this.status = STATUS.DISCONNECTED;
        this.connected = false;
        this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
          type: WEBSOCKET_MESSAGE_TYPES.VIESSMANN.ERROR.CONNECTED,
          payload: { statusType: STATUS.CONNECTED, status: status.message },
        });
        break;
      case STATUS.ERROR.SET_DEVICES_VALUES:
      case STATUS.ERROR.GET_DEVICES_VALUES:
        this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
          type: WEBSOCKET_MESSAGE_TYPES.VIESSMANN.ERROR.CONNECTED,
          payload: { statusType: STATUS.CONNECTED, status: status.message },
        });
        break;
      case STATUS.NOT_INITIALIZED:
        this.configured = false;
        this.status = STATUS.NOT_INITIALIZED;
        this.connected = false;
        clearInterval(this.pollRefreshToken);
        clearInterval(this.pollRefreshValues);
        break;
      case STATUS.CONNECTING:
        this.configured = true;
        this.status = STATUS.CONNECTING;
        this.connected = false;
        break;
      case STATUS.PROCESSING_TOKEN:
        this.configured = true;
        this.status = STATUS.PROCESSING_TOKEN;
        this.connected = false;
        break;
      case STATUS.CONNECTED:
        this.configured = true;
        this.status = STATUS.CONNECTED;
        this.connected = true;
        break;
      case STATUS.DISCONNECTING:
        this.configured = true;
        this.status = STATUS.DISCONNECTING;
        break;
      case STATUS.DISCONNECTED:
        this.configured = true;
        this.status = STATUS.DISCONNECTED;
        this.connected = false;
        clearInterval(this.pollRefreshToken);
        clearInterval(this.pollRefreshValues);
        break;
      case STATUS.DISCOVERING_DEVICES:
        this.configured = true;
        this.status = STATUS.DISCOVERING_DEVICES;
        this.connected = true;
        break;
      case STATUS.GET_DEVICES_VALUES:
        this.configured = true;
        this.status = STATUS.GET_DEVICES_VALUES;
        this.connected = true;
        break;
      default:
        break;
    }
    logger.debug('Viessmann status changed');
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.VIESSMANN.STATUS,
      payload: { status: this.status },
    });
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = {
  getStatus,
  saveStatus,
};
