variable "project_name" {
  description = "The name of the project"
  type        = string
  default     = "DevOps-Assignment"
}

variable "environment" {
  description = "The environment for deployment"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "The AWS region to deploy resources"
  type        = string
}

# Networking

variable "vpc_cidr" {
  description = "The CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_a_cidr" {
  description = "CIDR block for the first public subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "public_subnet_b_cidr" {
  description = "CIDR block for the second public subnet"
  type        = string
  default     = "10.0.2.0/24"
}

variable "private_subnet_a_cidr" {
  description = "CIDR block for the first private subnet"
  type        = string
  default     = "10.0.11.0/24"
}

variable "private_subnet_b_cidr" {
  description = "CIDR block for the second private subnet"
  type        = string
  default     = "10.0.12.0/24"
}

# EC2 Instances

variable "ami_id" {
  description = "The Ubuntu AMI ID for the EC2 instances"
  type        = string
}

variable "instance_type" {
  description = "The EC2 instance type for the application server"
  type        = string
  default     = "t3.micro"
}

variable "bastion_instance_type" {
  description = "The EC2 instance type for the Bastion Host"
  type        = string
  default     = "t3.micro"
}

variable "key_pair_name" {
  description = "The name of the existing EC2 key pair"
  type        = string
}

variable "ssh_allowed_cidr" {
  description = "The trusted public IP in CIDR notation for Bastion SSH access"
  type        = string
}

variable "root_volume_size" {
  description = "The size of the EC2 root volume in GB"
  type        = number
  default     = 20
}

# Application ports

variable "app_port" {
  description = "Backend API port"
  type        = number
  default     = 6000
}

variable "frontend_port" {
  description = "Frontend application port"
  type        = number
  default     = 4174
}

# Database

variable "db_name" {
  description = "Name of the PostgreSQL database"
  type        = string
  default     = "agrirent"
}

variable "db_username" {
  description = "Master username for the PostgreSQL database"
  type        = string
  default     = "agrirent_admin"
}

variable "db_instance_class" {
  description = "RDS database instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Allocated database storage in GB"
  type        = number
  default     = 20
}

# Private container registry

variable "ecr_repository_name" {
  description = "Name of the private ECR repository"
  type        = string
  default     = "agrirent-app"
}
