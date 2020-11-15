const logger = require('../../utils/logger');
const { ServiceNotConfiguredError } = require('../../utils/coreErrors');
const { formatResults } = require('./lib/formatResults');
const { Error400 } = require('../../utils/httpErrors');
const { ERROR_MESSAGES } = require('../../utils/constants');

const OPENWEATHER_API_KEY = 'OPENWEATHER_API_KEY';

module.exports = function OpenWeatherService(gladys, serviceId) {
  const { default: axios } = require('axios');
  let openWeatherApiKey;

  /**
   * @public
   * @description This function starts the service
   * @example
   * gladys.services.openWeather.start();
   */
  async function start() {
    logger.info('Starting Open Weather service');
    openWeatherApiKey = await gladys.variable.getValue(OPENWEATHER_API_KEY, serviceId);
    if (!openWeatherApiKey) {
      throw new ServiceNotConfiguredError('Open Weather Service not configured');
    }
  }

  /**
   * @public
   * @description This function stops the service
   * @example
   * gladys.services.openWeather.stop();
   */
  async function stop() {
    logger.log('stopping Open Weather service');
  }

  /**
   * @description Get the weather.
   * @param {Object} options - Options parameters.
   * @param {number} options.latitude - The latitude to get the weather from.
   * @param {number} options.longitude - The longitude to get the weather from.
   * @param {number} [options.mode] - The data to request [current, hourly, daily].
   * @param {number} [options.offset] - Get weather in the future, offset is in hour.
   * @param {number} [options.datetime] - Get at a specific timestamp datetime.
   * @param {string} [options.language] - The language of the report.
   * @param {string} [options.units] - Unit of the weather [si, metric, imperial].
   * @example
   * gladys.services.openWeather.weather.get({
   *   latitude: 112,
   *   longitude: -2,
   *   language: 'fr',
   *   units: 'metric'
   * });
   */
  async function get(options) {
    if (!openWeatherApiKey) {
      throw new ServiceNotConfiguredError('Open Weather API Key not found');
    }

    if (options.offset) {
      options.datetime = (options.datetime || Math.floor(Date.now() / 1000)) + 60 * options.offset;
      delete options.offset;
    }

    if (options.units === 'si') {
      options.units = 'standard';
    }

    const DEFAULT = {
      language: 'en',
      units: 'metric',
      mode: 'current',
    };

    const optionsMerged = Object.assign({}, DEFAULT, options);
    const { latitude, longitude, language, units, mode } = optionsMerged;

    let route = '/weather';
    const result = {};

    if (mode === 'current' || !options.datetime) {
      try {
        const { data } = await axios.get(`https://api.openweathermap.org/data/2.5${route}`, {
          params: {
            lat: latitude,
            lon: longitude,
            lang: language,
            units,
            appid: openWeatherApiKey,
          },
        });
        result.current = data;
      } catch (e) {
        logger.error(e);
        throw new Error400(ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED);
      }
    }

    if (mode === 'hourly' || mode === 'daily') {
      switch (mode) {
        case 'hourly':
          route = '/forecast';
          break;
        case 'daily':
          route = '/forecast/daily';
          break;
        default:
      }

      try {
        const { data } = await axios.get(`https://api.openweathermap.org/data/2.5${route}`, {
          params: {
            lat: latitude,
            lon: longitude,
            lang: language,
            units,
            appid: openWeatherApiKey,
          },
        });

        result.forcast = data;
      } catch (e) {
        logger.error(e);
        throw new Error400(ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED);
      }
    }
    return formatResults(optionsMerged, result);
  }

  return Object.freeze({
    start,
    stop,
    weather: {
      get,
    },
  });
};
