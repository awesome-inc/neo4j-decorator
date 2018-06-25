var C = require('../routes/graph.js');

describe('graph', () => {
  describe('#decorateBody()', () => {
    test('should replace urls', () => {
      var json = {
        metadata: {
          id: 0
        },
        self: 'http://neo4j/node/0',
        data: {
          'name': "Michael"
        }
      };

      var config = {
        server_url: 'http://graph',
        neo4j_url: 'http://neo4j',
        decorate: {
          _all: null
        }
      }

      C._setConfig(config);
      var actual = C._decorateBody("foo", json);
      expect(actual.self).toBe("http://graph/node/0");
    });

    test('should add interpolated data', () => {
      var json = {
        metadata: {
          id: 0,
          labels: ["Person"]
        },
        data: {
          name: "Michael"
        }
      };

      var config = {
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

      C._setConfig(config);
      var actual = C._decorateBody("foo", json);
      expect(actual.fancyProperty).toBe(42);
      expect(actual.data.links[0].title).toBe("Hello, Michael");
    });

    test('should allow filters (nunjucks) and env', () => {
      var json = {
        metadata: {
          id: 0,
          labels: ["Person"]
        },
        data: {
          name: "Michael"
        }
      };

      var config = {
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
      C._setConfig(config);
      process.env.foo = "foo"
      var actual = C._decorateBody("foo", json);
      expect(actual.fancyProperty).toBe(42);
      expect(actual.data.links[0].title).toBe("Hello, Tom");
      expect(actual.data.links[1].title).toBe(`Hello, ${process.env.foo}`);
    });

    describe("special chars", () => {
      ["\\", "/", "{", "}", ",", ";", "[", "]", "ä", "\n"].forEach((value, index, array) => {
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
          C._setConfig({
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

          var actual = C._decorateBody("foo", json);
          expect(actual).toBeTruthy();
        });
      });
    });

    describe('transactional endpoint', () => {
      test('should support responses from transactional endpoint', () => {
        // item from graph array
        var json = {
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


        var config = {
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

        C._setConfig(config);
        var actualGraph = C._decorateBody("foo", json).results[0].data[0].graph;
        var actualNode = actualGraph.nodes[0];
        expect(actualNode.fancyProperty).toBe(42);
        expect(actualNode.properties.links[0].title).toBe("Hello, Michael");

        var actualEdge = actualGraph.relationships[0];
        expect(actualEdge.fancyEdgeProperty).toBe(43);
        expect(actualEdge.properties.links[0].title).toBe("Description: Describe Me");
      });
    });
  });

  describe('#deepCombine()', () => {
    test('should not stack overflow when trying to combine two strings', () => {
      var value_a = {
        "test": "string1"
      };
      var value_b = {
        "test": "string2"
      };
      C._deepCombine(value_a, value_b);

      expect(value_a.test).toBe("string2");
    });
  });
});
