import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import { STATUS } from '../../../../../../../server/services/viessmann/lib/utils/viessmann.constants';

const StateConnection = props => (
  <div>
    {!props.accessDenied &&
      ((props.connectViessmannStatus === STATUS.DISCOVERING_DEVICES && (
        <p class="text-center alert alert-info">
          <Text id="integration.viessmann.status.discoveringDevices" />
        </p>
      )) ||
        (props.connectViessmannStatus === STATUS.GET_DEVICES_VALUES && (
          <p class="text-center alert alert-info">
            <Text id="integration.viessmann.status.getDevicesValues" />
          </p>
        )) ||
        (props.connectViessmannStatus === STATUS.CONNECTING && (
          <p class="text-center alert alert-info">
            <Text id="integration.viessmann.status.connecting" />
          </p>
        )) ||
        (props.connectViessmannStatus === STATUS.PROCESSING_TOKEN && (
          <p class="text-center alert alert-warning">
            <Text id="integration.viessmann.status.processingToken" />
          </p>
        )) ||
        (props.connected && (
          <p class="text-center alert alert-success">
            <Text id="integration.viessmann.status.connect" />
          </p>
        )) ||
        (props.connectViessmannStatus === STATUS.DISCONNECTED && (
          <p class="text-center alert alert-danger">
            <Text id="integration.viessmann.status.disconnect" />
          </p>
        )) ||
        ((props.errorLoading || props.connectViessmannStatus === STATUS.NOT_INITIALIZED) && (
          <p class="text-center alert alert-warning">
            <Text id="integration.viessmann.status.notConnected" />
            <Link href="/dashboard/integration/device/viessmann/setup">
              <Text id="integration.viessmann.status.setupPageLink" />
            </Link>
          </p>
        )))}
  </div>
);

export default StateConnection;
