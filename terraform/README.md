# AWS Infrastructure with Terraform

This directory contains the Terraform configuration for the AWS infrastructure used by the project. It creates:

- A VPC with DNS hostnames and DNS support enabled.
- A public subnet that automatically assigns public IPv4 addresses.
- An Internet Gateway and a public route table with a default route to the internet.
- A security group for the application server.
- One EC2 instance with an encrypted `gp3` root volume and a public IPv4 address.

The VPC provides an isolated network for the deployment. The public subnet gives the instance a place to run, while the Internet Gateway and route table allow internet traffic to and from that subnet. The security group allows SSH on port 22 only from the configured trusted CIDR, and allows the backend API on port 5000 and frontend on port 4173 from the internet. The EC2 instance is the application host.

Terraform only creates the AWS infrastructure. Ansible handles server configuration and application deployment separately.

## Prerequisites

Before starting, make sure you have:

- An AWS account and an IAM user with permission to create and manage the VPC, subnet, Internet Gateway, route table, security group, and EC2 resources used by this configuration.
- The AWS CLI installed and configured with credentials for that IAM user.
- Terraform installed.
- An existing EC2 key pair in the AWS region you will use.
- The SSH private key that corresponds to that EC2 key pair.

Confirm that the AWS CLI is using the expected account:

```bash
aws sts get-caller-identity
```

Never put AWS credentials or an SSH private key in this directory, `terraform.tfvars`, or source control.

## Configure variables

Run the following commands from the repository root to create your local variables file:

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

On Windows PowerShell, use this equivalent copy command:

```powershell
Copy-Item terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and replace the placeholders:

- `project_name`: Name used in resource tags and names. The example uses `my-application`.
- `environment`: Environment name used in resource tags and names, such as `dev`.
- `aws_region`: AWS region where the resources will be created.
- `ami_id`: An Ubuntu-compatible AMI ID available in the selected region.
- `instance_type`: EC2 instance type, such as `t3.micro`.
- `key_pair_name`: Name of the existing EC2 key pair in the selected region.
- `ssh_allowed_cidr`: The trusted public IP address allowed to connect over SSH.
- `root_volume_size`: Size of the encrypted EC2 root volume in gigabytes.

Use a `/32` CIDR for `ssh_allowed_cidr`, for example `203.0.113.10/32`, to allow SSH from one trusted public IP address only. Do not use `0.0.0.0/0` for SSH access because it exposes port 22 to the entire internet.

The example file is safe to commit because it contains placeholders. Keep your local `terraform.tfvars` untracked; it contains environment-specific configuration.

## Initialize, format, and validate

Run these commands from the `terraform` directory:

```bash
terraform init
```

`terraform init` downloads the required AWS provider and initializes the working directory.

```bash
terraform fmt
```

`terraform fmt` formats the Terraform files using Terraform's standard style.

```bash
terraform validate
```

`terraform validate` checks that the configuration is syntactically valid and internally consistent. It does not create AWS resources.

## Review and apply the deployment

Create a deployment plan before making changes:

```bash
terraform plan -var-file="terraform.tfvars"
```

The plan shows which resources Terraform intends to create, change, or destroy. Review it carefully, especially the AWS region, AMI, instance type, key pair, and allowed SSH address.

Apply the approved plan:

```bash
terraform apply -var-file="terraform.tfvars"
```

Terraform displays the proposed changes again. Type `yes` only after verifying that the plan is expected. The first deployment may take a few minutes while AWS creates the network and EC2 resources.

## View outputs and access the infrastructure

Display the values exported by the configuration:

```bash
terraform output
```

The outputs include the VPC, subnet, security group, and instance IDs, the instance's private and public IP addresses, and `application_url`.

Retrieve only the EC2 public IP when needed:

```bash
terraform output -raw instance_public_ip
```

Use the `application_url` output to open the frontend in a browser. It points to the instance's public IP on port 4173:

```bash
terraform output -raw application_url
```

SSH access depends on both the security group allowing your current public IP through `ssh_allowed_cidr` and your using the private key that matches `key_pair_name`. For an Ubuntu AMI, the SSH username is usually `ubuntu`:

```bash
ssh -i /path/to/private-key.pem ubuntu@$(terraform output -raw instance_public_ip)
```

Replace `/path/to/private-key.pem` with the path to your private key. Do not add the private key to the repository.

## Destroy the infrastructure

When the environment is no longer needed, review and remove the resources managed by this Terraform configuration:

```bash
terraform destroy -var-file="terraform.tfvars"
```

Terraform shows a destruction plan and asks for confirmation. Verify the resources and the selected AWS account and region before typing `yes`. Destroying the configuration removes the VPC, subnet, networking resources, security group, and EC2 instance managed here; back up anything important first.

## Important notes

- Do not commit `.terraform/`. It contains downloaded provider files and local working-directory data that can be recreated with `terraform init`.
- Do not commit Terraform state files such as `terraform.tfstate` or `terraform.tfstate.*`. State can contain sensitive infrastructure details and should be stored securely; team or production environments should use a protected remote backend.
- Commit `.terraform.lock.hcl`. It records the selected provider versions and checksums so other users and environments initialize consistently.
- Keep `terraform.tfvars` untracked because it contains environment-specific values. Commit only `terraform.tfvars.example` with placeholders.
- AWS resources, including the EC2 instance, storage, and public networking, may incur costs. Review the plan and destroy resources when they are no longer required.
