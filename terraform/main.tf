resource "aws_instance" "app" {
    ami = "ami-12345678"
    instance_type = var.instance_type
    subnet_id = aws_subnet.public.id
    vpc_security_group_ids = [aws_security_group.app.id]
    key_name = var.key_pair_name
    associate_public_ip_address = true

    root_block_device {
        volume_size = var.root_volume_size
        volume_type = "gp3"
        encrypted = true
        delete_on_termination = true
    }

    user_data = <<-USER_DATA
        #!/bin/bash
            set -eux
            apt-get update
            apt-get install -y docker.io
            systemctl enable --now docker
            docker pull ${var.app_image}
            docker run -d \
                --name application \
                --restart unless-stopped \
                -p ${var.app_port}:${var.container_port} \
                ${var.app_image}
    user_data_replace_on_change = true
    tags = {
        Name = "${var.project_name}-${var.environment}-app-instance"
        Project = var.project_name
        Environment = var.environment
    }
}