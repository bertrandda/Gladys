const logger = require('../../utils/logger');
const viessmannController = require('./api/viessmann.controller');

const ViessmannHandler = require('./lib');
const { STATUS } = require('./lib/utils/viessmann.constants');

module.exports = function ViessmannService(gladys, serviceId) {
  const viessmannHandler = new ViessmannHandler(gladys, serviceId);

  /**
   * @public
   * @description This function starts the Viessmann service.
   * @example
   * gladys.services.viessmann.start();
   */
  async function start() {
    logger.info('Starting Viessmann service', serviceId);
    await viessmannHandler.init();
  }

  /**
   * @public
   * @description This function stops the Viessmann service.
   * @example
   * gladys.services.viessmann.stop();
   */
  async function stop() {
    logger.info('Stopping Viessmann service');
    await viessmannHandler.disconnect();
  }

  /**
   * @public
   * @description Test if Viessmann is running.
   * @returns {Promise<boolean>} Returns true if Viessmann is connected.
   * @example
   * const used = await gladys.services.viessmann.isUsed();
   */
  async function isUsed() {
    return viessmannHandler.status === STATUS.CONNECTED;
  }

  return Object.freeze({
    start,
    stop,
    isUsed,
    device: viessmannHandler,
    controllers: viessmannController(viessmannHandler),
  });
};
