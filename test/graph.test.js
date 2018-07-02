require('dotenv').config({
  path: 'test/.env'
});

const GRAPH = require('../app/routes/graph');
const CONFIG = require('../app/routes/config');

describe('graph', () => {
  describe('#decorateBody()', () => {
    test('should replace urls', () => {
      const json = {
        metadata: {
          id: 0
        },
        self: 'http://neo4j/node/0',
        data: {
          'name': "Michael"
        }
      };

      const config = {
        server_url: 'http://graph',
        neo4j_url: 'http://neo4j',
        decorate: {
          _all: null
        }
      }

      CONFIG._setConfig(config);
      const actual = GRAPH._decorateBody("foo", json);
      expect(actual.self).toBe("http://graph/node/0");
    });

    test('should add interpolated data', () => {
      const json = {
        metadata: {
          id: 0,
          labels: ["Person"]
        },
        data: {
          name: "Michael"
        }
      };

      const config = {
        server_url: 'http://graph',
        neo4j_url: 'http://neo4j',
        decorate: {
          _all: null,
          Person: {
            fancyProperty: 42,
            data: {
              links: [{
                title: "Hello, {{doc.data.name}}",
                href: 'http://some/uri'
              }]
            }
          }
        }
      }

      CONFIG._setConfig(config);
      const actual = GRAPH._decorateBody("foo", json);
      expect(actual.fancyProperty).toBe(42);
      expect(actual.data.links[0].title).toBe("Hello, Michael");
    });

    test('should allow filters (nunjucks) and env', () => {
      const json = {
        metadata: {
          id: 0,
          labels: ["Person"]
        },
        data: {
          name: "Michael"
        }
      };

      const config = {
        server_url: 'http://graph',
        neo4j_url: 'http://neo4j',
        decorate: {
          _all: null,
          Person: {
            fancyProperty: 42,
            data: {
              links: [{
                title: "Hello, {{ doc.data.name | replace(\"Michael\", \"Tom\") }}",
                href: 'http://some/uri'
              }, {
                title: "Hello, {{ env.foo }}",
                href: 'http://some/uri'
              }]
            }
          }
        }
      }
      CONFIG._setConfig(config);
      process.env.foo = "foo"
      var actual = GRAPH._decorateBody("foo", json);
      expect(actual.fancyProperty).toBe(42);
      expect(actual.data.links[0].title).toBe("Hello, Tom");
      expect(actual.data.links[1].title).toBe(`Hello, ${process.env.foo}`);
    });

    describe("special chars", () => {
      ["\\", "/", "{", "}", ",", ";", "[", "]", "ä", "\n"].forEach((value, _index, _array) => {
        test('should not fail on documents containing ' + value, () => {
          var json = {
            "columns": ["x"],
            "data": [
              [{
                "metadata": {
                  "id": 1,
                  "labels": ["LBL"]
                },
                "data": {
                  "field": "A" + value + "B"
                }
              }]
            ]
          }
          CONFIG._setConfig({
            "server_url": "http://srv",
            "neo4j_url": "http://n4j",
            "decorate": {
              "_node": {
                "data": {
                  "name": "{{doc.data.field}}"
                }
              }
            }
          });

          const actual = GRAPH._decorateBody("foo", json);
          expect(actual).toBeTruthy();
        });
      });
    });

    describe('transactional endpoint', () => {
      test('should support responses from transactional endpoint', () => {
        // item from graph array
        const json = {
          results: [{
            data: [{
              graph: {
                nodes: [{
                  "id": "42",
                  "labels": [
                    "Foo"
                  ],
                  "properties": {
                    "name": "Michael"
                  }
                }],
                relationships: [{
                  "id": "42",
                  "type": "BAR",
                  "properties": {
                    "description": "Describe Me"
                  }

                }]
              }
            }]
          }]
        };

        const config = {
          server_url: 'http://graph',
          neo4j_url: 'http://neo4j',
          decorate_transactional: {
            Foo: {
              fancyProperty: 42,
              properties: {
                links: [{
                  title: "Hello, {{doc.properties.name}}",
                  href: 'http://some/uri'
                }]
              }
            },
            BAR: {
              fancyEdgeProperty: 43,
              properties: {
                links: [{
                  title: "Description: {{doc.properties.description}}",
                  href: 'http://some/uri'
                }]
              }
            }
          }
        }

        CONFIG._setConfig(config);
        const actualGraph = GRAPH._decorateBody("foo", json).results[0].data[0].graph;
        const actualNode = actualGraph.nodes[0];
        expect(actualNode.fancyProperty).toBe(42);
        expect(actualNode.properties.links[0].title).toBe("Hello, Michael");

        const actualEdge = actualGraph.relationships[0];
        expect(actualEdge.fancyEdgeProperty).toBe(43);
        expect(actualEdge.properties.links[0].title).toBe("Description: Describe Me");
      });
    });
  });

  describe('#deepCombine()', () => {
    test('should not stack overflow when trying to combine two strings', () => {
      const value_a = {
        "test": "string1"
      };
      const value_b = {
        "test": "string2"
      };
      GRAPH._deepCombine(value_a, value_b);

      expect(value_a.test).toBe("string2");
    });
  });
});
