# AWS Infrastructure with Terraform

This directory contains the Terraform configuration for deploying
the AgriRent application infrastructure on AWS.

## Architecture

The infrastructure consists of:

- A VPC with public and private subnets.
- An Internet Gateway for public internet connectivity.
- A NAT Gateway for outbound internet access from private resources.
- A Bastion Host in a public subnet.
- A private application EC2 instance.
- An Application Load Balancer for public application access.
- A managed PostgreSQL database using Amazon RDS.
- A private Amazon ECR repository for Docker images.
- Security Groups controlling communication between resources.
- IAM permissions allowing the application EC2 instance to access ECR
  and retrieve database credentials from Secrets Manager.

## Network Architecture

### Public Subnets

The public subnets contain:

- Bastion Host.
- Application Load Balancer.
- NAT Gateway.

### Private Subnets

The private subnets contain:

- Application EC2 instance.
- Managed PostgreSQL database.

The application EC2 instance does not have a public IP address.

All SSH access to the application instance must pass through
the Bastion Host.

The database is not publicly accessible.

## Security Groups

The configuration uses separate security groups:

| Security Group | Allowed Traffic |
|---|---|
| ALB Security Group | HTTP from the internet |
| Bastion Security Group | SSH from trusted public IP |
| Application Security Group | SSH from Bastion, application traffic from ALB |
| Database Security Group | PostgreSQL from application EC2 only |

## Prerequisites

Before deploying, make sure you have:

- An AWS account.
- AWS CLI installed and configured.
- Terraform installed.
- Docker installed.
- An existing EC2 key pair in your selected AWS region.
- The corresponding SSH private key.
- An Ubuntu AMI ID compatible with your selected AWS region.

Confirm your AWS identity:

```bash
aws sts get-caller-identity
```

Never commit AWS credentials, SSH private keys, or database passwords
to the repository.

## Configure Variables

From the repository root:

```bash
cd terraform
```

Create your local variables file.

Linux/macOS:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Windows PowerShell:

```powershell
Copy-Item terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and replace the placeholders.

Important variables:

| Variable | Purpose |
|---|---|
| project_name | Project name |
| environment | Deployment environment |
| aws_region | AWS deployment region |
| ami_id | Ubuntu AMI ID |
| instance_type | Application EC2 instance type |
| bastion_instance_type | Bastion EC2 instance type |
| key_pair_name | Existing AWS EC2 key pair |
| ssh_allowed_cidr | Trusted public IP allowed to SSH into Bastion |
| db_name | PostgreSQL database name |
| db_username | PostgreSQL master username |
| ecr_repository_name | Private ECR repository name |

Use `/32` for the SSH CIDR to restrict access to one public IP address.

Do not use `0.0.0.0/0` for SSH access.

## Initialize Terraform

Run:

```bash
terraform init
```

This downloads the required Terraform providers and initializes
the working directory.

## Format and Validate

Format the configuration:

```bash
terraform fmt
```

Validate the configuration:

```bash
terraform validate
```

## Review the Infrastructure Plan

Run:

```bash
terraform plan -var-file="terraform.tfvars"
```

Review the resources Terraform intends to create.

Pay attention to:

- AWS region.
- VPC and subnet CIDRs.
- EC2 instance types.
- Security Group rules.
- RDS configuration.
- NAT Gateway and other resources that incur costs.

## Deploy the Infrastructure

Run:

```bash
terraform apply -var-file="terraform.tfvars"
```

Review the proposed changes and type `yes` when you are ready.

Terraform creates the AWS infrastructure.

## Push the Application Image to Private ECR

After Terraform creates the ECR repository, retrieve its URL:

```bash
terraform output -raw ecr_repository_url
```

Authenticate Docker with Amazon ECR:

```bash
aws ecr get-login-password --region YOUR_AWS_REGION | docker login --username AWS --password-stdin YOUR_ECR_REPOSITORY_URL
```

Build the AgriRent application image:

```bash
docker build -t agrirent-app:v1 .
```

Tag the image for ECR:

```bash
docker tag agrirent-app:v1 YOUR_ECR_REPOSITORY_URL:v1
```

Push the image:

```bash
docker push YOUR_ECR_REPOSITORY_URL:v1
```

Replace the placeholders with the actual AWS region and ECR repository URL.

The application EC2 instance has an IAM role that allows it to pull
images from the private ECR repository.

## Application Deployment with Ansible

Terraform handles infrastructure provisioning.

Ansible handles application deployment and server configuration.

The deployment process should:

1. Connect to the Bastion Host.
2. Access the private application EC2 instance through the Bastion.
3. Authenticate with private ECR.
4. Pull the AgriRent application image.
5. Configure the application environment.
6. Retrieve the database credentials from AWS Secrets Manager.
7. Configure the PostgreSQL database connection.
8. Start the application container.

The application EC2 instance is not directly accessible from the internet.

## Access the Application

Retrieve the application URL:

```bash
terraform output -raw application_url
```

Open the returned URL in your browser.

Public application traffic is received by the Application Load Balancer,
which forwards requests to the private application EC2 instance.

## Access the Bastion Host

Retrieve the Bastion public IP:

```bash
terraform output -raw bastion_public_ip
```

Connect using your private SSH key:

```bash
ssh -i /path/to/private-key.pem ubuntu@BASTION_PUBLIC_IP
```

Replace the private key path and Bastion public IP.

## Retrieve Infrastructure Outputs

Display all outputs:

```bash
terraform output
```

Useful outputs include:

- VPC ID.
- Public and private subnet IDs.
- Bastion instance ID and public IP.
- Application instance ID and private IP.
- Application Load Balancer DNS.
- RDS database endpoint.
- Database secret ARN.
- Private ECR repository URL.

## Destroy Infrastructure

When the environment is no longer required:

```bash
terraform destroy -var-file="terraform.tfvars"
```

Review the destruction plan before confirming.

Destroying the infrastructure removes the resources managed by
this Terraform configuration.

Back up important database data before destroying the database.

## Important Notes

- Never commit `terraform.tfvars`.
- Never commit AWS credentials or SSH private keys.
- Never commit Terraform state files.
- Commit `.terraform.lock.hcl`.
- Do not expose the application EC2 instance directly to the internet.
- Do not make the RDS database publicly accessible.
- Restrict Bastion SSH access to a trusted IP address.
- AWS resources may incur charges, including EC2, RDS, ALB, NAT Gateway,
  EBS storage, and data transfer.
- Destroy resources when they are no longer required.
