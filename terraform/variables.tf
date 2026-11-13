variable "project_name" {
  description = "The name of the project"
  type        = string
  default     = "DevOpds-Assignment"
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

variable "vpc_cidr" {
  description = "The CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for the public subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "ami_id" {
  description = "The AMI ID for the EC2 instance"
  type        = string
}

variable "instance_type" {
  description = "The EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "key_pair_name" {
  description = "The name of the existing EC2 key pair"
  type        = string
}

variable "ssh_allowed_cidr" {
  description = "The trusted public IP in CIDR notation for SSH access"
  type        = string
}


variable "root_volume_size" {
  description = "The size of the root volume in GB"
  type        = number
  default     = 20
}
