const { expect } = require('chai');

const {
  buildEndpoints,
  endpointId,
  endpointNumbers,
  truncate,
} = require('../../../../services/matter-bridge/lib/buildEndpoints');
const { uniqueIdOf } = require('../../../../services/matter-bridge/lib/config');
const { planDevice } = require('../../../../services/matter-bridge/lib/planDevice');
const { createMatter, feature, createContext } = require('../fakes');

const behaviorNames = (type) => type.behaviors.map((b) => b.behaviorName);

describe('Matter bridge buildEndpoints', () => {
  const matter = createMatter();

  it('should build stable endpoint ids and short labels', () => {
    expect(endpointId('Kitchen.Light_1')).to.equal('kitchen-light_1');
    expect(truncate('x'.repeat(40))).to.have.lengthOf(32);
    expect(truncate('Kitchen light')).to.equal('Kitchen light');
    expect(truncate(undefined)).to.equal('');
  });

  it('should cut a label at 32 bytes, not 32 characters', () => {
    // 32 characters, but 35 bytes: each accented letter takes two.
    const label = truncate('Lampe du grand salon côté fenêtr');
    expect(label).to.equal('Lampe du grand salon côté fen');
    expect(Buffer.byteLength(label)).to.be.at.most(32);
    // A label of exactly 32 bytes is kept whole.
    expect(truncate(`${'x'.repeat(30)}é`)).to.equal(`${'x'.repeat(30)}é`);
    expect(truncate(`${'x'.repeat(31)}é`)).to.equal('x'.repeat(31));
  });

  it('should never cut a character in half', () => {
    // The name of the review: the emoji was cut into an invalid character.
    const label = truncate('Lumière entrée principale maiso💡');
    expect(label).to.equal('Lumière entrée principale mais');
    expect(Buffer.byteLength(label)).to.equal(32);
    // An emoji takes four bytes: it is kept whole, or left out whole.
    expect(truncate(`${'x'.repeat(28)}💡`)).to.equal(`${'x'.repeat(28)}💡`);
    expect(truncate(`${'x'.repeat(30)}💡`)).to.equal('x'.repeat(30));
    // An emoji made of several code points is one character.
    expect(truncate(`${'x'.repeat(7)}👨‍👩‍👧`)).to.equal(`${'x'.repeat(7)}👨‍👩‍👧`);
    expect(truncate(`${'x'.repeat(28)}👨‍👩‍👧`)).to.equal('x'.repeat(28));
    // So is a letter followed by a combining accent.
    expect(truncate(`${'x'.repeat(29)}e\u0301`)).to.equal(`${'x'.repeat(29)}e\u0301`);
    expect(truncate(`${'x'.repeat(30)}e\u0301`)).to.equal('x'.repeat(30));
  });

  it('should not end a cut label with a space', () => {
    expect(truncate(`${'x'.repeat(31)} and more`)).to.equal('x'.repeat(31));
  });

  it('should build a single function device as a single bridged endpoint', () => {
    const device = {
      id: 'id-1',
      name: 'Thermometer',
      model: 'TH01',
      selector: 'thermometer',
      features: [feature('t', 'temperature-sensor', 'decimal'), feature('b', 'battery', 'integer')],
    };
    const built = buildEndpoints(matter, device, planDevice(device), createContext({ t: 20, b: 50 }));
    expect(built.root.id).to.equal('thermometer');
    // The root is the function itself, made a bridged node.
    expect(built.root.type.name).to.equal('TemperatureSensorDevice');
    expect(behaviorNames(built.root.type)).to.deep.equal(['BridgedDeviceBasicInformationServer', 'PowerSourceServer']);
    expect(built.root.state.temperatureMeasurement.measuredValue).to.equal(2000);
    expect(built.root.state.powerSource.batPercentRemaining).to.equal(100);
    expect(built.root.state.bridgedDeviceBasicInformation).to.deep.equal({
      nodeLabel: 'Thermometer',
      productName: 'TH01',
      vendorName: 'Gladys',
      uniqueId: uniqueIdOf('id-1'),
      reachable: true,
    });
    expect(built.children).to.deep.equal([]);
    expect(built.functions[0].endpoint).to.equal(built.root);
    expect(built.battery.endpoints).to.deep.equal([built.root]);
  });

  it('should give two devices whose ids only differ at the end different unique ids', () => {
    const uniqueIdOfDevice = (id) => {
      const device = { id, name: 'Plug', selector: `plug-${id}`, features: [feature(id, 'switch', 'binary')] };
      return buildEndpoints(matter, device, planDevice(device), createContext({})).root.state
        .bridgedDeviceBasicInformation.uniqueId;
    };
    const first = uniqueIdOfDevice('0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b0001');
    const second = uniqueIdOfDevice('0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b0002');
    expect(first).to.have.lengthOf(32);
    expect(second).to.have.lengthOf(32);
    expect(first).to.not.equal(second);
  });

  it('should reuse the endpoint numbers of a rebuilt device', () => {
    const device = {
      id: 'id',
      name: 'Strip',
      selector: 'strip',
      features: [feature('p1', 'switch', 'binary'), feature('p2', 'switch', 'binary')],
    };
    const first = buildEndpoints(matter, device, planDevice(device), createContext({}));
    expect(endpointNumbers(first)).to.deep.equal({
      strip: first.root.number,
      'strip-plug-2': first.children[0].number,
    });
    const built = buildEndpoints(matter, device, planDevice(device), createContext({}), {
      strip: 42,
      'strip-plug-2': 43,
    });
    expect(built.root.number).to.equal(42);
    expect(built.children[0].number).to.equal(43);
    expect(built.root.state.bridgedDeviceBasicInformation.productName).to.equal('Gladys');
    expect(built.battery).to.equal(null);
  });

  it('should keep the endpoint of the main function when the device gains another one', () => {
    const plug = feature('p', 'switch', 'binary');
    const device = { id: 'id', name: 'Plug', selector: 'plug', features: [plug] };
    const before = buildEndpoints(matter, device, planDevice(device), createContext({}));
    const grown = { ...device, features: [plug, feature('t', 'temperature-sensor', 'decimal')] };
    const after = buildEndpoints(matter, grown, planDevice(grown), createContext({}), endpointNumbers(before));
    expect(after.root.number).to.equal(before.root.number);
    expect(after.root.type.name).to.equal('OnOffPlugInUnitDevice');
    expect(after.children.map((c) => c.id)).to.deep.equal(['plug-temperature-1']);
  });

  it('should build a multi function device as its main function with the others as children', () => {
    const device = {
      id: 'id-2',
      name: 'Shutter',
      selector: 'shutter',
      features: [
        feature('lux', 'light-sensor', 'decimal'),
        feature('position', 'shutter', 'position'),
        feature('b', 'battery', 'integer'),
      ],
    };
    const built = buildEndpoints(matter, device, planDevice(device), createContext({}));
    // An actuator comes before a sensor: the shutter is the device, not its light sensor.
    expect(built.root.type.name).to.equal('WindowCoveringDevice');
    expect(behaviorNames(built.root.type)).to.deep.equal([
      'WindowCoveringServer',
      'BridgedDeviceBasicInformationServer',
      'PowerSourceServer',
    ]);
    expect(built.children.map((c) => c.id)).to.deep.equal(['shutter-illuminance-1']);
    expect(built.children[0].type.behaviors).to.deep.equal([]);
    expect(built.children[0].state).to.not.have.property('bridgedDeviceBasicInformation');
    expect(built.functions.map(({ endpoint }) => endpoint)).to.deep.equal([built.root, built.children[0]]);
    expect(built.battery.endpoints).to.deep.equal([built.root]);
  });

  it('should number children among the functions of their own kind, the main one first', () => {
    const device = {
      id: 'id-3',
      name: 'Multi',
      selector: 'multi',
      features: [
        feature('t1', 'temperature-sensor', 'decimal'),
        feature('h', 'humidity-sensor', 'decimal'),
        feature('t2', 'temperature-sensor', 'decimal'),
      ],
    };
    const built = buildEndpoints(matter, device, planDevice(device), createContext({}));
    expect(built.root.id).to.equal('multi');
    expect(built.children.map((c) => c.id)).to.deep.equal(['multi-temperature-2', 'multi-humidity-1']);
  });

  it('should give a mains power source to a smoke alarm without battery', () => {
    const device = { id: 'id', name: 'Smoke', selector: 'smoke', features: [feature('s', 'smoke-sensor', 'binary')] };
    const built = buildEndpoints(matter, device, planDevice(device), createContext({}));
    expect(behaviorNames(built.root.type)).to.deep.equal([
      'SmokeCoAlarmServer',
      'BridgedDeviceBasicInformationServer',
      'PowerSourceServer',
    ]);
    expect(built.root.state.powerSource.description).to.equal('Mains');
    expect(built.children).to.deep.equal([]);
  });

  it('should put the battery of a single smoke alarm on its endpoint', () => {
    const device = {
      id: 'id',
      name: 'Smoke',
      selector: 'smoke',
      features: [feature('s', 'smoke-sensor', 'binary'), feature('b', 'battery', 'integer')],
    };
    const built = buildEndpoints(matter, device, planDevice(device), createContext({ b: 80 }));
    expect(built.root.state.powerSource.description).to.equal('Battery');
    expect(built.battery.endpoints).to.deep.equal([built.root]);
  });

  it('should keep the battery of a multi function device on its smoke alarm', () => {
    const device = {
      id: 'id',
      name: 'Smoke',
      selector: 'smoke',
      features: [
        feature('l', 'light', 'binary'),
        feature('s', 'smoke-sensor', 'binary'),
        feature('b', 'battery', 'integer'),
      ],
    };
    const built = buildEndpoints(matter, device, planDevice(device), createContext({}));
    // The light is the main function, the smoke alarm carries the battery it needs.
    expect(behaviorNames(built.root.type)).to.deep.equal(['BridgedDeviceBasicInformationServer']);
    expect(built.root.state).to.not.have.property('powerSource');
    const [alarm] = built.children;
    expect(alarm.state.powerSource.description).to.equal('Battery');
    expect(built.battery.endpoints).to.deep.equal([alarm]);
  });

  it('should put the battery on every smoke alarm of a battery powered device', () => {
    const device = {
      id: 'id',
      name: 'Smoke',
      selector: 'smoke',
      features: [
        feature('s1', 'smoke-sensor', 'binary'),
        feature('s2', 'smoke-sensor', 'binary'),
        feature('b', 'battery', 'integer'),
      ],
    };
    const built = buildEndpoints(matter, device, planDevice(device), createContext({ b: 80 }));
    const [second] = built.children;
    expect(built.root.state.powerSource.description).to.equal('Battery');
    expect(second.state.powerSource.description).to.equal('Battery');
    expect(built.battery.endpoints).to.deep.equal([built.root, second]);
  });

  it('should give mains power to the smoke alarms of a multi function device without battery', () => {
    const device = {
      id: 'id',
      name: 'Smoke',
      selector: 'smoke',
      features: [feature('s', 'smoke-sensor', 'binary'), feature('t', 'temperature-sensor', 'decimal')],
    };
    const built = buildEndpoints(matter, device, planDevice(device), createContext({}));
    expect(built.root.state.powerSource.description).to.equal('Mains');
    expect(built.children[0].state).to.not.have.property('powerSource');
    expect(built.battery).to.equal(null);
  });
});
