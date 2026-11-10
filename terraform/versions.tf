terraform {
  required_version = ">= 1.5"

  required_providers {
    dokploy = {
      source  = "vanillauys/dokploy"
      version = "~> 1.11"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.7"
    }
  }
}

provider "dokploy" {
  endpoint = var.dokploy_endpoint
  api_key  = var.dokploy_api_key
}
