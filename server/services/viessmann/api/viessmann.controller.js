const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function ViessmannController(viessmannHandler) {
  /**
   * @api {get} /api/v1/service/viessmann/configuration Get Viessmann Configuration.
   * @apiName getConfiguration
   * @apiGroup Viessmann
   */
  async function getConfiguration(req, res) {
    const configuration = await viessmannHandler.getConfiguration();
    res.json(configuration);
  }

  /**
   * @api {get} /api/v1/service/viessmann/status Get Viessmann Status.
   * @apiName getStatus
   * @apiGroup Viessmann
   */
  async function getStatus(req, res) {
    const result = await viessmannHandler.getStatus();
    res.json(result);
  }

  /**
   * @api {post} /api/v1/service/viessmann/configuration Save Viessmann Configuration.
   * @apiName saveConfiguration
   * @apiGroup Viessmann
   */
  async function saveConfiguration(req, res) {
    const result = await viessmannHandler.saveConfiguration(req.body);
    res.json({
      success: result,
    });
  }

  /**
   * @api {post} /api/v1/service/viessmann/connect Connect Viessmann
   * @apiName connect
   * @apiGroup Viessmann
   */
  async function connect(req, res) {
    await viessmannHandler.getConfiguration();
    const result = await viessmannHandler.connect();
    res.json(result);
  }

  /**
   * @api {post} /api/v1/service/viessmann/token Retrieve Viessmann tokens
   * @apiName retrieveTokens
   * @apiGroup Viessmann
   */
  async function retrieveTokens(req, res) {
    await viessmannHandler.getConfiguration();
    const result = await viessmannHandler.retrieveTokens(req.body);
    res.json(result);
  }

  /**
   * @api {post} /api/v1/service/viessmann/disconnect Disconnect Viessmann
   * @apiName disconnect
   * @apiGroup Viessmann
   */
  async function disconnect(req, res) {
    await viessmannHandler.disconnect();
    res.json({
      success: true,
    });
  }

  /**
   * @api {get} /api/v1/service/viessmann/discover Discover Viessmann devices
   * @apiName discover
   * @apiGroup Viessmann
   */
  async function discover(req, res) {
    let devices;
    if (!viessmannHandler.discoveredDevices || viessmannHandler.discoveredDevices.length === 0 || req.query.refresh === 'true') {
      devices = await viessmannHandler.discoverDevices();
    } else {
      devices = viessmannHandler.discoveredDevices.filter((device) => {
        const existInGladys = viessmannHandler.gladys.stateManager.get('deviceByExternalId', device.external_id);
        return existInGladys === null;
      });
    }
    res.json(devices);
  }

  return {
    'get /api/v1/service/viessmann/configuration': {
      authenticated: true,
      controller: asyncMiddleware(getConfiguration),
    },
    'post /api/v1/service/viessmann/configuration': {
      authenticated: true,
      controller: asyncMiddleware(saveConfiguration),
    },
    'get /api/v1/service/viessmann/status': {
      authenticated: true,
      controller: asyncMiddleware(getStatus),
    },
    'post /api/v1/service/viessmann/connect': {
      authenticated: true,
      controller: asyncMiddleware(connect),
    },
    'post /api/v1/service/viessmann/token': {
      authenticated: true,
      controller: asyncMiddleware(retrieveTokens),
    },
    'post /api/v1/service/viessmann/disconnect': {
      authenticated: true,
      controller: asyncMiddleware(disconnect),
    },
    'get /api/v1/service/viessmann/discover': {
      authenticated: true,
      controller: asyncMiddleware(discover),
    },
  };
};
