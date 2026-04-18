const GLADYS_VARIABLES = {
  CLIENT_ID: 'VIESSMANN_CLIENT_ID',
  ACCESS_TOKEN: 'VIESSMANN_ACCESS_TOKEN',
  REFRESH_TOKEN: 'VIESSMANN_REFRESH_TOKEN',
  EXPIRE_IN_TOKEN: 'VIESSMANN_EXPIRE_IN_TOKEN',
};

const STATUS = {
  NOT_INITIALIZED: 'not_initialized',
  CONNECTING: 'connecting',
  DISCONNECTING: 'disconnecting',
  PROCESSING_TOKEN: 'processing token',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: {
    CONNECTING: 'error connecting',
    PROCESSING_TOKEN: 'error processing token',
    DISCONNECTING: 'error disconnecting',
    CONNECTED: 'error connected',
    SET_DEVICES_VALUES: 'error set devices values',
    GET_DEVICES_VALUES: 'error get devices values',
  },
  GET_DEVICES_VALUES: 'get devices values',
  DISCOVERING_DEVICES: 'discovering',
};

const BASE_IAM = 'https://iam.viessmann.com/idp/v3';
const BASE_API = 'https://api.viessmann.com';
const API = {
  AUTHORIZE: `${BASE_IAM}/authorize`,
  TOKEN: `${BASE_IAM}/token`,
  GATEWAYS: `${BASE_API}/iot/v1/equipment/gateways`,
  INSTALLATIONS: `${BASE_API}/iot/v1/equipment/installations`,
  FEATURES_BASE: `${BASE_API}/iot/v1/equipment/installations`,
};

const REDIRECT_URI = 'http://localhost:1443/viessmann/callback';

const VIESSMANN_SCOPES = 'IoT User offline_access';

const FEATURES = {
  // Temperature sensors
  OUTSIDE_TEMPERATURE: 'heating.sensors.temperature.outside',
  BOILER_TEMPERATURE: 'heating.boiler.sensors.temperature.main',
  COMMON_SUPPLY_TEMPERATURE: 'heating.boiler.sensors.temperature.commonSupply',
  DHW_OUTLET_TEMPERATURE: 'heating.dhw.sensors.temperature.outlet',
  DHW_STORAGE_TEMPERATURE: 'heating.dhw.sensors.temperature.hotWaterStorage',
  DHW_TEMPERATURE: 'heating.dhw.temperature.main',
  RETURN_TEMPERATURE: 'heating.sensors.temperature.return',
  // Circuit temperature sensors (circuit 0)
  CIRCUIT_ROOM_TEMPERATURE: 'heating.circuits.{circuitId}.sensors.temperature.room',
  CIRCUIT_SUPPLY_TEMPERATURE: 'heating.circuits.{circuitId}.sensors.temperature.supply',
  // Burner
  BURNER_ACTIVE: 'heating.burners.0.active',
  BURNER_MODULATION: 'heating.burners.0.modulation',
  BURNER_STATISTICS: 'heating.burners.0.statistics',
  // DHW
  DHW_CHARGING: 'heating.dhw.charging',
  DHW_ONE_TIME_CHARGE: 'heating.dhw.oneTimeCharge',
  DHW_PUMPS_PRIMARY: 'heating.dhw.pumps.primary',
  DHW_PUMPS_CIRCULATION: 'heating.dhw.pumps.circulation',
  // Operating modes
  CIRCUIT_ACTIVE_MODE: 'heating.circuits.{circuitId}.operating.modes.active',
  CIRCUIT_ACTIVE_PROGRAM: 'heating.circuits.{circuitId}.operating.programs.active',
  // Programs
  CIRCUIT_PROGRAM_COMFORT: 'heating.circuits.{circuitId}.operating.programs.comfort',
  CIRCUIT_PROGRAM_ECO: 'heating.circuits.{circuitId}.operating.programs.eco',
  CIRCUIT_PROGRAM_NORMAL: 'heating.circuits.{circuitId}.operating.programs.normal',
  CIRCUIT_PROGRAM_REDUCED: 'heating.circuits.{circuitId}.operating.programs.reduced',
  // Circulation pump
  CIRCUIT_CIRCULATION_PUMP: 'heating.circuits.{circuitId}.circulation.pump',
  // Frost protection
  CIRCUIT_FROST_PROTECTION: 'heating.circuits.{circuitId}.frostprotection',
};

const PARAMS = {
  INSTALLATION_ID: 'installation_id',
  GATEWAY_SERIAL: 'gateway_serial',
  DEVICE_ID: 'device_id',
  CIRCUIT_ID: 'circuit_id',
};

module.exports = {
  GLADYS_VARIABLES,
  STATUS,
  API,
  REDIRECT_URI,
  VIESSMANN_SCOPES,
  FEATURES,
  PARAMS,
};
