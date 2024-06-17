# Variables
DOCKER_COMPOSE = docker-compose -f docker-compose.yml -f docker-compose.dev.yml

# Default target
.PHONY: all
all: up

# Pull the latest code from the repository
.PHONY: pull
pull:
	@git pull

# Stop and remove all containers related to this project
.PHONY: down
down:
	@$(DOCKER_COMPOSE) down

# Build the Docker images
.PHONY: build
build:
	@$(DOCKER_COMPOSE) build

# Start the services in detached mode
.PHONY: up
up: build
	@$(DOCKER_COMPOSE) up -d

# Stop and remove all containers, networks, and volumes
.PHONY: clean
clean:
	@$(DOCKER_COMPOSE) down -v
	@docker system prune -af --volumes

# View logs
.PHONY: logs
logs:
	@$(DOCKER_COMPOSE) logs -f

# Run tests
.PHONY: test
test:
	@$(DOCKER_COMPOSE) run --rm api npm test

# Access the API container shell
.PHONY: shell
shell:
	@$(DOCKER_COMPOSE) exec api /bin/sh
