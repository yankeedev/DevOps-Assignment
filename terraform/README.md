# AWS Infrastructure with Terraform

This Terraform configuration provisions a basic AWS environment for a containerized application:

- VPC with DNS support.
- Public subnet, internet gateway, and public route table.
- Security group allowing SSH from a trusted IP and application traffic on a configurable port.
- EC2 instance that installs Docker and runs the configured application image.
- Outputs for resource IDs, IP addresses, and the application URL.

> **Cost warning:** AWS resources may incur charges. Review plans carefully and destroy resources when finished.

## Prerequisites

- Terraform CLI 1.5.0 or later.
- AWS CLI and an AWS account.
- AWS credentials with permission to create VPC, subnet, internet gateway, route table, security group, and EC2 resources.
- An existing EC2 key pair in the selected region.
- A compatible Ubuntu LTS AMI ID for that region.
- A publicly accessible container image.

Configure credentials outside Terraform, for example:

```bash
aws configure
aws sts get-caller-identity
```

Do not put AWS access keys in `.tf` files or `terraform.tfvars`.

## Configure variables

From the repository root:

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and replace every placeholder:

- `aws_region`: target AWS region.
- `ami_id`: Ubuntu LTS AMI available in that region.
- `key_pair_name`: existing EC2 key pair name.
- `ssh_allowed_cidr`: trusted public IP with `/32`.
- `app_image`: public container image and tag.
- `app_port`: port exposed on the EC2 instance.
- `container_port`: port used by the application inside the container.

The example uses port 8000; change it to match the application.

Never allow SSH from `0.0.0.0/0`.

## Initialize, format, and validate

```bash
terraform init
terraform fmt -recursive
terraform validate
```

## Plan and apply

Always inspect the plan before provisioning:

```bash
terraform plan
terraform apply
```

Review the proposed actions and type `yes` only when you approve them.

## View outputs

```bash
terraform output
```

Outputs include the VPC ID, subnet ID, security group ID, EC2 instance ID, public/private IP addresses, and application URL.

The application may take a few minutes to become available while the instance installs Docker and pulls the image.

## Connect to the instance

For an Ubuntu AMI, the default SSH user is usually `ubuntu`:

```bash
ssh -i /path/to/private-key.pem ubuntu@$(terraform output -raw instance_public_ip)
```

Use the private key matching the EC2 key pair. Other AMI families may use a different SSH username.

## Deployment assumptions and limitations

The EC2 user-data script assumes:

1. The AMI is Ubuntu and supports `apt-get` and `systemd`.
2. The container image is public and does not require registry authentication.
3. The application listens on `container_port` inside the container.
4. The application can start with a simple `docker run` command.
5. The application does not require extra environment variables, secrets, persistent volumes, or dependent services.

If the application needs a database, private registry credentials, secrets, persistent storage, or a custom startup command, adapt the deployment before using it. Do not place secrets in user data or source control.

## Destroy resources

When the environment is no longer needed:

```bash
terraform destroy
```

Review the destruction plan and confirm only if you intend to delete the resources. Back up any required data first.

## Security, state, and cost

- Use least-privilege IAM credentials.
- Restrict SSH to a trusted IP.
- Expose only required application ports.
- Use HTTPS and a managed certificate for public production traffic.
- Do not commit `terraform.tfvars`, state files, or credentials.
- Terraform state can contain sensitive infrastructure details. For team or production use, configure a secured remote backend with encryption, locking, and restricted access.
- EC2, EBS storage, public IPv4 addresses, and network resources may incur AWS charges.

## Suggested repository `.gitignore` entries

Add these to the repository's existing `.gitignore`:

```gitignore
.terraform/
*.tfstate
*.tfstate.*
*.tfvars
!*.tfvars.example
crash.log
crash.*.log
```

Keep `terraform.tfvars.example` tracked.
