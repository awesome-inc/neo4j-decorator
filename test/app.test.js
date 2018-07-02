require('dotenv').config({
  path: 'test/.env'
});

const request = require('supertest');
const app = require('../app');

describe('app', () => {
  test('config', () => {
    return request(app).get('/config').expect(200);
  });

  test('docs', () => {
    return request(app).get('/docs/templates').expect(200);
  });

  test.skip('graph', () => {
    // TODO: integration test, failing since neo4j is not running
    return request(app).get('/graph/node/0').expect(200);
  });
});
