const { expect } = require('chai');

const { COVER_STATE } = require('../../../../utils/constants');
const {
  MATTER_MOVEMENT_STATUS,
  matterLiftPositionToGladys,
  gladysPositionToMatterLift,
  matterOperationalStatusToGladys,
} = require('../../../../services/matter/utils/windowCoveringMatterMapping');

describe('Matter windowCoveringMatterMapping', () => {
  describe('matterLiftPositionToGladys', () => {
    it('should turn a fully open Matter covering into a fully open Gladys shutter', () => {
      expect(matterLiftPositionToGladys(0)).to.equal(100);
    });

    it('should turn a fully closed Matter covering into a fully closed Gladys shutter', () => {
      expect(matterLiftPositionToGladys(10000)).to.equal(0);
    });

    it('should turn a Matter closing percentage into a Gladys opening percentage', () => {
      expect(matterLiftPositionToGladys(2000)).to.equal(80);
    });

    it('should return null when the position is unknown', () => {
      expect(matterLiftPositionToGladys(null)).to.equal(null);
      expect(matterLiftPositionToGladys(undefined)).to.equal(null);
    });
  });

  describe('gladysPositionToMatterLift', () => {
    it('should turn a Gladys opening percentage into a Matter closing percentage', () => {
      expect(gladysPositionToMatterLift(80)).to.equal(2000);
      expect(gladysPositionToMatterLift(100)).to.equal(0);
      expect(gladysPositionToMatterLift(0)).to.equal(10000);
    });

    it('should round to an integer value', () => {
      expect(gladysPositionToMatterLift(33.333)).to.equal(6667);
    });
  });

  describe('matterOperationalStatusToGladys', () => {
    it('should map the lift movement to the Gladys shutter state', () => {
      expect(matterOperationalStatusToGladys({ global: 0, lift: MATTER_MOVEMENT_STATUS.STOPPED, tilt: 0 })).to.equal(
        COVER_STATE.STOP,
      );
      expect(matterOperationalStatusToGladys({ global: 1, lift: MATTER_MOVEMENT_STATUS.OPENING, tilt: 0 })).to.equal(
        COVER_STATE.OPEN,
      );
      expect(matterOperationalStatusToGladys({ global: 2, lift: MATTER_MOVEMENT_STATUS.CLOSING, tilt: 0 })).to.equal(
        COVER_STATE.CLOSE,
      );
    });

    it('should use the global movement when the lift one is not reported', () => {
      expect(matterOperationalStatusToGladys({ global: MATTER_MOVEMENT_STATUS.CLOSING })).to.equal(COVER_STATE.CLOSE);
    });

    it('should return null for an unknown or missing status', () => {
      expect(matterOperationalStatusToGladys({ global: 3, lift: 3, tilt: 0 })).to.equal(null);
      expect(matterOperationalStatusToGladys(null)).to.equal(null);
      expect(matterOperationalStatusToGladys(undefined)).to.equal(null);
    });
  });
});
