import { Text, Localizer, MarkupText } from 'preact-i18n';
import cx from 'classnames';

import style from './style.css';
import StateConnection from './StateConnection';
import { RequestStatus } from '../../../../../utils/consts';
import { STATUS } from '../../../../../../../server/services/viessmann/lib/utils/viessmann.constants';
import { Component } from 'preact';
import { connect } from 'unistore/preact';

class SetupTab extends Component {
  async disconnectViessmann(e) {
    e.preventDefault();

    await this.setState({
      viessmannDisconnectStatus: RequestStatus.Getting
    });
    try {
      await this.props.httpClient.post('/api/v1/service/viessmann/disconnect');
      this.props.updateStateInIndex({ connectViessmannStatus: STATUS.DISCONNECTED });
      await this.setState({
        viessmannDisconnectStatus: RequestStatus.Success
      });
    } catch (e) {
      await this.setState({
        viessmannSaveSettingsStatus: RequestStatus.Error
      });
    }
  }

  updateClientId = e => {
    this.props.updateStateInIndex({ viessmannClientId: e.target.value });
  };

  render(props, state, { loading }) {
    return (
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text id="integration.viessmann.setup.title" />
          </h1>
        </div>
        <div class="card-body">
          <div
            class={cx('dimmer', {
              active: loading
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              <StateConnection {...props} />
              <p>
                <MarkupText id="integration.viessmann.setup.description" />
              </p>
              <p>
                <MarkupText id="integration.viessmann.setup.descriptionCreateAccount" />
              </p>
              <p>
                <MarkupText id="integration.viessmann.setup.descriptionCreateApp" />
              </p>
              <p>
                <MarkupText id="integration.viessmann.setup.descriptionGetKeys" />
              </p>
              <p>
                <label htmlFor="descriptionRedirectUri" className={`form-label ${style.italicText}`}>
                  <MarkupText id="integration.viessmann.setup.descriptionRedirectUri" />
                </label>
              </p>

              <form>
                <div class="form-group">
                  <label htmlFor="viessmannClientId" className="form-label">
                    <Text id="integration.viessmann.setup.clientIdLabel" />
                  </label>
                  <Localizer>
                    <input
                      name="viessmannClientId"
                      type="text"
                      placeholder={<Text id="integration.viessmann.setup.clientIdPlaceholder" />}
                      value={props.viessmannClientId}
                      className="form-control"
                      autocomplete="off"
                      onInput={this.updateClientId}
                    />
                  </Localizer>
                </div>

                <div class="form-group">
                  <label htmlFor="viessmannSetupConnectionInfo" className="form-label">
                    <Text id="integration.viessmann.setup.connectionInfoLabel" />
                  </label>
                </div>
                <div class={style.buttonGroup}>
                  <Localizer>
                    <button type="submit" class="btn btn-success" onClick={props.saveConfiguration}>
                      <Text id="integration.viessmann.setup.saveLabel" />
                    </button>
                  </Localizer>
                  {props.connected && (
                    <button
                      onClick={this.disconnectViessmann.bind(this)}
                      class="btn btn-danger"
                      disabled={props.connectViessmannStatus === STATUS.DISCONNECTING}
                    >
                      <Text id="integration.viessmann.setup.disconnectLabel" />
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('user,session,httpClient', {})(SetupTab);
