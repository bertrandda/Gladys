/**
 * @description Format one forcast.
 * @param {Object} forcast - OpenWeather forcast to format.
 * @example
 * const formatedForcast = formatOneForcast(options, forcast);
 */
function formatOneForcast(forcast) {
  const formatedForcast = {};
  formatedForcast.temperature = forcast.main ? forcast.main.temp : forcast.temp.day;
  formatedForcast.humidity = forcast.humidity || forcast.main.humidity;
  formatedForcast.pressure = forcast.pressure || forcast.main.pressure;
  formatedForcast.datetime = forcast.dt * 1000;
  formatedForcast.wind_speed = forcast.speed || forcast.wind.speed;
  formatedForcast.wind_direction = forcast.deg || forcast.wind.deg;

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

  dataToReturn.name = result.current ? result.current.name : result.forcast.city.name;
  dataToReturn.units = options.units === 'standard' ? 'si' : options.units;

  if (result.current) {
    dataToReturn.sunrise = result.current.sys.sunrise * 1000;
    dataToReturn.sunset = result.current.sys.sunset * 1000;
    dataToReturn.current = formatOneForcast(result.current);
  }

  if (options.mode === 'hourly') {
    dataToReturn.sunrise = result.forcast.city.sunrise * 1000;
    dataToReturn.sunset = result.forcast.city.sunset * 1000;
    dataToReturn.data = result.forcast.list
      .filter((forcast) => !options.datetime || Math.abs(forcast.dt - options.datetime) < 3 * 60 * 60)
      .map((forcast) => formatOneForcast(forcast));
  } else if (options.mode === 'daily') {
    dataToReturn.data = result.forcast.list
      .filter((forcast) => !options.datetime || Math.abs(forcast.dt - options.datetime) < 24 * 60 * 60)
      .map((forcast) => formatOneForcast(forcast));
  }

  return dataToReturn;
}

module.exports = {
  formatResults,
};
