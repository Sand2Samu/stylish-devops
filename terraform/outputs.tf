# Outputs for the infrastructure

output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

output "account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "ecr_login_command" {
  description = "Command to login to ECR"
  value       = "aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com"
}

output "docker_push_command" {
  description = "Command to push image to ECR"
  value       = "docker tag stylish-app:latest ${aws_ecr_repository.stylish.repository_url}:latest && docker push ${aws_ecr_repository.stylish.repository_url}:latest"
}
