const { COVER_STATE } = require('../../../utils/constants');

// Matter WindowCovering MovementStatus enum (Matter Application Cluster specification, 5.3.5.3).
const MATTER_MOVEMENT_STATUS = {
  STOPPED: 0,
  OPENING: 1,
  CLOSING: 2,
};

const MATTER_MOVEMENT_STATUS_TO_GLADYS = {
  [MATTER_MOVEMENT_STATUS.STOPPED]: COVER_STATE.STOP,
  [MATTER_MOVEMENT_STATUS.OPENING]: COVER_STATE.OPEN,
  [MATTER_MOVEMENT_STATUS.CLOSING]: COVER_STATE.CLOSE,
};

/**
 * @description Convert a Matter lift position to a Gladys shutter position.
 * Matter counts how much the covering is closed (0 = fully open, 10000 = fully closed, in 100ths
 * of a percent), Gladys counts how much it is open (0 = closed, 100 = open), like HomeKit,
 * Google Home and Alexa.
 * @param {number|null|undefined} liftPercent100ths - Matter CurrentPositionLiftPercent100ths.
 * @returns {number|null} The Gladys position in percent, or null when the position is unknown.
 * @example
 * matterLiftPositionToGladys(2000); // 80
 */
function matterLiftPositionToGladys(liftPercent100ths) {
  if (liftPercent100ths === null || liftPercent100ths === undefined) {
    return null;
  }
  return 100 - liftPercent100ths / 100;
}

/**
 * @description Convert a Gladys shutter position to a Matter lift position.
 * @param {number} position - The Gladys position in percent (0 = closed, 100 = open).
 * @returns {number} The Matter LiftPercent100thsValue (0 = open, 10000 = closed).
 * @example
 * gladysPositionToMatterLift(80); // 2000
 */
function gladysPositionToMatterLift(position) {
  return Math.round((100 - position) * 100);
}

/**
 * @description Convert a Matter OperationalStatus to a Gladys shutter state.
 * The lift field describes the movement of the covering, the global field is used when the
 * device does not report the lift one.
 * @param {object|null|undefined} operationalStatus - Matter OperationalStatus bitmap.
 * @returns {number|null} The Gladys COVER_STATE, or null when the status is unknown.
 * @example
 * matterOperationalStatusToGladys({ global: 1, lift: 1, tilt: 0 }); // COVER_STATE.OPEN
 */
function matterOperationalStatusToGladys(operationalStatus) {
  if (operationalStatus === null || operationalStatus === undefined) {
    return null;
  }
  const movementStatus = operationalStatus.lift !== undefined ? operationalStatus.lift : operationalStatus.global;
  const gladysState = MATTER_MOVEMENT_STATUS_TO_GLADYS[movementStatus];
  return gladysState !== undefined ? gladysState : null;
}

module.exports = {
  MATTER_MOVEMENT_STATUS,
  matterLiftPositionToGladys,
  gladysPositionToMatterLift,
  matterOperationalStatusToGladys,
};
