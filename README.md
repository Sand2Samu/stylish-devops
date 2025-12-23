# Stylish E-Commerce - DevOps Project

A full-stack e-commerce application for shoes, containerized with Docker and orchestrated with Kubernetes.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      AWS Cloud                               │
│  ┌─────────────┐    ┌──────────────────────────────────┐   │
│  │   AWS ECR   │    │         Amazon EKS               │   │
│  │   (Images)  │───▶│  ┌─────────┐    ┌─────────┐     │   │
│  └─────────────┘    │  │  Pod 1  │    │  Pod 2  │     │   │
│         ▲           │  └────┬────┘    └────┬────┘     │   │
│         │           │       └──────┬───────┘          │   │
│  ┌──────┴──────┐    │              ▼                  │   │
│  │   GitHub    │    │     ┌────────────────┐         │   │
│  │   Actions   │────│────▶│  LoadBalancer  │         │   │
│  │   (CI/CD)   │    │     └────────────────┘         │   │
│  └─────────────┘    └──────────────────────────────────┘   │
│                                     │                       │
│                                     ▼                       │
│                            ┌───────────────┐               │
│                            │ MongoDB Atlas │               │
│                            └───────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
stylish-1.0.0/
├── Server/                 # Node.js application
│   ├── Dockerfile          # Container definition
│   ├── index.js            # Express server
│   └── public/             # Static assets
├── k8s/                    # Kubernetes manifests
│   ├── namespace.yaml
│   ├── deployment.yaml
│   ├── service.yaml
│   └── ...
├── .github/workflows/      # CI/CD pipeline
├── docker-compose.yaml     # Local development
└── terraform/              # Infrastructure as Code
```

## 🚀 Quick Start

### Local Development (Docker Compose)

```bash
# Start application with MongoDB
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Access the application
- **URL**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

## 🔧 Technologies

| Category | Technology |
|----------|------------|
| Runtime | Node.js 18 |
| Framework | Express.js 5 |
| Database | MongoDB |
| Container | Docker |
| Orchestration | Kubernetes |
| CI/CD | GitHub Actions |
| Cloud | AWS (ECR, EKS) |

## 📋 Prerequisites

- Docker Desktop
- kubectl CLI
- AWS CLI (configured)
- Node.js 18+

## 🔐 Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT tokens |
| `PORT` | Application port (default: 3000) |
| `NODE_ENV` | Environment (development/production) |

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Main application |
| GET | `/health` | Liveness probe |
| GET | `/ready` | Readiness probe |
| POST | `/api/users/register` | User registration |
| POST | `/api/users/login` | User login |
| POST | `/api/purchases/record` | Record purchase |

## 👥 Team

- [Your Name] - Developer

## 📄 License

ISC
