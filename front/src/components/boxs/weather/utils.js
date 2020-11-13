/**
 * Return the correct icon associate to the weather.
 * @param {Object} forcast - Forecast associate data
 * @param {integer} sunrise - Timestamp of sunrise
 * @param {integer} sunset - Timestamp of sunrset
 */
function weatherToIcon(forcast, sunrise, sunset) {
  switch (forcast.weather) {
    case 'rain':
      return 'fe-cloud-rain';
    case 'clear':
      if (forcast.datetime > sunrise
        && forcast.datetime < sunset) {
          return 'fe-sun';
      }
      return 'fe-moon';
    case 'cloud':
    case 'fog':
      return 'fe-cloud';
    case 'snow':
      return 'fe-cloud-snow';
    case 'drizzle':
      return 'fe-cloud-drizzle';
    case 'thunderstorm':
      return 'fe-cloud-lightning';
    default:
  }

  return 'fe-question';
};

export { weatherToIcon };
