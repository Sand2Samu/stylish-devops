# ECR Repository for Docker Images

resource "aws_ecr_repository" "stylish" {
  name                 = "${var.project_name}-app"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name = "${var.project_name}-ecr"
  }
}

# Lifecycle policy to clean up old images
resource "aws_ecr_lifecycle_policy" "stylish" {
  repository = aws_ecr_repository.stylish.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus     = "any"
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# Output the ECR repository URL
output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = aws_ecr_repository.stylish.repository_url
}
