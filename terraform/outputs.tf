output "frontend_url" {
  description = "Public website URL."
  value       = local.frontend_url
}

output "backend_url" {
  description = "Public Directus URL."
  value       = local.backend_url
}

output "database_host" {
  description = "Private host name of the database. It resolves only on the database network."
  value       = dokploy_postgres.database.app_name
}

output "openbao_url" {
  description = "Internal OpenBao address. It is not published; use `make credentials` to read secrets."
  value       = "http://${dokploy_application.openbao.app_name}:8200"
}

output "stripe_webhook_url" {
  description = "Endpoint to register in the Stripe dashboard (Developers > Webhooks)."
  value       = "${local.frontend_url}/api/stripe/webhook"
}
