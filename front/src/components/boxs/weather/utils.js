import dayjs from 'dayjs';

/**
 * Return the correct icon associate to the weather.
 * @param {Object} forcast - Forecast data
 * @param {integer} sunrise - Timestamp of sunrise
 * @param {integer} sunset - Timestamp of sunrset
 */
function weatherToIcon(forcast, sunrise, sunset) {
  const datetimeDjs = dayjs(forcast.datetime);
  const sunriseDjs = dayjs(sunrise);
  const sunsetDjs = dayjs(sunset);
  switch (forcast.weather) {
    case 'rain':
      return 'fe-cloud-rain';
    case 'clear':
      if (
        (datetimeDjs.hour() > sunriseDjs.hour() ||
          (datetimeDjs.hour() === sunriseDjs.hour() && datetimeDjs.minute() > sunriseDjs.minute())) &&
        (datetimeDjs.hour() < sunsetDjs.hour() ||
          (datetimeDjs.hour() === sunsetDjs.hour() && datetimeDjs.minute() < sunsetDjs.minute()))
      ) {
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
}

export { weatherToIcon };
