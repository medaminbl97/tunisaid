SHELL := /bin/bash

# Personal settings (SSH_TARGET, SSH_OPTS, DOCKER_CMD); gitignored.
-include local.mk
.DEFAULT_GOAL := help

SECRETS_DIR := .secrets
TFVARS      := terraform.tfvars

# The Dokploy server, for running the bao CLI inside the OpenBao container.
SERVER_IP := $(shell sed -n 's/^server_ip[[:space:]]*=[[:space:]]*"\([^"]*\)".*/\1/p' $(TFVARS) 2>/dev/null)
export SSH_TARGET ?= root@$(SERVER_IP)
# Extra ssh options, for example: make up SSH_OPTS="-i ~/.ssh/server_key"
export SSH_OPTS ?=
# Docker on the server, for example: make up DOCKER_CMD="sudo -n docker"
export DOCKER_CMD ?= docker

# Extra flags for terraform apply, for example: make deploy TF_ARGS=-auto-approve
TF_ARGS ?=
BOOTSTRAP_TARGETS := -target=dokploy_project.main -target=dokploy_application.openbao \
	-target=dokploy_mount.openbao_data -target=random_password.database

.PHONY: help ssh-check init bootstrap vault-init unseal secrets deploy migrate up plan credentials fmt validate

help: ## Show this help
	@awk 'BEGIN {FS = ":.*## "} /^[a-z-]+:.*## / {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

ssh-check: ## Check that SSH_TARGET accepts a key login
	@ssh -o BatchMode=yes $(SSH_OPTS) $(SSH_TARGET) '$(DOCKER_CMD) ps -q >/dev/null' \
		&& echo "SSH to $(SSH_TARGET) works and docker is usable." \
		|| { echo "Cannot run docker on $(SSH_TARGET) over SSH. Set SSH_TARGET, SSH_OPTS, DOCKER_CMD in local.mk." >&2; exit 1; }

init: ## Download the providers
	terraform init

bootstrap: init ## 1. Create the project and the OpenBao service
	terraform apply $(TF_ARGS) $(BOOTSTRAP_TARGETS)

vault-init: ssh-check ## 2. Initialise and unseal OpenBao, create the Dokploy token
	scripts/vault-init.sh

unseal: ## Unseal OpenBao again (needed after the server reboots)
	scripts/unseal.sh

secrets: ## 3. Generate missing secrets and store them in OpenBao
	scripts/seed-secrets.sh

deploy: unseal ## 4. Deploy everything; services read secrets from OpenBao
	@test -f $(SECRETS_DIR)/dokploy-token || { echo "Run make vault-init first."; exit 1; }
	TF_VAR_vault_token="$$(cat $(SECRETS_DIR)/dokploy-token)" terraform apply $(TF_ARGS)

migrate: unseal ## 5. Run the Directus migrations and seeds
	scripts/migrate.sh

up: bootstrap vault-init secrets deploy migrate ## Run all five steps (safe to repeat)

plan: ## Show the pending changes
	@test -f $(SECRETS_DIR)/dokploy-token || { echo "Run make vault-init first."; exit 1; }
	TF_VAR_vault_token="$$(cat $(SECRETS_DIR)/dokploy-token)" terraform plan

credentials: unseal ## Print the generated passwords and tokens
	@scripts/credentials.sh

fmt: ## Format the Terraform files
	terraform fmt -recursive

validate: ## Validate the configuration
	terraform validate
