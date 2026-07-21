# 🚀 Sanna CRM

A full-featured, self-hosted Customer Relationship Management system built with modern technologies. Covers the entire customer lifecycle — from lead generation to post-sales support.

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | FastAPI (Python 3.12) |
| **Database** | PostgreSQL 16 |
| **ORM** | SQLAlchemy 2.0 (async) |
| **Migrations** | Alembic |
| **Auth** | JWT (python-jose) + bcrypt |
| **Frontend** | React 18 + TypeScript + Vite |
| **State** | Zustand |
| **Styling** | Vanilla CSS + CSS Modules |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **Containerization** | Docker + Docker Compose |
| **Reverse Proxy** | Nginx |

## Quick Start

### Prerequisites
- Docker & Docker Compose installed
- Git

### Setup

```bash
# Clone the repository
git clone <repo-url> sanna-crm
cd sanna-crm

# Copy environment file
cp .env.example .env

# Start all services
docker-compose up -d --build

# Run database migrations
docker-compose exec backend alembic upgrade head
```

### Access Points

| Service | URL |
|---|---|
| **Frontend** | http://localhost:80 |
| **Frontend (Dev)** | http://localhost:5173 |
| **Backend API** | http://localhost:8000 |
| **API Docs** | http://localhost:8000/docs |
| **Database** | localhost:5432 |

## Project Structure

```
sanna-crm/
├── docker-compose.yml          # Container orchestration
├── .env.example                # Environment variables template
├── nginx/
│   └── nginx.conf              # Reverse proxy configuration
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/                # Database migrations
│   └── app/
│       ├── main.py             # FastAPI application entry
│       ├── core/               # Config, security, database, permissions
│       ├── models/             # SQLAlchemy models
│       ├── schemas/            # Pydantic request/response schemas
│       ├── api/v1/             # API route handlers
│       ├── services/           # Business logic layer
│       └── utils/              # Helper utilities
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── components/
        │   ├── ui/             # Reusable UI components
        │   ├── layout/         # Sidebar, TopBar, Breadcrumbs
        │   └── shared/         # Domain-shared components
        ├── pages/              # Route-level pages
        ├── hooks/              # Custom React hooks
        ├── services/           # API client
        ├── stores/             # Zustand state stores
        ├── types/              # TypeScript type definitions
        ├── utils/              # Helper functions
        └── styles/             # Global CSS & design system
```

## User Roles

| Role | Description |
|---|---|
| Super Admin | Full system access including role management |
| Admin | Full access except role management |
| Sales Manager | Manage team leads, deals, quotations, view reports |
| Sales Executive | Manage own leads and deals |
| Marketing | Manage campaigns, lead sources |
| Customer Support | Manage tickets, customer communication |
| Finance | Manage invoices, payments, financial reports |

## Development

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart a service
docker-compose restart backend

# Stop all services
docker-compose down

# Stop and remove data
docker-compose down -v
```

## License

Self-hosted, open-source CRM. All technologies used are free and open-source.
