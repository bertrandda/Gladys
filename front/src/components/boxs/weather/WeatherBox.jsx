import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import actions from '../../../actions/dashboard/boxes/weather';
import {
  RequestStatus,
  GetWeatherStatus,
  DASHBOARD_BOX_STATUS_KEY,
  DASHBOARD_BOX_DATA_KEY
} from '../../../utils/consts';
import get from 'get-value';
import dayjs from 'dayjs';
import { weatherToIcon } from './utils';

const padding = {
  paddingLeft: '40px',
  paddingRight: '40px',
  paddingTop: '10px',
  paddingBottom: '10px'
};

const BOX_REFRESH_INTERVAL_MS = 30 * 60 * 1000;

const WeatherBox = ({ children, ...props }) => (
  <div class="card">
    {dayjs().locale(props.user.language)}
    {props.boxStatus === GetWeatherStatus.HouseHasNoCoordinates && (
      <div>
        <h4 class="card-header">
          <Text id="dashboard.boxTitle.weather" />
        </h4>
        <div class="card-body">
          <p class="alert alert-danger">
            <i class="fe fe-bell" />
            <span class="pl-2">
              <Text id="dashboard.boxes.weather.houseHasNoCoordinates" />
            </span>
          </p>
        </div>
      </div>
    )}
    {props.boxStatus === GetWeatherStatus.ServiceNotConfigured && (
      <div>
        <h4 class="card-header">
          <Text id="dashboard.boxTitle.weather" />
        </h4>
        <div class="card-body">
          <p class="alert alert-danger">
            <i class="fe fe-bell" />
            <span class="pl-2">
              <Text id="dashboard.boxes.weather.serviceNotConfigured" />
            </span>
          </p>
        </div>
      </div>
    )}
    {props.boxStatus === RequestStatus.Error && (
      <div>
        <h4 class="card-header">
          <Text id="dashboard.boxTitle.weather" />
        </h4>
        <div class="card-body">
          <p class="alert alert-danger">
            <i class="fe fe-bell" />
            <span class="pl-2">
              <Text id="dashboard.boxes.weather.unknownError" />
            </span>
          </p>
        </div>
      </div>
    )}
    {props.boxStatus === RequestStatus.Getting && !props.weather && (
      <div>
        <div class="card-body">
          <div class="dimmer active">
            <div class="loader" />
            <div class="dimmer-content" style={padding} />
          </div>
        </div>
      </div>
    )}
    {props.boxStatus === GetWeatherStatus.RequestToThirdPartyFailed && (
      <div>
        <h4 class="card-header">
          <Text id="dashboard.boxTitle.weather" />
        </h4>
        <div class="card-body">
          <p class="alert alert-danger">
            <i class="fe fe-bell" />
            <span class="pl-2">
              <Text id="dashboard.boxes.weather.requestToThirdPartyFailed" />{' '}
              <Link href="/dashboard/integration/weather/openweather">
                <Text id="dashboard.boxes.weather.clickHere" />
              </Link>
            </span>
          </p>
        </div>
      </div>
    )}
    {props.weather && (
      <div style={padding} class="card-block px-30 py-10">
        <div
          style={{
            fontSize: '14px',
            color: '#76838f'
          }}
        >
          {`${dayjs(props.weather.current.datetime).format('D MMM')} - ${props.weather.name}`}
        </div>
        <div class="row">
          <div class="col-9">
            <div
              style={{
                fontSize: '40px',
                lineHeight: '1.2'
              }}
              class="font-size-40 blue-grey-700"
            >
              {`${Math.round(props.weather.current.temperature)}°`}
              <span
                style={{
                  fontSize: '30px'
                }}
              >
                {props.weather.units === 'si' ? 'K' : props.weather.units === 'metric' ? 'C' : 'F'}
              </span>
            </div>
          </div>
          <div
            class="col-3 text-right"
            style={{
              paddingRight: '10px',
              paddingLeft: '10px',
              marginTop: '-0.75rem'
            }}
          >
            <i
              class={`fe ${weatherToIcon(props.weather.current, props.weather.sunrise, props.weather.sunset)}`}
              style={{
                fontSize: '60px'
              }}
            />
          </div>
        </div>
        <div class="col-9" style={{ padding: '0' }}>
          <span>
            <i
              class="fe fe-droplet"
              style={{
                paddingRight: '5px'
              }}
            />
            {props.weather.current.humidity}
            <span
              style={{
                fontSize: '12px',
                color: 'grey'
              }}
            >
              <Text id="dashboard.boxes.weather.percent" />
            </span>
          </span>
          <span style={{ float: 'right' }}>
            <i
              class="fe fe-wind"
              style={{
                paddingRight: '5px'
              }}
            />
            {props.weather.current.wind_speed}
            <span
              style={{
                fontSize: '12px',
                color: 'grey'
              }}
            >
              {props.weather.units === 'imperial' ? 'mph/h' : 'm/s'}
            </span>
          </span>
        </div>

        {(props.weather.options.mode === 'hourly' || props.weather.options.mode === 'daily') && (
          <div style={{ display: 'flex' }}>
            {props.weather.data
              .filter((forcast, i) => (props.weather.options.mode !== 'daily' || i > 0) && i < 7)
              .map(forcast => (
                <div style={Object.assign({ width: '14%', margin: '0.25em 1.25%' })}>
                  <p style={{ margin: 'auto', textAlign: 'center', fontSize: '10px', color: 'grey' }}>
                    {`${dayjs(forcast.datetime).format(props.weather.options.mode === 'hourly' ? 'HH' : 'ddd')}${
                      props.weather.options.mode === 'hourly' ? 'h' : ''
                    }`}
                  </p>
                  <p style={{ margin: 'auto', textAlign: 'center' }}>
                    <i
                      className={`fe ${weatherToIcon(forcast, props.weather.sunrise, props.weather.sunset)}`}
                      style={{ fontSize: '20px' }}
                    />
                  </p>
                  <p style={{ margin: 'auto', textAlign: 'center', fontSize: '12px' }}>{`${Math.round(
                    forcast.temperature
                  )}°`}</p>
                </div>
              ))}
          </div>
        )}
      </div>
    )}
  </div>
);

@connect('user,DashboardBoxDataWeather,DashboardBoxStatusWeather', actions)
class WeatherBoxComponent extends Component {
  componentDidMount() {
    // get the weather
    this.props.getWeather(this.props.box, this.props.x, this.props.y);
    // refresh weather every interval
    setInterval(() => this.props.getWeather(this.props.box, this.props.x, this.props.y), BOX_REFRESH_INTERVAL_MS);
  }

  render(props, {}) {
    const boxData = get(props, `${DASHBOARD_BOX_DATA_KEY}Weather.${props.x}_${props.y}`);
    const boxStatus = get(props, `${DASHBOARD_BOX_STATUS_KEY}Weather.${props.x}_${props.y}`);
    const weather = get(boxData, 'weather');

    return <WeatherBox {...props} weather={weather} boxStatus={boxStatus} />;
  }
}

export default WeatherBoxComponent;
