# Prerequisites Setup Guide

## 1. Install kubectl CLI (Windows)

### Option A: Using Chocolatey (Recommended)
```powershell
choco install kubernetes-cli
```

### Option B: Direct Download
```powershell
# Download kubectl
curl.exe -LO "https://dl.k8s.io/release/v1.28.0/bin/windows/amd64/kubectl.exe"

# Move to a folder in your PATH (e.g., C:\kubectl)
mkdir C:\kubectl
move kubectl.exe C:\kubectl\

# Add to PATH (run as Administrator)
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\kubectl", "Machine")
```

### Verify Installation
```powershell
kubectl version --client
```

---

## 2. AWS Account Setup

### Step 1: Create AWS Account
1. Go to https://aws.amazon.com/
2. Click "Create an AWS Account"
3. Enter email, password, and account name
4. Choose "Personal" account type
5. Enter payment method (won't be charged for Free Tier)
6. Complete phone verification
7. Select "Basic Support - Free"

### Step 2: Install AWS CLI
```powershell
# Using MSI Installer (easiest)
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi

# Verify installation
aws --version
```

### Step 3: Configure AWS CLI
```powershell
aws configure
```
Enter:
- AWS Access Key ID: (from IAM console)
- AWS Secret Access Key: (from IAM console)  
- Default region: us-east-1
- Output format: json

### Step 4: Create IAM User for CLI Access
1. Go to AWS Console → IAM → Users
2. Click "Create user"
3. Username: `devops-cli-user`
4. Check "Access key - Programmatic access"
5. Attach policies:
   - `AmazonEC2ContainerRegistryFullAccess`
   - `AmazonEKSClusterPolicy`
   - `AmazonEKSWorkerNodePolicy`
   - `AWSLambda_FullAccess`
   - `AmazonSESFullAccess`
6. Download credentials CSV

---

## 3. Enable Kubernetes in Docker Desktop

1. Open Docker Desktop
2. Go to Settings (gear icon)
3. Click "Kubernetes" in the left menu
4. Check "Enable Kubernetes"
5. Click "Apply & Restart"
6. Wait for Kubernetes to start (green status)

### Verify Docker Desktop Kubernetes
```powershell
kubectl config use-context docker-desktop
kubectl get nodes
```

---

## Quick Checklist

- [ ] kubectl installed and working
- [ ] AWS Account created
- [ ] AWS CLI installed
- [ ] AWS CLI configured with credentials
- [ ] Docker Desktop Kubernetes enabled
