# VPC

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

# SUBNETS

output "public_subnet_a_id" {
  description = "ID of the first public subnet"
  value       = aws_subnet.public_a.id
}

output "public_subnet_b_id" {
  description = "ID of the second public subnet"
  value       = aws_subnet.public_b.id
}

output "private_subnet_a_id" {
  description = "ID of the first private subnet"
  value       = aws_subnet.private_a.id
}

output "private_subnet_b_id" {
  description = "ID of the second private subnet"
  value       = aws_subnet.private_b.id
}

# SECURITY GROUPS

output "app_security_group_id" {
  description = "ID of the application security group"
  value       = aws_security_group.app.id
}

output "bastion_security_group_id" {
  description = "ID of the Bastion security group"
  value       = aws_security_group.bastion.id
}

output "database_security_group_id" {
  description = "ID of the database security group"
  value       = aws_security_group.database.id
}

# EC2 INSTANCES

output "bastion_instance_id" {
  description = "ID of the Bastion EC2 instance"
  value       = aws_instance.bastion.id
}

output "bastion_public_ip" {
  description = "Public IP address of the Bastion Host"
  value       = aws_instance.bastion.public_ip
}

output "app_instance_id" {
  description = "ID of the private application EC2 instance"
  value       = aws_instance.app.id
}

output "app_instance_private_ip" {
  description = "Private IP address of the application EC2 instance"
  value       = aws_instance.app.private_ip
}

# APPLICATION LOAD BALANCER

output "load_balancer_dns" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.app.dns_name
}

output "application_url" {
  description = "Public HTTP URL for the application"
  value       = "http://${aws_lb.app.dns_name}"
}

# DATABASE

output "database_endpoint" {
  description = "Private RDS database endpoint"
  value       = aws_db_instance.database.endpoint
}

output "database_secret_arn" {
  description = "ARN of the AWS-managed database credentials secret"
  value       = aws_db_instance.database.master_user_secret[0].secret_arn
}

# CONTAINER REGISTRY

output "ecr_repository_url" {
  description = "Private ECR repository URL"
  value       = aws_ecr_repository.app.repository_url
}
