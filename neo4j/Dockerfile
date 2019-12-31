ARG NEO4J_VERSION=3.5.14
FROM neo4j:${NEO4J_VERSION}

# --- plugins ---
# -- apoc, cf.: https://github.com/neo4j-contrib/neo4j-apoc-procedures
#ARG APOC_VERSION=3.5.0.6
#ADD https://github.com/neo4j-contrib/neo4j-apoc-procedures/releases/download/${APOC_VERSION}/apoc-${APOC_VERSION}-all.jar /var/lib/neo4j/plugins
#ENV NEO4J_dbms_security_procedures_unrestricted "apoc.*"

# -- graphql, cf.: https://github.com/neo4j-graphql/neo4j-graphql#manual-installation
#ARG GRAPHQL_VERSION=3.5.0.4
#ADD https://github.com/neo4j-graphql/neo4j-graphql/releases/download/${GRAPHQL_VERSION}/neo4j-graphql-${GRAPHQL_VERSION}.jar /var/lib/neo4j/plugins
#ENV NEO4J_dbms_unmanaged__extension__classes "org.neo4j.graphql=/graphql"

# -- kafka streams, cf.: https://github.com/neo4j-contrib/neo4j-streams
#ARG STREAMS_VERSION=3.5.4
#ADD https://github.com/neo4j-contrib/neo4j-streams/releases/download/${STREAMS_VERSION}/neo4j-streams-${STREAMS_VERSION}.jar /var/lib/neo4j/plugins

# -- graph algorithms, cf.: https://neo4j.com/docs/graph-algorithms/current/introduction/#_installation
#ARG ALGO_VERSION=3.5.9.0
#ADD https://s3-eu-west-1.amazonaws.com/com.neo4j.graphalgorithms.dist/neo4j-graph-algorithms-${ALGO_VERSION}-standalone.jar /var/lib/neo4j/plugins
#NEO4J_dbms.security.procedures.unrestricted "algo.*"

# --- configuration ---
# disable authentication
#ENV NEO4J_AUTH none

# proxy
COPY *.sh /
ENTRYPOINT ["/docker-entrypoint2.sh"]
CMD ["neo4j"]
