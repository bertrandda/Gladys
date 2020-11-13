/**
 * @description Format one forcast.
 * @param {Object} forcast - OpenWeather forcast to format.
 * @example
 * const formatedForcast = formatOneForcast(options, forcast);
 */
function formatOneForcast(forcast) {
  const formatedForcast = {};
  formatedForcast.temperature = forcast.main.temp;
  formatedForcast.humidity = forcast.main.humidity;
  formatedForcast.pressure = forcast.main.pressure;
  formatedForcast.datetime = forcast.dt;
  formatedForcast.wind_speed = forcast.wind.speed;
  formatedForcast.wind_direction = forcast.wind.deg;

  if (forcast.weather[0].main.search('Snow') !== -1) {
    formatedForcast.weather = 'snow';
  } else if (forcast.weather[0].main.search('Rain') !== -1) {
    formatedForcast.weather = 'rain';
  } else if (forcast.weather[0].main.search('Clear') !== -1) {
    formatedForcast.weather = 'clear';
  } else if (forcast.weather[0].main.search('Clouds') !== -1) {
    formatedForcast.weather = 'cloud';
  } else if (forcast.weather[0].main.search('Mist') !== -1) {
    formatedForcast.weather = 'fog';
  } else if (forcast.weather[0].main.search('Thunderstorm') !== -1) {
    formatedForcast.weather = 'thunderstorm';
  } else if (forcast.weather[0].main.search('Drizzle') !== -1) {
    formatedForcast.weather = 'drizzle';
  } else {
    formatedForcast.weather = 'unknown';
  }

  return formatedForcast;
}

/**
 * @description Transform OpenWeather JSON to Gladys data.
 * @param {Object} options - The weather call options.
 * @param {Object} result - The result of the API call to OpenWeather.
 * @returns {Object} Return a formatted weather object.
 * @example
 * const formatted = formatResults(options, result);
 */
function formatResults(options, result) {
  const dataToReturn = {};

  dataToReturn.name = result.name || result.city.name;
  dataToReturn.units = options.units;

  if (options.mode === 'currently') {
    dataToReturn.sunrise = result.sys.sunrise;
    dataToReturn.sunset = result.sys.sunset;
    dataToReturn.data = [formatOneForcast(result)];
  } else if (options.mode === 'hourly') {
    dataToReturn.sunrise = result.city.sunrise;
    dataToReturn.sunset = result.city.sunset;
    dataToReturn.data = result.list
      .filter(forcast => (!options.datetime || Math.abs(forcast.dt - options.datetime) < 60))
      .map(forcast => formatOneForcast(forcast));
  } else if (options.mode === 'daily') {
    dataToReturn.data = result.list
      .filter(forcast => (!options.datetime || Math.abs(forcast.dt - options.datetime) < 86400))
      .map(forcast => formatOneForcast(forcast));
  }

  return dataToReturn;
}

module.exports = {
  formatResults,
};
