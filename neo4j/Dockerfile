FROM neo4j:3.3.1

ARG APOC_VERSION=3.3.0.1
ADD https://github.com/neo4j-contrib/neo4j-apoc-procedures/releases/download/${APOC_VERSION}/apoc-${APOC_VERSION}-all.jar /var/lib/neo4j/plugins

ARG GRAPHQL_VERSION=3.3.0.0
ADD https://github.com/neo4j-graphql/neo4j-graphql/releases/download/${GRAPHQL_VERSION}/neo4j-graphql-${GRAPHQL_VERSION}.jar /var/lib/neo4j/plugins

COPY *.sh /

ENTRYPOINT ["/docker-entrypoint2.sh"]
CMD ["neo4j"]
