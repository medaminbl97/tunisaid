locals {
  database_name = "tunisaid"
  database_user = "tunisaid"
}

# Kept in the Terraform state because the Postgres resource sets the password
# itself. `make secrets` copies it to the vault, which the backend reads.
resource "random_password" "database" {
  length  = 32
  special = false
}

# No external_port and no domain: the database has no published port and no
# route, and is reachable only by its app_name on the private network.
resource "dokploy_postgres" "database" {
  name           = "${var.project_name}-database"
  environment_id = dokploy_project.main.production_environment_id

  database_name     = local.database_name
  database_user     = local.database_user
  database_password = random_password.database.result
  docker_image      = var.postgres_image

  network_ids            = [dokploy_network.database.id]
  detach_dokploy_network = true
}
