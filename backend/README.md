# InvestiGate API

Backend API for the InvestiGate investigation management platform.

## 🚀 Features

- **Authentication**: JWT-based auth with access/refresh tokens
- **User Management**: CRUD with role-based access control
- **Organization Management**: Multi-tenant support
- **Case Management**: Full case lifecycle
- **Money Flow Graph**: Nodes and edges for visualization

## 📋 Tech Stack

- **Framework**: FastAPI
- **Database**: Azure SQL (via SQLAlchemy)
- **Auth**: JWT (python-jose)
- **Validation**: Pydantic
- **Server**: Uvicorn/Gunicorn

## 🏗️ Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app
│   ├── config.py            # Settings
│   ├── database.py          # SQLAlchemy
│   ├── models/              # Database models
│   │   ├── user.py
│   │   ├── organization.py
│   │   ├── case.py
│   │   └── money_flow.py
│   ├── schemas/             # Pydantic schemas
│   ├── routers/             # API endpoints
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── organizations.py
│   │   ├── cases.py
│   │   └── money_flow.py
│   └── utils/
│       └── security.py      # JWT, password
├── requirements.txt
├── .env.example
├── Dockerfile
├── startup.sh
└── README.md
```

## 🔧 Setup

### Prerequisites

- Python 3.11+
- Azure SQL Database
- ODBC Driver 18 for SQL Server

### Local Development

```bash
# Clone and navigate
cd investigates/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
.\venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env with your database credentials

# Run development server
uvicorn app.main:app --reload --port 8000
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_SERVER` | Azure SQL server | - |
| `DB_NAME` | Database name | investigates |
| `DB_USER` | Database user | - |
| `DB_PASSWORD` | Database password | - |
| `JWT_SECRET_KEY` | JWT signing key | - |
| `CORS_ORIGINS` | Allowed origins | localhost |

## 📚 API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Main Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/register` | Register |
| POST | `/api/v1/auth/refresh` | Refresh token |
| GET | `/api/v1/users` | List users |
| GET | `/api/v1/organizations` | List organizations |
| GET | `/api/v1/cases` | List cases |
| GET | `/api/v1/cases/{id}/money-flow` | Get money flow graph |

## 🔐 User Roles

| Role | Permissions |
|------|-------------|
| `super_admin` | Full system access |
| `org_admin` | Organization management |
| `investigator` | Create/edit cases |
| `analyst` | Analyze data (read-only cases) |
| `viewer` | Read-only access |

## 🐳 Docker

```bash
# Build image
docker build -t investigates-api .

# Run container
docker run -d -p 8000:8000 --env-file .env investigates-api
```

## ☁️ Azure Deployment

### Option 1: Azure App Service (Container)

1. Push to Azure Container Registry
2. Create App Service with container
3. Configure environment variables
4. Set startup command: `./startup.sh`

### Option 2: Azure App Service (Code)

1. Create App Service (Python 3.12)
2. Configure deployment from GitHub
3. Set startup command: `gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker`

## 📝 Database Schema

```sql
-- Organizations table
CREATE TABLE organizations (...)

-- Users table (references organizations)
CREATE TABLE users (...)

-- Cases table (references organizations, users)
CREATE TABLE cases (...)

-- Money flow nodes (references cases)
CREATE TABLE money_flow_nodes (...)

-- Money flow edges (references cases, nodes)
CREATE TABLE money_flow_edges (...)
```

## 🧪 Testing

```bash
# Run tests
pytest

# With coverage
pytest --cov=app
```

## 📄 License

Copyright © 2024 InvestiGate
