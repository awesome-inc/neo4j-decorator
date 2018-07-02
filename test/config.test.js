require('dotenv').config({
  path: 'test/.env'
});

const CONFIG = require('../app/routes/config');

describe('config', () => {
  test('load', () => {
    const conf = CONFIG._loadConfig();
    // Assert data of top-level config is still present
    expect(conf.decorate._node).toBeDefined();
    expect(conf.decorate._edge).toBeDefined();
    // Assert data of configs from './conf.d' is deep-merged into config
    const person = conf.decorate.Person;
    expect(person).toBeDefined();
    expect(person.data.links.length).toBe(2);
  });
});
