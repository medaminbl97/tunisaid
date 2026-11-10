locals {
  vault_secret_path = "${var.project_name}/app"
  vault_secret_keys = [
    "database_password",
    "directus_secret",
    "directus_admin_password",
    "donation_service_token",
    "donation_signing_secret",
  ]

  # Dokploy resolves ${{vault.<provider>.<path>:<field>}} at deploy time. The
  # doubled $$ keeps Terraform from interpolating the literal.
  vault_ref = {
    for key in local.vault_secret_keys :
    key => "$${{vault.${dokploy_vault_provider.openbao.name}.${local.vault_secret_path}:${key}}}"
  }

  openbao_config = {
    ui                = false
    disable_mlock     = true
    max_lease_ttl     = "87600h"
    default_lease_ttl = "87600h"
    api_addr          = "http://127.0.0.1:8200"
    cluster_addr      = "http://127.0.0.1:8201"
    storage           = { raft = { path = "/openbao/file", node_id = "openbao" } }
    listener          = { tcp = { address = "0.0.0.0:8200", tls_disable = true } }
  }
}

# No domain and no published port: OpenBao is reachable only on the Docker
# network, by Dokploy (to resolve secrets) and by `make` over SSH.
resource "dokploy_application" "openbao" {
  name           = "${var.project_name}-openbao"
  environment_id = dokploy_project.main.production_environment_id

  docker = {
    image = var.openbao_image
  }

  args = ["server"]

  env = "BAO_LOCAL_CONFIG=${jsonencode(local.openbao_config)}"
}

resource "dokploy_mount" "openbao_data" {
  service_id   = dokploy_application.openbao.id
  service_type = "application"

  type        = "volume"
  volume_name = "${var.project_name}-openbao-data"
  mount_path  = "/openbao/file"
}

# Created by the second phase of `make up`, once OpenBao is initialised and
# `make vault-init` has issued the read-only token.
resource "dokploy_vault_provider" "openbao" {
  name = "openbao"

  hashicorp = {
    url              = "http://${dokploy_application.openbao.app_name}:8200"
    mount            = "secret"
    token_wo         = var.vault_token
    token_wo_version = var.vault_token_version
  }

  assignments = [
    { project_id = dokploy_project.main.id }
  ]

  verify_connection = true

  lifecycle {
    precondition {
      condition     = var.vault_token != null
      error_message = "vault_token is unset. Run `make deploy` (or `make vault-init` first) instead of calling terraform directly."
    }
  }

  depends_on = [dokploy_mount.openbao_data]
}
