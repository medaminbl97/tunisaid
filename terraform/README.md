# TunisAid infrastructure

Terraform configuration that provisions the TunisAid stack on a
[Dokploy](https://dokploy.com) server with the
[`vanillauys/dokploy`](https://registry.terraform.io/providers/vanillauys/dokploy/latest/docs)
provider. Secrets are generated once, kept in [OpenBao](https://openbao.org),
and read by the services at deploy time.

## Files

| File                         | Contents                                                                                |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| [main.tf](main.tf)           | Shared locals (hosts, URLs), the Dokploy project and the private network.               |
| [database.tf](database.tf)   | PostgreSQL: no published port, no domain, off `dokploy-network`.                        |
| [backend.tf](backend.tf)     | Directus, its uploads volume and its HTTPS domain.                                      |
| [frontend.tf](frontend.tf)   | Website built from the GitHub repository `Dockerfile`, and its domain.                  |
| [vault.tf](vault.tf)         | OpenBao, its data volume, the Dokploy vault connection and secret refs.                 |
| [variables.tf](variables.tf) | Inputs. [outputs.tf](outputs.tf) lists URLs. [versions.tf](versions.tf) pins providers. |
| [Makefile](Makefile)         | One entry point; helper scripts live in [scripts/](scripts).                            |

## Usage

Create an API key in Dokploy under **Settings > Profile > API/CLI Keys** with
rate limiting off (an exhausted key answers `401`). Then:

```bash
cp terraform.tfvars.example terraform.tfvars   # endpoint, server_ip, email, GitHub app and owner
export TF_VAR_dokploy_api_key=...
make up
```

`make up` is safe to repeat. It runs four steps, which you can also run alone:

| Step | Command           | What it does                                                                                         |
| ---- | ----------------- | ---------------------------------------------------------------------------------------------------- |
| 1    | `make bootstrap`  | Creates the project, OpenBao, its volume and the database password.                                  |
| 2    | `make vault-init` | Initialises and unseals OpenBao, enables KV v2, writes a read-only policy, issues Dokploy's token.   |
| 3    | `make secrets`    | Generates every missing secret with `openssl` and stores it in OpenBao. Existing values are kept.    |
| 4    | `make deploy`     | Applies the rest. Services get `${{vault.openbao.<path>:<field>}}` references that Dokploy resolves. |

Other targets: `make plan`, `make credentials` (prints all generated secrets),
`make unseal`, `make help`.

## Where the secrets are

- **Find them with `make credentials`.** This includes the Directus
  administrator password (`directus_admin_password`, login: `directus_admin_email`)
  and the `donation_service_token` that the backend and the website share.
- They live in OpenBao at `secret/<project>/app`, on the server's data volume.
- `.secrets/` (gitignored) holds the **unseal keys and root token**
  (`openbao-init.json`, `root-token`) and Dokploy's read-only token. **Copy
  `.secrets/` to a password manager.** Losing the unseal keys means losing the
  vault.
- Only the database password is also in the Terraform state, because the Postgres
  resource sets it. The Dokploy vault token is write-only and stays out of the state.

## Networking

- The database has no published port and no domain. It joins only an internal
  overlay network and leaves `dokploy-network`; only Directus joins both.
- OpenBao has no domain and no published port. It is reachable on
  `dokploy-network` (so Dokploy can resolve secrets) and by `make` through
  `ssh` + `docker exec` on the server, with the token sent over stdin.
  `SSH_TARGET` defaults to `root@<server_ip>`; override it with
  `make up SSH_TARGET=user@host`. The SSH user must be able to run `docker`.
- The website calls Directus by its private name server-side; the browser uses
  the public backend URL (`VITE_API_BASE_URL`, a build argument).
- Hosts look like `tunisaid.203-0-113-10.sslip.io` and
  `api-tunisaid.203-0-113-10.sslip.io`. Ports 80 and 443 must be reachable
  for Let's Encrypt.

## After a server reboot

OpenBao starts sealed, and deployments that need secrets fail until it is
unsealed. Run `make unseal` (`make deploy` and `make credentials` do it too).

## Stripe payments

Set `payment_provider = "stripe"` in `terraform.tfvars`, then:

1. Run `make stripe-keys` and paste the Stripe **secret key** and, after step 3, the
   **webhook signing secret**. They are stored in OpenBao (hidden prompt, never in
   Terraform state) and read by the website through vault references. You can also
   pass them as `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
2. `make deploy` sets `PAYMENT_PROVIDER`, `SITE_URL` and the two vault references on
   the website. The backend already allows the donation service to write refunds.
3. In the Stripe dashboard (Developers → Webhooks) add the endpoint from
   `terraform output stripe_webhook_url` with the events
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed`, `checkout.session.expired`,
   `refund.created`, `refund.updated` and `refund.failed`, and copy its signing
   secret into step 1.

Use test-mode keys first. Going live means repeating the steps with live keys and a
live-mode webhook endpoint.

## Directus image

Dokploy builds [`../directus/Dockerfile`](../directus/Dockerfile) on the server
(no registry). The image extends the pinned Directus image and contains the
schemas, access policies, seeds and loader. On every start its entrypoint
bootstraps Directus, applies those definitions on a private loopback server, and
only then opens the public port, so a failed sync keeps the backend down. Change
a schema or a seed, push, and redeploy the backend; there is no separate
migration step. Production runs without `CMS_ENV=dev`, so only reference data
(languages) is seeded and no demo content is created. Editors create the content
in Directus.

Terraform owns the application settings: changes made in the Dokploy UI are
overwritten by the next apply.
