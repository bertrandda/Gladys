import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { route } from 'preact-router';
import SetupTab from './SetupTab';
import ViessmannPage from '../ViessmannPage';
import withIntlAsProp from '../../../../../utils/withIntlAsProp';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';
import { STATUS } from '../../../../../../../server/services/viessmann/lib/utils/viessmann.constants';
import { RequestStatus } from '../../../../../utils/consts';

class ViessmannSetupPage extends Component {
  getRedirectUri = async () => {
    try {
      const result = await this.props.httpClient.post('/api/v1/service/viessmann/connect');
      await this.setState({
        redirectUri: result.authUrl,
        viessmannState: result.state
      });
    } catch (e) {
      console.error(e);
      await this.setState({ errored: true });
    }
  };

  detectCode = async () => {
    if (this.props.error) {
      if (this.props.error === 'access_denied' || this.props.error === 'invalid_client') {
        await this.setState({
          connectViessmannStatus: STATUS.DISCONNECTED,
          connected: false,
          configured: true,
          accessDenied: true,
          messageAlert: this.props.error
        });
      } else {
        await this.setState({
          accessDenied: true,
          messageAlert: 'other_error',
          errored: true
        });
        console.error('Logs error', this.props);
      }
    }
    if (this.props.code && this.props.state) {
      try {
        await this.setState({
          connectViessmannStatus: STATUS.PROCESSING_TOKEN,
          connected: false,
          configured: true,
          errored: false
        });
        await this.props.httpClient.post('/api/v1/service/viessmann/token', {
          codeOAuth: this.props.code,
          state: this.props.state
        });
        await this.setState({
          connectViessmannStatus: STATUS.CONNECTED,
          connected: true,
          configured: true,
          errored: false
        });
        await this.props.httpClient.get('/api/v1/service/viessmann/discover', { refresh: true });
        setTimeout(() => {
          route('/dashboard/integration/device/viessmann/setup', true);
        }, 100);
      } catch (e) {
        console.error(e);
        await this.setState({
          connectViessmannStatus: STATUS.DISCONNECTED,
          connected: false,
          configured: true,
          errored: true
        });
      }
    }
  };

  saveConfiguration = async e => {
    e.preventDefault();

    try {
      await this.props.httpClient.post('/api/v1/service/viessmann/configuration', {
        clientId: this.state.viessmannClientId
      });
      await this.setState({
        viessmannSaveSettingsStatus: RequestStatus.Success
      });
    } catch (e) {
      await this.setState({
        viessmannSaveSettingsStatus: RequestStatus.Error,
        errored: true
      });
      return;
    }
    try {
      await this.setState({
        connectViessmannStatus: STATUS.CONNECTING,
        connected: false,
        configured: true
      });
      await this.getRedirectUri();
      const redirectUri = this.state.redirectUri;
      if (redirectUri) {
        window.location.href = redirectUri;
        await this.setState({
          connectViessmannStatus: RequestStatus.Success,
          connected: false,
          configured: true
        });
      } else {
        console.error('Missing redirect URL');
        await this.setState({
          connectViessmannStatus: STATUS.ERROR.CONNECTING,
          connected: false
        });
      }
    } catch (e) {
      console.error('Error when redirecting to Viessmann', e);
      await this.setState({
        connectViessmannStatus: STATUS.ERROR.CONNECTING,
        connected: false,
        errored: true
      });
    }
  };

  loadProps = async () => {
    let configuration = {};
    try {
      configuration = await this.props.httpClient.get('/api/v1/service/viessmann/configuration');
    } catch (e) {
      console.error(e);
      await this.setState({ errored: true });
    } finally {
      await this.setState({
        viessmannClientId: configuration.clientId
      });
    }
  };

  loadStatus = async () => {
    try {
      const viessmannStatus = await this.props.httpClient.get('/api/v1/service/viessmann/status');
      await this.setState({
        connectViessmannStatus: viessmannStatus.status,
        connected: viessmannStatus.connected,
        configured: viessmannStatus.configured
      });
    } catch (e) {
      await this.setState({
        viessmannConnectionError: RequestStatus.NetworkError,
        errored: true
      });
      console.error(e);
    }
  };

  init = async () => {
    await this.setState({ loading: true, errored: false });
    await this.detectCode();
    await this.setState({ loading: false });
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
    this.init();
    this.loadProps();
    this.loadStatus();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.VIESSMANN.STATUS, this.updateStatus);
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.VIESSMANN.ERROR.CONNECTING,
      this.updateStatusError
    );
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.VIESSMANN.ERROR.PROCESSING_TOKEN,
      this.updateStatusError
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
        <SetupTab
          {...props}
          {...state}
          loading={loading}
          loadProps={this.loadProps}
          updateStateInIndex={this.handleStateUpdateFromChild}
          saveConfiguration={this.saveConfiguration}
        />
      </ViessmannPage>
    );
  }
}

export default withIntlAsProp(connect('user,session,httpClient', {})(ViessmannSetupPage));
