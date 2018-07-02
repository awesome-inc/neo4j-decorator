require('dotenv').config({
  path: 'test/.env'
});

const docs = require('../app/routes/docs');

describe('docs', () => {
  test('loads drop_in templates', () => {
    const templates = docs._loadDoc('templates');
    expect(templates.length).toBe(2);
  });
});
