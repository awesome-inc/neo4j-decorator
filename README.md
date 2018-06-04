# neo4j-decorator

[![Build status](https://travis-ci.org/awesome-inc/neo4j-decorator.svg?branch=master)](https://travis-ci.org/awesome-inc/neo4j-decorator/)
[![GitHub issues](https://img.shields.io/github/issues/awesome-inc/neo4j-decorator.svg "GitHub issues")](https://github.com/awesome-inc/neo4j-decorator)
[![GitHub stars](https://img.shields.io/github/stars/awesome-inc/neo4j-decorator.svg "GitHub stars")](https://github.com/awesome-inc/neo4j-decorator)

A decorator for the Neo4j REST Api.

[![dockeri.co](http://dockeri.co/image/awesomeinc/neo4j-decorator)](https://hub.docker.com/r/awesomeinc/neo4j-decorator/)

## Using the docker image

```bash
docker run awesomeinc/neo4j-decorator
```

Adjust your `config.yml` and mount it into the container, e.g. in your `docker-compose.yml`

```yml
    volumes:
       - "./decorator/config.yml:/usr/src/app/routes/config.yml"
```

## Configuration

The motivation is to decorate some new links (or actions) into nodes & edges (HATEOAS Style).
The default `config.yml` looks something like this

```yml
server_url: 'http://localhost:3000/graph'
neo4j_url: 'http://localhost:7474/db/data'
decorate:
  _all:
  _node:
    data:
      links:
        - title: Expand...
          href: '{{config.server_url}}/cypher'
          method: 'POST'
          body:
            query: 'MATCH (u)-[e]-(v) WHERE ID(u)={{doc.metadata.id}} RETURN u,e,v'
  _edge:
    data:
      links:
        - title: Expand...
          href: '{{config.server_url}}/cypher'
          method: 'POST'
          body:
            query: 'MATCH (u)-[e]-(v) WHERE ID(e)={{doc.metadata.id}} RETURN u,e,v'
  SomeNodeLabel:
    ...
  SOME_EDGE_TYPE:
    ...
decorate_transactional:
```

This decorates a default action *Expand...* to all nodes and edges.

### Templating

Templating is based on [Nunjucks](https://mozilla.github.io/nunjucks/) so can use any [Builtin Filters](https://mozilla.github.io/nunjucks/templating.html#builtin-filters).

The template context is

```json
  var context = {
    config: config,
    doc: doc,
    env: process.env
  };
```

where

- `config` is the `config.yml`. You may put any variables/constants here just like `server_url` or `neo4j_url`
- `doc` is the current document (node or edge)
- `env` is the process environment (on the server).

#### Special Case
All top-level keys from the `config.yml` that end in `_url` can also be interpolated.

## Docs

It is possible to store and retrieve custom documents, e.g. in order to store custom configurations, templates for Cypher queries, etc. Documents can be retrieved via `GET` from `<decorator-url>/docs/:doc` with **:doc** being the filename. The same URL can be used in conjunction with `PUT` to store documents.

## Examples

### Cypher

An example request to the decorator

```json
POST http://localhost:3000/graph/cypher
{
  "query": "MATCH (u)-[e]->(v) RETURN u, e, v LIMIT 25"
}
```

### APOC & Transaction Endpoint

Here is an example config-snippet for the transactional endpoint that works for the APOC beginners example [Calling Procedures within Cypher](https://neo4j-contrib.github.io/neo4j-apoc-procedures/#_calling_procedures_within_cypher):

```yml
    decorate_transactional:
      Person:
        properties:
          links:
            - title: "Google '{{doc.properties.name}}'"
              href: 'https://www.google.de/search?q={{doc.properties.name}}'
```

Here's the example request:

```json
POST http://localhost:3000/graph/transaction/commit
{
  "statements" : [
    {
      "statement" : "WITH 'https://raw.githubusercontent.com/neo4j-contrib/neo4j-apoc-procedures/3.2/src/test/resources/person.json' AS url\nCALL apoc.load.json(url) YIELD value as person\nMERGE (p:Person {name:person.name})\nON CREATE SET p.age = person.age, p.children = size(person.children)\nRETURN p",
        "resultDataContents" : ["row", "graph"]
    }
  ]
}
```
