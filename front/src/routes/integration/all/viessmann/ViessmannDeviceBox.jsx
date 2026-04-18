import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { connect } from 'unistore/preact';
import dayjs from 'dayjs';
import get from 'get-value';
import DeviceFeatures from '../../../../components/device/view/DeviceFeatures';

class ViessmannDeviceBox extends Component {
  componentWillMount() {
    this.setState({
      device: this.props.device,
      user: this.props.user
    });
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      device: nextProps.device
    });
  }

  updateName = e => {
    this.setState({
      device: {
        ...this.state.device,
        name: e.target.value
      }
    });
  };

  updateRoom = e => {
    this.setState({
      device: {
        ...this.state.device,
        room_id: e.target.value
      }
    });
  };

  saveDevice = async () => {
    this.setState({
      loading: true,
      errorMessage: null
    });
    try {
      const savedDevice = await this.props.httpClient.post(`/api/v1/device`, this.state.device);
      this.setState({
        device: savedDevice,
        isSaving: true
      });
    } catch (e) {
      let errorMessage = 'integration.viessmann.error.defaultError';
      if (e.response.status === 409) {
        errorMessage = 'integration.viessmann.error.conflictError';
      }
      this.setState({
        errorMessage
      });
    }
    this.setState({
      loading: false
    });
  };

  deleteDevice = async () => {
    this.setState({
      loading: true,
      errorMessage: null,
      tooMuchStatesError: false,
      statesNumber: undefined
    });
    try {
      if (this.state.device.created_at) {
        await this.props.httpClient.delete(`/api/v1/device/${this.state.device.selector}`);
      }
      this.props.getViessmannDevices();
    } catch (e) {
      const status = get(e, 'response.status');
      const dataMessage = get(e, 'response.data.message');
      if (status === 400 && dataMessage && dataMessage.includes('Too much states')) {
        const statesNumber = new Intl.NumberFormat().format(dataMessage.split(' ')[0]);
        this.setState({ tooMuchStatesError: true, statesNumber });
      } else {
        this.setState({
          errorMessage: 'integration.viessmann.error.defaultDeletionError'
        });
      }
    }
    this.setState({
      loading: false
    });
  };

  render(
    {
      deviceIndex,
      editable,
      deleteButton,
      saveButton,
      updateButton,
      alreadyCreatedButton,
      showMostRecentValueAt,
      housesWithRooms
    },
    { device, user, loading, errorMessage, tooMuchStatesError, statesNumber }
  ) {
    const validModel = device.features && device.features.length > 0;
    const saveButtonCondition =
      (saveButton && !alreadyCreatedButton) || (saveButton && !this.state.isSaving && alreadyCreatedButton);

    let mostRecentValueAt = null;
    if (device.features) {
      device.features.forEach(feature => {
        if (feature.last_value_changed && new Date(feature.last_value_changed) > mostRecentValueAt) {
          mostRecentValueAt = new Date(feature.last_value_changed);
        }
      });
    }

    return (
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <Localizer>
              <div>
                <i class="fe fe-thermometer" />
                &nbsp;{device.name}
              </div>
            </Localizer>
          </div>
          <div
            class={cx('dimmer', {
              active: loading
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              <div class="card-body">
                {errorMessage && (
                  <div class="alert alert-danger">
                    <Text id={errorMessage} />
                  </div>
                )}
                {tooMuchStatesError && (
                  <div class="alert alert-warning">
                    <Text id="device.tooMuchStatesToDelete" fields={{ count: statesNumber }} />
                  </div>
                )}

                <div class="form-group">
                  <label class="form-label" for={`name_${deviceIndex}`}>
                    <Text id="integration.viessmann.device.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      id={`name_${deviceIndex}`}
                      type="text"
                      value={device.name}
                      onInput={this.updateName}
                      class="form-control"
                      placeholder={<Text id="integration.viessmann.device.namePlaceholder" />}
                      disabled={!editable || !validModel}
                    />
                  </Localizer>
                </div>

                {device.model && (
                  <div class="form-group">
                    <label class="form-label" for={`model_${deviceIndex}`}>
                      <Text id="integration.viessmann.device.modelLabel" />
                    </label>
                    <input
                      id={`model_${deviceIndex}`}
                      type="text"
                      value={device.model}
                      class="form-control"
                      disabled="true"
                    />
                  </div>
                )}

                {device.external_id && (
                  <div class="form-group">
                    <label class="form-label" for={`externalId_${deviceIndex}`}>
                      <Text id="integration.viessmann.device.externalIdLabel" />
                    </label>
                    <input
                      id={`externalId_${deviceIndex}`}
                      type="text"
                      value={device.external_id.replace('viessmann:', '')}
                      class="form-control"
                      disabled="true"
                    />
                  </div>
                )}

                {validModel && (
                  <div class="form-group">
                    <label class="form-label" for={`room_${deviceIndex}`}>
                      <Text id="integration.viessmann.device.roomLabel" />
                    </label>
                    <select
                      id={`room_${deviceIndex}`}
                      onChange={this.updateRoom}
                      class="form-control"
                      disabled={!editable || !validModel}
                    >
                      <option value="">
                        <Text id="global.emptySelectOption" />
                      </option>
                      {housesWithRooms &&
                        housesWithRooms.map(house => (
                          <optgroup label={house.name}>
                            {house.rooms.map(room => (
                              <option selected={room.id === device.room_id} value={room.id}>
                                {room.name}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                    </select>
                  </div>
                )}

                {validModel && (
                  <div class="form-group">
                    <label class="form-label">
                      <Text id="integration.viessmann.device.featuresLabel" />
                    </label>
                    <DeviceFeatures features={device.features} />
                  </div>
                )}

                <div class="form-group">
                  {validModel && this.state.isSaving && alreadyCreatedButton && (
                    <button class="btn btn-primary mr-2" disabled="true">
                      <Text id="integration.viessmann.discover.alreadyCreatedButton" />
                    </button>
                  )}

                  {validModel && updateButton && (
                    <button onClick={this.saveDevice} class="btn btn-success mr-2">
                      <Text id="integration.viessmann.discover.updateButton" />
                    </button>
                  )}

                  {validModel && saveButtonCondition && (
                    <button onClick={this.saveDevice} class="btn btn-success mr-2">
                      <Text id="integration.viessmann.device.saveButton" />
                    </button>
                  )}

                  {validModel && deleteButton && (
                    <button onClick={this.deleteDevice} class="btn btn-danger">
                      <Text id="integration.viessmann.device.deleteButton" />
                    </button>
                  )}

                  {!validModel && (
                    <div class="alert alert-warning">
                      <Text id="integration.viessmann.discover.noFeaturesFound" />
                    </div>
                  )}

                  {validModel && showMostRecentValueAt && (
                    <p class="mt-4">
                      {mostRecentValueAt ? (
                        <Text
                          id="integration.mqtt.device.mostRecentValueAt"
                          fields={{
                            mostRecentValueAt: dayjs(mostRecentValueAt)
                              .locale(user.language)
                              .fromNow()
                          }}
                        />
                      ) : (
                        <Text id="integration.viessmann.device.noValueReceived" />
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient,user', {})(ViessmannDeviceBox);
