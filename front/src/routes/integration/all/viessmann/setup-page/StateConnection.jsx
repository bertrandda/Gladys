import { Text, MarkupText } from 'preact-i18n';
import { STATUS } from '../../../../../../../server/services/viessmann/lib/utils/viessmann.constants';

const StateConnection = props => (
  <div>
    {props.accessDenied && (
      <p class="text-center alert alert-warning">
        <MarkupText id={`integration.viessmann.status.errorConnecting.${props.messageAlert}`} />
      </p>
    )}
    {!props.accessDenied &&
      ((props.connectViessmannStatus === STATUS.CONNECTING && (
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
        (props.connectViessmannStatus === STATUS.NOT_INITIALIZED && (
          <p class="text-center alert alert-warning">
            <Text id="integration.viessmann.status.notConfigured" />
          </p>
        )))}
  </div>
);

export default StateConnection;
