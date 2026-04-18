import { Text, Localizer, MarkupText } from 'preact-i18n';
import cx from 'classnames';

import EmptyState from './EmptyState';
import StateConnection from './StateConnection';
import { RequestStatus } from '../../../../../utils/consts';
import style from './style.css';
import CardFilter from '../../../../../components/layout/CardFilter';
import ViessmannDeviceBox from '../ViessmannDeviceBox';
import debounce from 'debounce';
import { Component } from 'preact';
import { connect } from 'unistore/preact';

class DeviceTab extends Component {
  constructor(props) {
    super(props);
    this.debouncedSearch = debounce(this.search, 200).bind(this);
  }

  componentWillMount() {
    this.getViessmannDevices();
    this.getHouses();
  }

  getViessmannDevices = async () => {
    this.setState({
      getViessmannStatus: RequestStatus.Getting
    });
    try {
      const options = {
        order_dir: this.state.orderDir || 'asc'
      };
      if (this.state.search && this.state.search.length) {
        options.search = this.state.search;
      }

      const viessmannDevices = await this.props.httpClient.get('/api/v1/service/viessmann/device', options);
      this.setState({
        viessmannDevices,
        getViessmannStatus: RequestStatus.Success
      });
    } catch (e) {
      this.setState({
        getViessmannStatus: e.message
      });
    }
  };

  async getHouses() {
    this.setState({
      housesGetStatus: RequestStatus.Getting
    });
    try {
      const params = {
        expand: 'rooms'
      };
      const housesWithRooms = await this.props.httpClient.get(`/api/v1/house`, params);
      this.setState({
        housesWithRooms,
        housesGetStatus: RequestStatus.Success
      });
    } catch (e) {
      this.setState({
        housesGetStatus: RequestStatus.Error
      });
    }
  }

  async search(e) {
    await this.setState({
      search: e.target.value
    });
    this.getViessmannDevices();
  }
  changeOrderDir(e) {
    this.setState({
      orderDir: e.target.value
    });
    this.getViessmannDevices();
  }

  render(props, { orderDir, search, getViessmannStatus, viessmannDevices, housesWithRooms }) {
    return (
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text id="integration.viessmann.device.title" />
          </h1>
          <div class="page-options d-flex">
            <Localizer>
              <CardFilter
                changeOrderDir={this.changeOrderDir.bind(this)}
                orderValue={orderDir}
                search={this.debouncedSearch}
                searchValue={search}
                searchPlaceHolder={<Text id="device.searchPlaceHolder" />}
              />
            </Localizer>
          </div>
        </div>
        <div class="card-body">
          <div
            class={cx('dimmer', {
              active: getViessmannStatus === RequestStatus.Getting
            })}
          >
            <div class="loader" />
            <div class={cx('dimmer-content', style.viessmannListBody)}>
              <StateConnection {...props} />
              <div class="alert alert-secondary">
                <p>
                  <MarkupText id="integration.viessmann.device.descriptionInformation" />
                </p>
              </div>
              <div class="row">
                {viessmannDevices &&
                  viessmannDevices.length > 0 &&
                  viessmannDevices.map((device, index) => (
                    <ViessmannDeviceBox
                      editable
                      editButton
                      saveButton
                      deleteButton
                      device={device}
                      deviceIndex={index}
                      showMostRecentValueAt={device.created_at && !device.updatable}
                      getViessmannDevices={this.getViessmannDevices}
                      housesWithRooms={housesWithRooms}
                    />
                  ))}
                {!viessmannDevices || (viessmannDevices.length === 0 && <EmptyState />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(DeviceTab);
