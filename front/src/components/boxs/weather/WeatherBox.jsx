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
import { weatherToIcon } from './utils'

const padding = {
  paddingLeft: '40px',
  paddingRight: '40px',
  paddingTop: '10px',
  paddingBottom: '10px'
};

const BOX_REFRESH_INTERVAL_MS = 30 * 60 * 1000;

const WeatherBox = ({ children, ...props }) => (
  <div class="card">
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
        <div class="row">
          <div class="col-6">
            <div
              style={{
                fontSize: '14px',
                color: '#76838f'
              }}
            >
              {dayjs(props.weather.data[0].datetime).format('D MMM')}
            </div>
            <div
              style={{
                fontSize: '40px'
              }}
              class="font-size-40 blue-grey-700"
            >
              <Text id="global.degreeValue" fields={{ value: Math.round(props.weather.data[0].temperature) }} />
              <span
                style={{
                  fontSize: '30px'
                }}
              >
                {props.weather.units === 'metric' ? 'C' : 'F'}
              </span>
            </div>
          </div>
          <div
            class="col-6 text-right"
            style={{
              padding: '10px'
            }}
          >
            <i
              class={`fe ${weatherToIcon(props.weather.data[0], props.weather.sunrise, props.weather.sunset)}`}
              style={{
                fontSize: '60px'
              }}
            />
          </div>
        </div>
      </div>
    )}
  </div>
);

@connect('DashboardBoxDataWeather,DashboardBoxStatusWeather', actions)
class WeatherBoxComponent extends Component {
  componentDidMount() {
    // get the weather
    this.props.getWeather(this.props.box, this.props.x, this.props.y);
    // refresh weather every interval
    setInterval(() => this.props.getWeather(this.props.box, this.props.x, this.props.y), BOX_REFRESH_INTERVAL_MS);
  }

  render(props, { }) {
    const boxData = get(props, `${DASHBOARD_BOX_DATA_KEY}Weather.${props.x}_${props.y}`);
    const boxStatus = get(props, `${DASHBOARD_BOX_STATUS_KEY}Weather.${props.x}_${props.y}`);
    const weather = get(boxData, 'weather');
    console.log('weatherbox', weather)

    return (
      <WeatherBox
        {...props}
        weather={weather}
        boxStatus={boxStatus}
      />
    );
  }
}

export default WeatherBoxComponent;
