# Ansible deployment for AgriRent

This directory contains the infrastructure automation used to provision and deploy the AgriRent application on a remote Amazon Linux 2023 host. The playbook installs the required OS packages, configures Docker, hardens SSH, opens the needed firewall ports, and deploys the application stack using Docker Compose.

## What this playbook does

The main playbook is `site.yml` and it runs in this order:

1. `common` - validates the target OS and installs the baseline packages required by the server roles.
2. `docker` - installs Docker Engine and the Docker Compose plugin, configures daemon logging, starts the service, and ensures the remote user can use Docker without sudo.
3. `security` - enables `firewalld`, opens the app ports, applies SSH hardening, and installs `fail2ban`.
4. `app_deploy` - writes the runtime `.env`, copies the project `docker-compose.yml`, and brings the stack up while waiting for the health endpoint to respond.

This is designed to be idempotent and safe for repeat deployments.

## Directory layout

```text
ansible/
├── ansible.cfg                # default inventory, vault password, callback settings
├── inventory/
│   └── hosts.ini             # target host definition
├── group_vars/
│   └── all/
│       ├── vars.yml          # non-secret application and server defaults
│       └── vault.yml         # encrypted secrets for PostgreSQL and JWT
├── roles/
│   ├── common/
│   │   └── tasks/main.yml
│   ├── docker/
│   │   └── tasks/main.yml
│   ├── security/
│   │   ├── tasks/main.yml
│   │   ├── handlers/main.yml
│   │   └── templates/
│   │       ├── jail.local.j2
│   │       └── sshd_hardening.j2
│   └── app_deploy/
│       ├── handlers/main.yml
│       ├── tasks/main.yml
│       └── templates/env.j2
├── requirements.yml          # external Ansible collections required by the playbook
├── site.yml                  # main orchestration playbook
└── README.md                 # this file
```

## Prerequisites

Before running the deployment, make sure the following are in place:

- Ansible installed locally.
- SSH access to the target Linux host.
- A remote server running Amazon Linux 2023 or another RedHat-family distribution compatible with the role logic.
- A valid SSH private key for the target host.
- A `~/.ansible_vault_pass` file or another vault-password method configured in `ansible.cfg`.
- The project root is available locally so the playbook can copy the root `docker-compose.yml` file into the target server.

### Required Ansible collections

These are expected by the playbook and should be installed before use:

```bash
ansible-galaxy install -r requirements.yml
```

## Inventory and host configuration

The target host is defined in `inventory/hosts.ini`:

```ini
[app]
app_server ansible_host=16.171.227.211 ansible_user=ec2-user ansible_ssh_private_key_file=~/.ssh/AgriRent-key.pem
```

Adjust the following values to match your environment:

- `app_server` - a friendly host alias used in Ansible.
- `ansible_host` - the public or private IP address or DNS name of the EC2 instance.
- `ansible_user` - the SSH user, typically `ec2-user` for Amazon Linux.
- `ansible_ssh_private_key_file` - the path to your SSH private key.

The default inventory file is already configured in `ansible.cfg` under the `[defaults]` section:

```ini
[defaults]
inventory = inventory/hosts.ini
```

## Configuration variables

### Non-secret values

The file `group_vars/all/vars.yml` stores system and application defaults such as:

```yaml
app_name: agrirent
app_dir: /opt/agrirent
app_backend_port: 5000
app_frontend_port: 4173
app_health_url: "http://127.0.0.1:5000/health"
postgres_user: postgres
postgres_db: agrirent
postgres_host: db
postgres_port: 5432
```

These values should match the application and Docker Compose configuration in the project root. In particular:

- `app_backend_port` must match the backend container port.
- `app_frontend_port` must match the frontend container port.
- `firewall_allowed_tcp` must match the security group and firewall rules.
- `app_health_url` is the endpoint the playbook checks after deployment.

### Secret values

The file `group_vars/all/vault.yml` stores encrypted secrets used by the deployed application. The template for the runtime environment is `roles/app_deploy/templates/env.j2` and it renders values like:

```yaml
vault_postgres_password
vault_jwt_access_secret
vault_jwt_refresh_secret
```

You should populate the vault using Ansible Vault and keep these values secret.

Example:

```bash
ansible-vault edit group_vars/all/vault.yml
```

The expected structure is:

```yaml 
0
vault_postgres_password: "your-postgres-password"
vault_jwt_access_secret: "your-access-secret"
vault_jwt_refresh_secret: "your-refresh-secret"
```

## Vault password configuration

`ansible.cfg` expects a vault password file at:

```bash
~/.ansible_vault_pass
```

This is the file Ansible uses to decrypt `vault.yml` automatically. If you do not want to store the password there, you can use one of the alternate Ansible Vault methods such as `--ask-vault-pass` or a custom environment-based solution.

## How to run the deployment

From the `ansible` directory:

```bash
cd ansible
ansible-playbook site.yml
```

### Syntax check

```bash
ansible-playbook site.yml --syntax-check
```

### Run only the application deployment tasks

```bash
ansible-playbook site.yml --tags app,deploy
```

### Run the play with prompt for vault password

```bash
ansible-playbook site.yml --ask-vault-pass
```

### Check the target host connectivity

```bash
ansible all -i inventory/hosts.ini -m ping
```

## Deployment flow details

### 1. common role

This role ensures the target host is compatible and installs the minimal packages needed for later tasks:

- `firewalld`
- `python3-dnf`
- starts the `firewalld` service

### 2. docker role

This role:

- installs Docker CE and the Compose plugin
- writes `/etc/docker/daemon.json` with log rotation settings
- starts and enables the Docker service
- adds the SSH user to the `docker` group
- verifies that `docker compose version` works before continuing

### 3. security role

This role:

- opens inbound TCP ports for SSH and the application endpoints
- creates a hardened SSH configuration under `/etc/ssh/sshd_config.d/`
- disables password authentication and root login
- installs `fail2ban` and applies a jail configuration

### 4. app_deploy role

This role:

- creates the application directory at `/opt/agrirent`
- renders the `.env` file from `group_vars` and encrypted vault values
- copies the root Docker Compose file into the app directory
- runs `docker compose up` with the project source at `/opt/agrirent`
- waits for `http://127.0.0.1:5000/health` to return HTTP 200
- captures container logs if the stack fails to become healthy

## Runtime environment file

The environment file generated by the deployment is:

```text
/opt/agrirent/.env
```

This file contains values such as:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=...
POSTGRES_DB=agrirent
DATABASE_URL=postgresql://postgres:...@db:5432/agrirent
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
```

This file is created from `group_vars/all/vars.yml` and `group_vars/all/vault.yml` by the `env.j2` template.

## Security notes

- The playbook disables password-based SSH login and root SSH access.
- The application ports are explicitly opened in `firewalld`.
- The SSH configuration is managed as a drop-in file under `/etc/ssh/sshd_config.d/`.
- The `.env` file is written with mode `0600` and the playbook marks the task as `no_log` to avoid exposing secrets in console output.

## Troubleshooting

### SSH connectivity fails

Check that the host is reachable and the key and user are correct:

```bash
ssh -i ~/.ssh/AgriRent-key.pem ec2-user@<host>
```

### Docker is not installed or Compose is missing

Re-run the playbook after confirming the host is Amazon Linux 2023 and the server has package access.

### Application health check fails

Inspect the logs on the target host:

```bash
ssh ec2-user@<host>
cd /opt/agrirent
docker compose logs --tail=200
```

### Vault decryption fails

Check that the vault password file exists and is readable:

```bash
ls -l ~/.ansible_vault_pass
cat ~/.ansible_vault_pass
```

## Useful operational commands

```bash
# Check the app container status
ssh ec2-user@<host> "cd /opt/agrirent && docker compose ps"

# Restart the stack
ssh ec2-user@<host> "cd /opt/agrirent && docker compose restart"

# Pull and recreate services
ssh ec2-user@<host> "cd /opt/agrirent && docker compose up -d --pull missing"
```

## Summary

This Ansible setup is the deployment layer for the AgriRent project. It standardizes server configuration across environments, secures the host, and ensures the Dockerized application stack is deployed consistently and health-checked before the rollout is considered successful.
