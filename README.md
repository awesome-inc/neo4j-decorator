# neo4j-decorator

A decorator for the Neo4j REST Api

## Usage

The most common use case is to add the decorator as a container to your docker project.

First, add as submodule

    mkdir decorator
    cd decorator
    git submodule add https://github.com/awesome-inc/neo4j-decorator build

Then, add the container

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

Finally, tune your configuration, place it in `conf\config.yml` and mount it into the container

		volumes:
		   - "./decorator/conf/config.yml://usr/src/app/routes/config.yml"
