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

`make up` is safe to repeat. It runs five steps, which you can also run alone:

| Step | Command           | What it does                                                                                         |
| ---- | ----------------- | ---------------------------------------------------------------------------------------------------- |
| 1    | `make bootstrap`  | Creates the project, OpenBao, its volume and the database password.                                  |
| 2    | `make vault-init` | Initialises and unseals OpenBao, enables KV v2, writes a read-only policy, issues Dokploy's token.   |
| 3    | `make secrets`    | Generates every missing secret with `openssl` and stores it in OpenBao. Existing values are kept.    |
| 4    | `make deploy`     | Applies the rest. Services get `${{vault.openbao.<path>:<field>}}` references that Dokploy resolves. |
| 5    | `make migrate`    | Runs `directus/scripts/setup.mjs` against the backend: migrations, seeds, donation-service user.     |

Other targets: `make plan`, `make credentials` (prints all generated secrets),
`make unseal`, `make help`.

## Where the secrets are

- **Find them with `make credentials`.** This includes the Directus
  administrator password (`directus_admin_password`, login: `directus_admin_email`)
  and the `donation_service_token` for the Directus setup script.
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

## Directus migrations

The Directus image only runs `bootstrap` and `start`. The project's migrations
are API migrations in [`../directus/`](../directus/README.md), run by
`make migrate` (step 5) with the generated admin password and
`donation_service_token`. Applied migrations are skipped, so rerun it after
adding a migration. Seeded content is created as **drafts**, so the website
shows no projects or campaigns until you publish them in Directus.

Terraform owns the application settings: changes made in the Dokploy UI are
overwritten by the next apply.
