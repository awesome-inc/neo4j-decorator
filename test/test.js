var should = require('should');

var C = require('../routes/graph.js');

describe('graph', function() {
  describe('#decorateBody()', function() {
    it('should replace urls', function() {
        var json = 
        {
            metadata: { id: 0 },
            self: 'http://neo4j/node/0',
            data: { 'name': "Michael" }
        }; 

        var config = {
            server_url: 'http://graph',
            neo4j_url: 'http://neo4j',
            decorate: { _all: null }
        }

        C._setConfig(config);
        var actual = C._decorateBody("foo", json);
        actual.self.should.be.exactly("http://graph/node/0");
    });

    it('should add interpolated data', function() {
        var json = 
        {
            metadata: { id: 0, labels: ["Person"]},
            data: { 'name': "Michael" }
        }; 

        var config = {
            server_url: 'http://graph',
            neo4j_url: 'http://neo4j',
            decorate: {
              _all: null,
              Person: {
                  fancyProperty: 42,
                  data: {
                      links: [
                          {
                              title: "Hello, {{doc.data.name}}",
                              href: 'http://some/uri'
                          }
                      ]
                  }
              }
            }
        }

        C._setConfig(config);
        var actual = C._decorateBody("foo", json);
        actual.fancyProperty.should.be.exactly(42);
        actual.data.links[0].title.should.be.exactly("Hello, Michael");
    });
    
  });
});