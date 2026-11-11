resource "aws_security_group" "app" {
    name = "${var.project_name}-${var.environment}-app-sg"
    description = "Security group for app server"
    vpc_id = aws_vpc.main.id

    ingress {
        description = "SSH access"
        from_port = 22
        to_port = 22
        protocol = "tcp"
        cidr_blocks = [var.ssh_allowed_cidr]
    }
    ingress {
        description = "application access"
        from_port = var.app_port
        to_port = var.app_port
        protocol = "tcp"
        cidr_blocks = ["0.0.0.0/0"]
    }
    egress {
        description = "Allow all outbound traffic"
        from_port = 0
        to_port = 0
        protocol = "-1"
        cidr_blocks = ["0.0.0.0/0"]
    }
    tags = {
        Name = "${var.project_name}-${var.environment}-app-sg"
        Project = var.project_name
        Environment = var.environment
    }
}