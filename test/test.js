var should = require('should');

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
            actual.self.should.be.exactly("http://graph/node/0");
        });

        it('should add interpolated data', function () {
            var json = {
                metadata: {
                    id: 0,
                    labels: ["Person"]
                },
                data: {
                    'name': "Michael"
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
            actual.fancyProperty.should.be.exactly(42);
            actual.data.links[0].title.should.be.exactly("Hello, Michael");
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
                    should(actual).be.ok();
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
                actualNode.fancyProperty.should.be.exactly(42);
                actualNode.properties.links[0].title.should.be.exactly("Hello, Michael");

                var actualEdge = actualGraph.relationships[0];
                actualEdge.fancyEdgeProperty.should.be.exactly(43);
                actualEdge.properties.links[0].title.should.be.exactly("Description: Describe Me");
            });
        });


    });
});