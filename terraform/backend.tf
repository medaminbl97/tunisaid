resource "dokploy_application" "backend" {
  name           = "${var.project_name}-backend"
  environment_id = dokploy_project.main.production_environment_id

  # Dokploy builds directus/Dockerfile on the server. The image holds the
  # schemas, access policies and seeds, which it applies on every start.
  github = {
    github_id  = data.dokploy_github_provider.main.id
    owner      = var.github_owner
    repository = var.github_repository
    branch     = var.github_branch
  }

  build = {
    type         = "dockerfile"
    dockerfile   = "directus/Dockerfile"
    context_path = "directus"
  }

  network_ids = [dokploy_network.database.id]

  # Secrets are references that Dokploy resolves from the vault at deploy time.
  env = <<-EOT
    SECRET=${local.vault_ref.directus_secret}
    ADMIN_EMAIL=${var.directus_admin_email}
    ADMIN_PASSWORD=${local.vault_ref.directus_admin_password}
    DB_CLIENT=pg
    DB_HOST=${dokploy_postgres.database.app_name}
    DB_PORT=5432
    DB_DATABASE=${local.database_name}
    DB_USER=${local.database_user}
    DB_PASSWORD=${local.vault_ref.database_password}
    PUBLIC_URL=${local.backend_url}
    PROJECT_NAME=TunisAid
    TELEMETRY=false
    WEBSOCKETS_ENABLED=false
    CORS_ENABLED=true
    CORS_ORIGIN=${local.frontend_url}
    CORS_METHODS=GET
    CACHE_SCHEMA=false
    CMS_ENV=prod
    DONATION_SERVICE_TOKEN=${local.vault_ref.donation_service_token}
  EOT

  depends_on = [dokploy_vault_provider.openbao]
}

resource "dokploy_mount" "backend_uploads" {
  service_id   = dokploy_application.backend.id
  service_type = "application"

  type        = "volume"
  volume_name = "${var.project_name}-uploads"
  mount_path  = "/directus/uploads"
}

resource "dokploy_domain" "backend" {
  application_id   = dokploy_application.backend.id
  host             = local.backend_host
  port             = 8055
  https            = true
  certificate_type = "letsencrypt"
}
