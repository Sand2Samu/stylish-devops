# Deployment Guide

Complete step-by-step guide to deploy the Stylish e-commerce application.

## Prerequisites Checklist

- [ ] AWS Account created
- [ ] AWS CLI installed and configured
- [ ] Docker Desktop installed and running
- [ ] kubectl CLI installed
- [ ] GitHub account with repository created

---

## Step 1: Install kubectl (Windows)

```powershell
# Option 1: Using Chocolatey
choco install kubernetes-cli

# Option 2: Direct download
curl.exe -LO "https://dl.k8s.io/release/v1.28.0/bin/windows/amd64/kubectl.exe"
mkdir C:\kubectl
move kubectl.exe C:\kubectl\
# Add C:\kubectl to PATH

# Verify
kubectl version --client
```

---

## Step 2: Configure AWS CLI

```powershell
# Install AWS CLI (if not already)
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi

# Configure credentials
aws configure
# Enter: Access Key, Secret Key, Region (us-east-1), Output (json)
```

---

## Step 3: Test Locally with Docker Compose

```powershell
cd "c:\Users\ranas\Documents\Adbms\Adbms Project\stylish-1.0.0\stylish-1.0.0"

# Build and start containers
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f stylish-app

# Test health endpoint
curl http://localhost:3000/health

# Stop when done testing
docker-compose down
```

---

## Step 4: Create AWS ECR Repository

```powershell
# Set variables
$AWS_REGION = "us-east-1"
$ECR_REPO = "stylish-app"

# Create ECR repository
aws ecr create-repository --repository-name $ECR_REPO --region $AWS_REGION

# Get login command and login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin (aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com
```

---

## Step 5: Build and Push Docker Image

```powershell
cd "c:\Users\ranas\Documents\Adbms\Adbms Project\stylish-1.0.0\stylish-1.0.0\Server"

# Get your AWS account ID
$ACCOUNT_ID = aws sts get-caller-identity --query Account --output text
$AWS_REGION = "us-east-1"
$IMAGE_URI = "$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/stylish-app"

# Build image
docker build -t stylish-app .

# Tag for ECR
docker tag stylish-app:latest ${IMAGE_URI}:latest

# Push to ECR
docker push ${IMAGE_URI}:latest

echo "Image pushed to: $IMAGE_URI"
```

---

## Step 6: Create EKS Cluster

### Option A: Using AWS Console (Easier for beginners)

1. Go to AWS Console → EKS
2. Click "Create Cluster"
3. Name: `stylish-cluster`
4. Kubernetes version: 1.28
5. Create and assign IAM role for EKS
6. Select VPC and subnets
7. Create cluster (takes ~15 minutes)
8. Add Node Group with t3.small instances

### Option B: Using eksctl (Command Line)

```powershell
# Install eksctl
choco install eksctl

# Create cluster
eksctl create cluster `
  --name stylish-cluster `
  --region us-east-1 `
  --nodegroup-name stylish-nodes `
  --node-type t3.small `
  --nodes 2 `
  --nodes-min 1 `
  --nodes-max 3

# This takes 15-20 minutes
```

---

## Step 7: Configure kubectl for EKS

```powershell
aws eks update-kubeconfig --name stylish-cluster --region us-east-1

# Verify connection
kubectl get nodes
```

---

## Step 8: Set Up MongoDB Atlas

1. Go to https://www.mongodb.com/atlas
2. Create free cluster (M0 tier)
3. Create database user
4. Whitelist IP addresses (or use 0.0.0.0/0 for demo)
5. Get connection string
6. Update the k8s/secret.yaml with base64 encoded connection string:

```powershell
# Encode your MongoDB URI
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("mongodb+srv://user:pass@cluster.mongodb.net/stylish"))
```

---

## Step 9: Update Kubernetes Secrets

Edit `k8s/secret.yaml` with your actual values:

```powershell
# Encode your values
$MONGO_URI = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("your-mongodb-atlas-uri"))
$JWT_SECRET = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("your-secure-jwt-secret"))

echo "MONGODB_URI: $MONGO_URI"
echo "JWT_SECRET: $JWT_SECRET"
```

---

## Step 10: Update Deployment with ECR Image

Edit `k8s/deployment.yaml` line 27:

```yaml
image: YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/stylish-app:latest
```

---

## Step 11: Deploy to Kubernetes

```powershell
cd "c:\Users\ranas\Documents\Adbms\Adbms Project\stylish-1.0.0\stylish-1.0.0"

# Apply all manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/hpa.yaml

# Check deployment status
kubectl get pods -n stylish
kubectl get svc -n stylish

# Get the LoadBalancer URL
kubectl get svc stylish-service -n stylish -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

---

## Step 12: Set Up GitHub Actions Secrets

In your GitHub repository, go to Settings → Secrets → Actions, and add:

| Secret Name | Value |
|-------------|-------|
| `AWS_ACCESS_KEY_ID` | Your AWS access key |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret key |

---

## Step 13: Push to GitHub to Trigger CI/CD

```powershell
cd "c:\Users\ranas\Documents\Adbms\Adbms Project\stylish-1.0.0\stylish-1.0.0"

git init
git add .
git commit -m "Initial DevOps setup"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/stylish-devops.git
git push -u origin main
```

---

## Step 14: Deploy Lambda Function (Optional)

```powershell
cd lambda/order-notification

# Install dependencies
npm install

# Zip for upload
Compress-Archive -Path * -DestinationPath function.zip

# Create Lambda function via AWS Console or CLI
aws lambda create-function `
  --function-name stylish-order-notification `
  --runtime nodejs18.x `
  --handler index.handler `
  --zip-file fileb://function.zip `
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-ses-role
```

---

## Verification

1. **Access Application**: Visit the LoadBalancer URL
2. **Register/Login**: Test user authentication
3. **Health Check**: `curl http://LOADBALANCER_URL/health`
4. **View Pods**: `kubectl get pods -n stylish`
5. **View Logs**: `kubectl logs -f deployment/stylish-app -n stylish`

---

## Cleanup (To Avoid AWS Charges)

```powershell
# Delete Kubernetes resources
kubectl delete -f k8s/

# Delete EKS cluster
eksctl delete cluster --name stylish-cluster --region us-east-1

# Delete ECR images
aws ecr delete-repository --repository-name stylish-app --force

# Delete Lambda
aws lambda delete-function --function-name stylish-order-notification
```

---

## Troubleshooting

### Pods not starting
```powershell
kubectl describe pod POD_NAME -n stylish
kubectl logs POD_NAME -n stylish
```

### Can't connect to MongoDB
- Check if IP is whitelisted in MongoDB Atlas
- Verify connection string in secrets

### LoadBalancer stuck in pending
- Check if your EKS cluster has proper VPC/subnet configuration
- Ensure AWS Load Balancer Controller is installed
