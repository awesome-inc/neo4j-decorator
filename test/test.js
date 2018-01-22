var should = require('chai').should();

var C = require('../routes/graph.js');

describe('graph', function () {
  describe('#decorateBody()', function () {
    it('should replace urls', function () {
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
      actual.self.should.equal("http://graph/node/0");
    });

    it('should add interpolated data', function () {
      var json = {
        metadata: { id: 0, labels: ["Person"] },
        data: { name: "Michael" }
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
      actual.fancyProperty.should.equal(42);
      actual.data.links[0].title.should.equal("Hello, Michael");
    });

    it('should allow filters (nunjucks) and env', function () {
      var json = {
        metadata: { id: 0, labels: ["Person"] },
        data: { name: "Michael" }
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
      actual.fancyProperty.should.equal(42);
      actual.data.links[0].title.should.equal("Hello, Tom");
      actual.data.links[1].title.should.equal(`Hello, ${process.env.foo}`);
    });

    describe("special chars", function () {
      ["\\", "/", "{", "}", ",", ";", "[", "]", "ä", "\n"].forEach(function (value, index, array) {
        it('should not fail on documents containing ' + value, function () {
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
          actual.should.be.ok;
        });
      });
    });

    describe('transactional endpoint', function () {
      it('should support responses from transactional endpoint', function () {
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
        actualNode.fancyProperty.should.equal(42);
        actualNode.properties.links[0].title.should.equal("Hello, Michael");

        var actualEdge = actualGraph.relationships[0];
        actualEdge.fancyEdgeProperty.should.equal(43);
        actualEdge.properties.links[0].title.should.equal("Description: Describe Me");
      });
    });
  });

  describe('#deepCombine()', function () {
    it('should not stack overflow when trying to combine two strings', function () {
      var value_a = {
        "test": "string1"
      };
      var value_b = {
        "test": "string2"
      };
      C._deepCombine(value_a, value_b);

      value_a.test.should.equal("string2");
    });
  });
});
