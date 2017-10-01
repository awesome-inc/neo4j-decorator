# neo4j-decorator

A decorator for the Neo4j REST Api.

[![dockeri.co](http://dockeri.co/image/awesomeinc/neo4j-decorator)](https://registry.hub.docker.com/awesomeinc/neo4j-decorator/)

[![Build status](https://travis-ci.org/awesome-inc/neo4j-decorator.svg?branch=master)](https://travis-ci.org/awesome-inc/neo4j-decorator/)
[![GitHub issues](https://img.shields.io/github/issues/awesome-inc/neo4j-decorator.svg "GitHub issues")](https://github.com/awesome-inc/neo4j-decorator)
[![GitHub stars](https://img.shields.io/github/stars/awesome-inc/neo4j-decorator "GitHub stars")](https://github.com/awesome-inc/neo4j-decorator)

## Using the docker image

```bash
docker run awesomeinc/neo4j-decorator
```

TODO: Link to neo4j container, mount your config

## Using the source code

The most common use case is to add the decorator as a container to your docker project.

First, add as submodule

```bash
mkdir decorator
cd decorator
git submodule add https://github.com/awesome-inc/neo4j-decorator build
```

Then, add the container

```yml
  neo4j:
      ...
  decorator:
    build:
      context: decorator/build
      args:
        http_proxy: ${http_proxy}
        no_proxy: ${no_proxy}
    ports:
        - "3000:3000"
    links:
        - neo4j
```

Finally, tune your configuration, place it in `conf\config.yml` and mount it into the container

```yml
    volumes:
      - "./decorator/conf/config.yml://usr/src/app/routes/config.yml"
```

### Examples

#### APOC & Transaction Endpoint

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
POST http://localhost:3000/api/ai/graph/transaction/commit
{
    "statements" : [
    {
      "statement" : "WITH 'https://raw.githubusercontent.com/neo4j-contrib/neo4j-apoc-procedures/master/src/test/resources/person.json' AS url\nCALL apoc.load.json(url) YIELD value as person\nMERGE (p:Person {name:person.name})\nON CREATE SET p.age = person.age, p.children = size(person.children)\nRETURN p",
        "resultDataContents" : ["row", "graph"]
      }
    ]
  }
}
```
