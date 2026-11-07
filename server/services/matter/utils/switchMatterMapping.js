const { BUTTON_STATUS } = require('../../../utils/constants');

/**
 * @description Convert the number of presses of a Matter Switch MultiPressComplete event
 * to a Gladys button status. A single press is already reported by the ShortRelease
 * event, so it is not converted again.
 * @param {number} totalNumberOfPressesCounted - Number of presses counted by the device.
 * @returns {number|null} Gladys BUTTON_STATUS value, or null when there is nothing to report.
 * @example
 * const buttonStatus = matterPressCountToButtonStatus(2);
 */
function matterPressCountToButtonStatus(totalNumberOfPressesCounted) {
  switch (totalNumberOfPressesCounted) {
    case 2:
      return BUTTON_STATUS.DOUBLE_CLICK;
    case 3:
      return BUTTON_STATUS.TRIPLE;
    case 4:
      return BUTTON_STATUS.QUADRUPLE;
    default:
      return totalNumberOfPressesCounted > 4 ? BUTTON_STATUS.MANY : null;
  }
}

module.exports = {
  matterPressCountToButtonStatus,
};
