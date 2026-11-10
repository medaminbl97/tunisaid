variable "dokploy_endpoint" {
  description = "Base URL of the Dokploy server, for example https://dokploy.example.com. If null, the provider reads DOKPLOY_ENDPOINT."
  type        = string
  default     = null
}

variable "dokploy_api_key" {
  description = "Dokploy API key (Settings > Profile > API/CLI Keys, rate limiting off). If null, the provider reads DOKPLOY_API_KEY."
  type        = string
  sensitive   = true
  default     = null
}

variable "server_ip" {
  description = "Public IPv4 address of the Dokploy server. sslip.io turns it into resolvable host names."
  type        = string

  validation {
    condition     = can(regex("^(\\d{1,3}\\.){3}\\d{1,3}$", var.server_ip))
    error_message = "server_ip must be an IPv4 address such as 203.0.113.10."
  }
}

variable "project_name" {
  description = "Name of the Dokploy project that holds every TunisAid service."
  type        = string
  default     = "tunisaid"
}

variable "frontend_subdomain" {
  description = "Label in front of <server-ip>.sslip.io for the website."
  type        = string
  default     = "tunisaid"
}

variable "backend_subdomain" {
  description = "Label in front of <server-ip>.sslip.io for the Directus backend."
  type        = string
  default     = "api-tunisaid"
}

variable "github_provider_name" {
  description = "Name of the GitHub App in Dokploy (Git > GitHub). Dokploy uses it to clone the repository."
  type        = string
}

variable "github_owner" {
  description = "GitHub user or organization that owns the repository."
  type        = string
}

variable "github_repository" {
  description = "Repository that Dokploy builds the website from."
  type        = string
  default     = "tunisaid"
}

variable "github_branch" {
  description = "Branch that Dokploy builds and deploys."
  type        = string
  default     = "main"
}

variable "directus_image" {
  description = "Directus image. Keep it in line with directus/compose.yaml."
  type        = string
  default     = "directus/directus:11.17.4"
}

variable "postgres_image" {
  description = "PostgreSQL image. Keep it in line with directus/compose.yaml."
  type        = string
  default     = "postgres:17.6-alpine"
}

variable "openbao_image" {
  description = "OpenBao image that holds the secrets."
  type        = string
  default     = "openbao/openbao:2.7.2"
}

variable "vault_token" {
  description = "Read-only OpenBao token that Dokploy uses. `make deploy` issues it and passes it as TF_VAR_vault_token."
  type        = string
  sensitive   = true
  default     = null
}

variable "vault_token_version" {
  description = "Bump to send a new vault_token to Dokploy (the token is write-only and not stored in state)."
  type        = number
  default     = 1
}

variable "directus_admin_email" {
  description = "Email of the first Directus administrator."
  type        = string
}

variable "payment_provider" {
  description = "Payment provider of the website. Only \"mock\" exists; leave empty to keep online checkout disabled."
  type        = string
  default     = ""

  validation {
    condition     = contains(["", "mock"], var.payment_provider)
    error_message = "payment_provider must be empty or \"mock\"."
  }
}

variable "allow_mock_payments" {
  description = "Allow the mock provider in production. It marks donations paid without money moving."
  type        = bool
  default     = false
}
