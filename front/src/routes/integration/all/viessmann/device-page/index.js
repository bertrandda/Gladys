import { Component } from 'preact';
import { connect } from 'unistore/preact';
import DeviceTab from './DeviceTab';
import ViessmannPage from '../ViessmannPage';
import { RequestStatus } from '../../../../../utils/consts';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';
import { STATUS } from '../../../../../../../server/services/viessmann/lib/utils/viessmann.constants';

class DevicePage extends Component {
  loadStatus = async () => {
    try {
      const viessmannStatus = await this.props.httpClient.get('/api/v1/service/viessmann/status');
      this.setState({
        connectViessmannStatus: viessmannStatus.status,
        connected: viessmannStatus.connected,
        configured: viessmannStatus.configured
      });
    } catch (e) {
      this.setState({
        viessmannConnectionError: RequestStatus.NetworkError,
        errored: true
      });
      console.error(e);
    } finally {
      this.setState({
        showConnect: true
      });
    }
  };

  updateStatus = async state => {
    let connected = false;
    let configured = false;
    if (
      state.status === STATUS.CONNECTED ||
      state.status === STATUS.GET_DEVICES_VALUES ||
      state.status === STATUS.DISCOVERING_DEVICES
    ) {
      connected = true;
      configured = true;
    } else if (state.status === STATUS.NOT_INITIALIZED) {
      connected = false;
      configured = false;
    } else {
      connected = false;
      configured = true;
    }
    await this.setState({
      connectViessmannStatus: state.status,
      connected,
      configured
    });
  };

  updateStatusError = async state => {
    switch (state.statusType) {
      case STATUS.CONNECTING:
        if (state.status !== 'other_error') {
          this.setState({
            connectViessmannStatus: STATUS.DISCONNECTED,
            connected: false,
            accessDenied: true,
            messageAlert: state.status
          });
        } else {
          this.setState({
            connectViessmannStatus: STATUS.DISCONNECTED,
            connected: false,
            errored: true
          });
        }
        break;
      case STATUS.PROCESSING_TOKEN:
        if (state.status === 'get_access_token_fail' || state.status === 'invalid_client') {
          this.setState({
            connectViessmannStatus: STATUS.DISCONNECTED,
            connected: false,
            accessDenied: true,
            messageAlert: state.status
          });
        } else {
          this.setState({
            connectViessmannStatus: STATUS.DISCONNECTED,
            connected: false,
            errored: true
          });
        }
        break;
    }
  };

  handleStateUpdateFromChild = newState => {
    this.setState(newState);
  };

  componentDidMount() {
    this.loadStatus();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.VIESSMANN.STATUS, this.updateStatus);
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.VIESSMANN.ERROR.CONNECTING,
      this.updateStatusError
    );
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.VIESSMANN.ERROR.PROCESSING_TOKEN,
      this.updateStatus
    );
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.VIESSMANN.STATUS, this.updateStatus);
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.VIESSMANN.ERROR.CONNECTING,
      this.updateStatusError
    );
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.VIESSMANN.ERROR.PROCESSING_TOKEN,
      this.updateStatusError
    );
  }

  render(props, state, { loading }) {
    return (
      <ViessmannPage {...props}>
        <DeviceTab
          {...props}
          {...state}
          loading={loading}
          loadProps={this.loadProps}
          updateStateInIndex={this.handleStateUpdateFromChild}
        />
      </ViessmannPage>
    );
  }
}

export default connect('user,session,httpClient', {})(DevicePage);
