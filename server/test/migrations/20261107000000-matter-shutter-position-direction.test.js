const { expect } = require('chai');

const db = require('../../models');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, ACTIONS, EVENTS } = require('../../utils/constants');

const migration = require('../../migrations/20261107000000-matter-shutter-position-direction');

const MATTER_SERVICE_ID = '3f8a2c1e-6b4d-4e9a-a7c5-1d2e3f4a5b6c';
const SHUTTER_DEVICE_ID = '8b1c2d3e-4f5a-4b6c-9d7e-0f1a2b3c4d5e';
const UNKNOWN_SHUTTER_DEVICE_ID = '2a3b4c5d-6e7f-4a8b-9c0d-1e2f3a4b5c6d';

const SHUTTER_POSITION = 'matter-shutter-position';
const UNKNOWN_SHUTTER_POSITION = 'matter-unknown-shutter-position';
const SHUTTER_STATE = 'matter-shutter-state';
// Device feature of the seed, not a Matter shutter
const OTHER_FEATURE = 'test-device-feature';

const createFeature = (deviceId, selector, externalId, category, type, lastValue) =>
  db.DeviceFeature.create({
    device_id: deviceId,
    name: selector,
    selector,
    external_id: externalId,
    category,
    type,
    read_only: false,
    has_feedback: true,
    min: 0,
    max: 100,
    last_value: lastValue,
  });

const createMatterShutters = async () => {
  await db.Service.create({
    id: MATTER_SERVICE_ID,
    name: 'matter',
    selector: 'matter',
    version: '0.1.0',
    has_message_feature: false,
  });
  await db.Device.create({
    id: SHUTTER_DEVICE_ID,
    name: 'Somfy (Volet) 1',
    selector: 'matter-333-1',
    external_id: 'matter:333:1',
    service_id: MATTER_SERVICE_ID,
  });
  await createFeature(
    SHUTTER_DEVICE_ID,
    SHUTTER_POSITION,
    'matter:333:1:258:position',
    DEVICE_FEATURE_CATEGORIES.SHUTTER,
    DEVICE_FEATURE_TYPES.SHUTTER.POSITION,
    30,
  );
  await createFeature(
    SHUTTER_DEVICE_ID,
    SHUTTER_STATE,
    'matter:333:1:258:state',
    DEVICE_FEATURE_CATEGORIES.SHUTTER,
    DEVICE_FEATURE_TYPES.SHUTTER.STATE,
    1,
  );
  await db.Device.create({
    id: UNKNOWN_SHUTTER_DEVICE_ID,
    name: 'Somfy (Volet) 2',
    selector: 'matter-444-1',
    external_id: 'matter:444:1',
    service_id: MATTER_SERVICE_ID,
  });
  await createFeature(
    UNKNOWN_SHUTTER_DEVICE_ID,
    UNKNOWN_SHUTTER_POSITION,
    'matter:444:1:258:position',
    DEVICE_FEATURE_CATEGORIES.SHUTTER,
    DEVICE_FEATURE_TYPES.SHUTTER.POSITION,
    null,
  );
};

const createScene = (selector, actions, triggers) =>
  db.Scene.create({
    name: selector,
    selector,
    icon: 'bell',
    active: true,
    actions,
    triggers,
  });

const getFeature = (selector) => db.DeviceFeature.findOne({ where: { selector } });
const getScene = (selector) => db.Scene.findOne({ where: { selector } });

describe('migration 20261107000000-matter-shutter-position-direction', () => {
  it('should do nothing when the matter service is not installed', async () => {
    await migration.up();
  });

  it('should do nothing when no Matter shutter is paired', async () => {
    await db.Service.create({
      id: MATTER_SERVICE_ID,
      name: 'matter',
      selector: 'matter',
      version: '0.1.0',
      has_message_feature: false,
    });
    await createScene('scene-other-device', [
      [{ type: ACTIONS.DEVICE.SET_VALUE, device_feature: OTHER_FEATURE, value: 80 }],
    ]);
    await migration.up();
    const scene = await getScene('scene-other-device');
    expect(scene.actions[0][0].value).to.equal(80);
  });

  it('should invert the last value of the Matter shutter positions only', async () => {
    await createMatterShutters();
    await migration.up();
    expect((await getFeature(SHUTTER_POSITION)).last_value).to.equal(70);
    expect((await getFeature(UNKNOWN_SHUTTER_POSITION)).last_value).to.equal(null);
    const state = await getFeature(SHUTTER_STATE);
    expect(state.last_value).to.equal(1);
    expect(state.min).to.equal(-1);
    expect(state.max).to.equal(1);
  });

  it('should invert the set value actions on a Matter shutter position, nested ones included', async () => {
    await createMatterShutters();
    await createScene('scene-set-shutter', [
      [
        { type: ACTIONS.DEVICE.SET_VALUE, device_feature: SHUTTER_POSITION, value: 80 },
        { type: ACTIONS.DEVICE.SET_VALUE, device_feature: SHUTTER_POSITION, value: '25' },
        { type: ACTIONS.DEVICE.SET_VALUE, device_feature: OTHER_FEATURE, value: 80 },
      ],
      [
        {
          type: ACTIONS.CONDITION.IF_THEN_ELSE,
          if: [{ type: ACTIONS.USER.CHECK_PRESENCE, user: 'john', minutes: 10 }],
          then: [[{ type: ACTIONS.DEVICE.SET_VALUE, device_feature: SHUTTER_POSITION, value: 0 }]],
          else: [[{ type: ACTIONS.DEVICE.SET_VALUE, device_feature: SHUTTER_POSITION, value: 100 }]],
        },
      ],
    ]);
    await migration.up();
    const { actions } = await getScene('scene-set-shutter');
    expect(actions[0][0].value).to.equal(20);
    expect(actions[0][1].value).to.equal('75');
    expect(actions[0][2].value).to.equal(80);
    expect(actions[1][0].then[0][0].value).to.equal(100);
    expect(actions[1][0].else[0][0].value).to.equal(0);
  });

  it('should leave a formula, a text value and a get value untouched', async () => {
    await createMatterShutters();
    const actions = [
      [
        {
          type: ACTIONS.DEVICE.SET_VALUE,
          device_feature: SHUTTER_POSITION,
          value: 0,
          evaluate_value: '{{0.0.last_value}} + 10',
        },
        { type: ACTIONS.DEVICE.SET_VALUE, device_feature: SHUTTER_POSITION, value: 'half' },
        { type: ACTIONS.DEVICE.GET_VALUE, device_feature: SHUTTER_POSITION },
      ],
    ];
    await createScene('scene-formula', actions);
    await migration.up();
    expect((await getScene('scene-formula')).actions).to.deep.equal(actions);
  });

  it('should invert the value and the operator of the device triggers on a Matter shutter position', async () => {
    await createMatterShutters();
    await createScene(
      'scene-triggers',
      [[{ type: ACTIONS.DEVICE.SET_VALUE, device_feature: OTHER_FEATURE, value: 1 }]],
      [
        { type: EVENTS.DEVICE.NEW_STATE, device_feature: SHUTTER_POSITION, operator: '>', value: 70 },
        {
          type: EVENTS.DEVICE.NEW_STATE,
          device_features: [SHUTTER_POSITION, UNKNOWN_SHUTTER_POSITION],
          operator: '<=',
          value: 10,
        },
        { type: EVENTS.DEVICE.NEW_STATE, device_feature: SHUTTER_POSITION, operator: '=', value: 0 },
      ],
    );
    await migration.up();
    const { triggers } = await getScene('scene-triggers');
    expect(triggers[0]).to.include({ operator: '<', value: 30 });
    expect(triggers[1]).to.include({ operator: '>=', value: 90 });
    expect(triggers[2]).to.include({ operator: '=', value: 100 });
  });

  it('should leave the triggers it cannot invert untouched', async () => {
    await createMatterShutters();
    const triggers = [
      { type: EVENTS.TIME.CHANGED, scheduler_type: 'every-day', time: '08:00' },
      { type: EVENTS.DEVICE.NEW_STATE, device_feature: OTHER_FEATURE, operator: '>', value: 70 },
      { type: EVENTS.DEVICE.NEW_STATE, device_feature: SHUTTER_POSITION, operator: 'changed' },
      { type: EVENTS.DEVICE.NEW_STATE, device_features: [SHUTTER_POSITION, OTHER_FEATURE], operator: '>', value: 50 },
      { type: EVENTS.DEVICE.NEW_STATE, device_feature: SHUTTER_POSITION, operator: '>', value: 'abc' },
    ];
    await createScene(
      'scene-untouched-triggers',
      [[{ type: ACTIONS.DEVICE.GET_VALUE, device_feature: OTHER_FEATURE }]],
      triggers,
    );
    await migration.up();
    expect((await getScene('scene-untouched-triggers')).triggers).to.deep.equal(triggers);
  });

  it('should have an empty down migration', async () => {
    await migration.down();
  });
});
