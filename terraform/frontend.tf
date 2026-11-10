data "dokploy_github_provider" "main" {
  name = var.github_provider_name
}

resource "dokploy_application" "frontend" {
  name           = "${var.project_name}-frontend"
  environment_id = dokploy_project.main.production_environment_id

  github = {
    github_id  = data.dokploy_github_provider.main.id
    owner      = var.github_owner
    repository = var.github_repository
    branch     = var.github_branch
  }

  build = {
    type       = "dockerfile"
    dockerfile = "Dockerfile"
  }

  # Vite inlines this value into the browser bundle, so it is a build argument
  # and holds the public backend URL.
  build_args = "VITE_API_BASE_URL=${local.backend_url}"

  # Server-side calls reach Directus by its private name instead of the public
  # URL, so the service token never leaves the Docker network.
  env = join("\n", compact([
    "DIRECTUS_URL=http://${dokploy_application.backend.app_name}:8055",
    "DIRECTUS_SERVICE_TOKEN=${local.vault_ref.donation_service_token}",
    "DONATION_SIGNING_SECRET=${local.vault_ref.donation_signing_secret}",
    var.payment_provider == "" ? "" : "PAYMENT_PROVIDER=${var.payment_provider}",
    "ALLOW_MOCK_PAYMENTS=${var.allow_mock_payments}",
  ]))

  depends_on = [dokploy_vault_provider.openbao]
}

resource "dokploy_domain" "frontend" {
  application_id   = dokploy_application.frontend.id
  host             = local.frontend_host
  port             = 3000
  https            = true
  certificate_type = "letsencrypt"
}
