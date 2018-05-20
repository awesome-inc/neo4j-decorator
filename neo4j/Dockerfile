
ARG NEO4J_VERSION=3.4.0
FROM neo4j:${NEO4J_VERSION}

ARG APOC_VERSION=3.4.0.1
ADD https://github.com/neo4j-contrib/neo4j-apoc-procedures/releases/download/${APOC_VERSION}/apoc-${APOC_VERSION}-all.jar /var/lib/neo4j/plugins

ARG GRAPHQL_VERSION=3.4.0.0
ADD https://github.com/neo4j-graphql/neo4j-graphql/releases/download/${GRAPHQL_VERSION}/neo4j-graphql-${GRAPHQL_VERSION}.jar /var/lib/neo4j/plugins

COPY *.sh /

COPY conf/neo4j.conf /var/lib/neo4j/conf/

ENTRYPOINT ["/docker-entrypoint2.sh"]
CMD ["neo4j"]
