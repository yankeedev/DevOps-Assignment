output "vpc_id" {
    description = "ID of the VPC."
    value       = aws_vpc.main.id
}

output "public_subnet_id" {
    description = "ID of the public subnet."
    value       = aws_subnet.public.id
}

output "app_security_group_id" {
    description = "ID of the application security group."
    value       = aws_security_group.app.id
}

output "instance_id" {
    description = "ID of the EC2 instance."
    value       = aws_instance.app.id
}

output "instance_public_ip" {
    description = "Public IPv4 address of the EC2 instance."
    value       = aws_instance.app.public_ip
}

output "instance_private_ip" {
    description = "Private IPv4 address of the EC2 instance."
    value       = aws_instance.app.private_ip
}

output "application_url" {
    description = "HTTP URL for the application."
    value       = "http://${aws_instance.app.public_ip}:${var.app_port}"
}
