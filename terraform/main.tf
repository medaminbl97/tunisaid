locals {
  host_suffix   = "${replace(var.server_ip, ".", "-")}.sslip.io"
  frontend_host = "${var.frontend_subdomain}.${local.host_suffix}"
  backend_host  = "${var.backend_subdomain}.${local.host_suffix}"
  frontend_url  = "https://${local.frontend_host}"
  backend_url   = "https://${local.backend_host}"
}

resource "dokploy_project" "main" {
  name        = var.project_name
  description = "TunisAid website, Directus backend, database and vault. Managed by Terraform."
}

# Overlay network that only the database and the backend join. The database
# leaves dokploy-network, so no other service on the host can reach it.
resource "dokploy_network" "database" {
  name       = "${var.project_name}-database"
  driver     = "overlay"
  attachable = true
  internal   = true
}
