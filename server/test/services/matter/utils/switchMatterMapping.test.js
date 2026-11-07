const { expect } = require('chai');

const { BUTTON_STATUS } = require('../../../../utils/constants');
const { matterPressCountToButtonStatus } = require('../../../../services/matter/utils/switchMatterMapping');

describe('Matter switchMatterMapping', () => {
  it('should convert multi-press counts to Gladys button statuses', () => {
    expect(matterPressCountToButtonStatus(2)).to.eq(BUTTON_STATUS.DOUBLE_CLICK);
    expect(matterPressCountToButtonStatus(3)).to.eq(BUTTON_STATUS.TRIPLE);
    expect(matterPressCountToButtonStatus(4)).to.eq(BUTTON_STATUS.QUADRUPLE);
    expect(matterPressCountToButtonStatus(5)).to.eq(BUTTON_STATUS.MANY);
  });

  it('should not convert a single press or a missing count', () => {
    expect(matterPressCountToButtonStatus(1)).to.eq(null);
    expect(matterPressCountToButtonStatus(0)).to.eq(null);
    expect(matterPressCountToButtonStatus(undefined)).to.eq(null);
  });
});
