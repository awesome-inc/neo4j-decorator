ARG NEO4J_VERSION=3.5.14
FROM neo4j:${NEO4J_VERSION}

ARG APOC_VERSION=3.5.0.6
ADD https://github.com/neo4j-contrib/neo4j-apoc-procedures/releases/download/${APOC_VERSION}/apoc-${APOC_VERSION}-all.jar /var/lib/neo4j/plugins

# graphql, cf.: https://github.com/neo4j-graphql/neo4j-graphql#manual-installation
ARG GRAPHQL_VERSION=3.5.0.4
ADD https://github.com/neo4j-graphql/neo4j-graphql/releases/download/${GRAPHQL_VERSION}/neo4j-graphql-${GRAPHQL_VERSION}.jar /var/lib/neo4j/plugins
# https://neo4j.com/docs/operations-manual/current/docker/configuration/#docker-environment-variables
ENV NEO4J_dbms_unmanaged__extension__classes "org.neo4j.graphql=/graphql"

# proxy
COPY *.sh /
ENTRYPOINT ["/docker-entrypoint2.sh"]
CMD ["neo4j"]
