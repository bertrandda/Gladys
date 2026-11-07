const Promise = require('bluebird');
const cloneDeep = require('lodash.clonedeep');
const db = require('../models');
const logger = require('../utils/logger');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, ACTIONS, EVENTS, COVER_STATE } = require('../utils/constants');

// External id suffix of the position of the Matter WindowCovering cluster (cluster id 258), see
// convertToGladysDevice.
const MATTER_SHUTTER_POSITION_EXTERNAL_ID_SUFFIX = ':258:position';
const MATTER_SHUTTER_STATE_EXTERNAL_ID_SUFFIX = ':258:state';

// A threshold on an inverted value keeps its meaning with the opposite operator:
// "closed at more than 70 %" is "open at less than 30 %".
const INVERTED_OPERATORS = {
  '>': '<',
  '>=': '<=',
  '<': '>',
  '<=': '>=',
  '=': '=',
  '!=': '!=',
};

/**
 * @description Invert a position stored in a scene, keeping its type (number or string).
 * @param {number|string} value - The position, as stored in the scene.
 * @returns {number|string|null} The inverted position, or null when it is not a plain number.
 * @example
 * invertPosition(80); // 20
 */
function invertPosition(value) {
  if (value === null || value === undefined || value === '' || !Number.isFinite(Number(value))) {
    return null;
  }
  const inverted = 100 - Number(value);
  return typeof value === 'string' ? String(inverted) : inverted;
}

// The Matter integration copied the WindowCovering position as is, but Matter counts how much the
// covering is closed (0 = open) while Gladys, HomeKit, Google Home and Alexa count how much it is
// open (0 = closed): "open at 80 %" closed the shutter at 80 % (forum 9534, audit 11499). The
// integration now inverts it; this migration inverts what was stored with the old direction:
// - the last value of the Matter shutter positions (and the range of their state, -1 to 1);
// - the "set value" actions of the scenes targeting one of them, when the value is a plain number;
// - the "device state" triggers on them, value and operator, when they only watch Matter positions.
// A value computed by a formula, a trigger mixing a Matter position with other features, and a
// condition on a value read by a "get value" action cannot be rewritten safely: they are left
// untouched and logged, so the user can fix them by hand. The history is not rewritten.
// Not idempotent by nature (it inverts), it relies on the migration table to run only once.
module.exports = {
  up: async () => {
    const service = await db.Service.findOne({
      attributes: ['id'],
      where: {
        name: 'matter',
      },
    });
    if (service === null) {
      logger.info('Matter shutter position migration: matter service not found, nothing to do.');
      return;
    }
    const devices = await db.Device.findAll({
      attributes: ['id'],
      where: {
        service_id: service.id,
      },
      include: [
        {
          model: db.DeviceFeature,
          as: 'features',
          attributes: ['id', 'selector', 'category', 'type', 'external_id', 'last_value'],
        },
      ],
    });
    const features = devices.flatMap((device) => device.features);

    // The shutter state was declared from 0 to 1 while COVER_STATE.CLOSE is -1
    const stateFeatures = features.filter(
      (feature) =>
        feature.category === DEVICE_FEATURE_CATEGORIES.SHUTTER &&
        feature.type === DEVICE_FEATURE_TYPES.SHUTTER.STATE &&
        feature.external_id.endsWith(MATTER_SHUTTER_STATE_EXTERNAL_ID_SUFFIX),
    );
    await Promise.each(stateFeatures, async (feature) => {
      await db.DeviceFeature.update(
        {
          min: COVER_STATE.CLOSE,
          max: COVER_STATE.OPEN,
        },
        {
          where: {
            id: feature.id,
          },
        },
      );
    });

    const positionFeatures = features.filter(
      (feature) =>
        feature.category === DEVICE_FEATURE_CATEGORIES.SHUTTER &&
        feature.type === DEVICE_FEATURE_TYPES.SHUTTER.POSITION &&
        feature.external_id.endsWith(MATTER_SHUTTER_POSITION_EXTERNAL_ID_SUFFIX),
    );
    if (positionFeatures.length === 0) {
      logger.info('Matter shutter position migration: no Matter shutter, nothing to do.');
      return;
    }

    await Promise.each(positionFeatures, async (feature) => {
      if (feature.last_value === null) {
        return;
      }
      await db.DeviceFeature.update(
        {
          last_value: 100 - feature.last_value,
        },
        {
          where: {
            id: feature.id,
          },
        },
      );
      logger.info(`Matter shutter position migration: ${feature.selector} last value inverted.`);
    });

    const positionSelectors = new Set(positionFeatures.map((feature) => feature.selector));
    const scenes = await db.Scene.findAll({
      attributes: ['id', 'selector', 'actions', 'triggers'],
    });
    await Promise.each(scenes, async (scene) => {
      let sceneChanged = false;

      const migrateAction = (action) => {
        if (positionSelectors.has(action.device_feature)) {
          if (action.type === ACTIONS.DEVICE.SET_VALUE) {
            const invertedValue = action.evaluate_value === undefined ? invertPosition(action.value) : null;
            if (invertedValue === null) {
              logger.warn(
                `Matter shutter position migration: scene ${scene.selector} sets ${action.device_feature} with a formula, check it by hand.`,
              );
            } else {
              action.value = invertedValue;
              sceneChanged = true;
            }
          } else {
            // A "get value" action: the conditions using the value it read cannot be traced
            logger.warn(
              `Matter shutter position migration: scene ${scene.selector} reads ${action.device_feature}, check its conditions by hand.`,
            );
          }
        }
        // Actions nested in "if / then / else" and "while"
        ['if', 'then', 'else'].forEach((key) => {
          if (Array.isArray(action[key])) {
            action[key].flat().forEach(migrateAction);
          }
        });
      };

      const migrateTrigger = (trigger) => {
        if (trigger.type !== EVENTS.DEVICE.NEW_STATE) {
          return;
        }
        const triggerFeatures =
          trigger.device_features && trigger.device_features.length > 0
            ? trigger.device_features
            : [trigger.device_feature];
        const matterPositions = triggerFeatures.filter((selector) => positionSelectors.has(selector));
        if (matterPositions.length === 0) {
          return;
        }
        const invertedOperator = INVERTED_OPERATORS[trigger.operator];
        // The "changed" operator has no value, nothing to invert
        if (invertedOperator === undefined) {
          return;
        }
        const invertedValue = invertPosition(trigger.value);
        if (matterPositions.length !== triggerFeatures.length || invertedValue === null) {
          logger.warn(
            `Matter shutter position migration: a trigger of scene ${scene.selector} cannot be inverted, check it by hand.`,
          );
          return;
        }
        trigger.operator = invertedOperator;
        trigger.value = invertedValue;
        sceneChanged = true;
      };

      const actions = cloneDeep(scene.actions);
      const triggers = cloneDeep(scene.triggers);
      actions.flat().forEach(migrateAction);
      (triggers || []).forEach(migrateTrigger);
      if (!sceneChanged) {
        return;
      }
      await db.Scene.update(
        {
          actions,
          triggers,
        },
        {
          where: {
            id: scene.id,
          },
        },
      );
      logger.info(`Matter shutter position migration: scene ${scene.selector} inverted.`);
    });
  },
  down: async () => {},
};
