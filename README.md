<div align="center">

# Mint - Event-Driven Wallet Microservices


[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-Event--Driven-orange?logo=rabbitmq)](https://www.rabbitmq.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x-green?logo=mongodb)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue?logo=docker)](https://www.docker.com/)
[![React](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Tests](https://img.shields.io/badge/Tests-Vitest-yellow?logo=vitest)](https://vitest.dev/)
[![Documentation](https://img.shields.io/badge/docs-online-brightgreen?logo=readthedocs)](https://sreekarnv.github.io/mint/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**A production-ready, event-driven microservices wallet system featuring secure authentication, real-time transaction processing, and automated notifications.**

[**📖 Documentation**](https://sreekarnv.github.io/mint/) • [API Reference](https://sreekarnv.github.io/mint/api/auth/) • [Quick Start](#-quick-start) • [Architecture](#-architecture)

</div>


---

## Overview

Mint is a modern wallet platform built with microservices architecture and event-driven communication. It demonstrates production-ready patterns including JWT authentication, distributed transactions, message queuing, and API gateway design.

![Dashboard](docs/assets/dashboard.png)
---

## 🛠️ Tech Stack

<p align="left">
  <a href="https://nodejs.org/" target="_blank">
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  </a>
  <a href="https://expressjs.com/" target="_blank">
    <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" />
  </a>
  <a href="https://www.typescriptlang.org/" target="_blank">
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  </a>
  <a href="https://www.mongodb.com/" target="_blank">
    <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  </a>
  <a href="https://www.rabbitmq.com/" target="_blank">
    <img src="https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white" />
  </a>
  <a href="https://redis.io/" target="_blank">
    <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  </a>
  <a href="https://www.nginx.com/" target="_blank">
    <img src="https://img.shields.io/badge/NGINX-009639?style=for-the-badge&logo=nginx&logoColor=white" />
  </a>
  <a href="https://prometheus.io/" target="_blank">
    <img src="https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=prometheus&logoColor=white" />
  </a>
  <a href="https://grafana.com/" target="_blank">
    <img src="https://img.shields.io/badge/Grafana-F46800?style=for-the-badge&logo=grafana&logoColor=white" />
  </a>
  <a href="https://www.docker.com/" target="_blank">
    <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
  </a>
  <a href="https://reactjs.org/" target="_blank">
    <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  </a>
</p>



---

## Features

- **🔐 Secure Authentication**: JWT (RS256) with JWKS, Argon2 password hashing, HTTP-only cookies
- **💰 Wallet Management**: Event-driven wallet creation, real-time balance updates, transaction history
- **🔁 Transaction Processing**: Top-ups and transfers with PENDING → PROCESSING → COMPLETED/FAILED states
- **📨 Smart Notifications**: Automated emails for signups and transactions via RabbitMQ consumers
- **⚡ Redis Caching**: Cache-aside pattern with 80-90% hit rates for frequently accessed data
- **📊 Observability**: Prometheus metrics + Grafana dashboards for real-time monitoring
- **📝 API Documentation**: OpenAPI/Swagger documentation for all endpoints
- **🔗 API Gateway**: NGINX reverse proxy with rate limiting, health checks, and load balancing
- **🏗️ Microservices Design**: Independent services, database-per-service pattern, horizontal scalability
- **✅ Comprehensive Testing**: 112 tests with unit, integration, and consumer coverage

---

## Architecture

```mermaid
  flowchart TB
    %% =========================
    %% API GATEWAY
    %% =========================
    subgraph Gateway["🌐 API Gateway"]
        NGINX["NGINX<br/>:80<br/><small>Rate Limiting · Load Balancing</small>"]
    end

    %% =========================
    %% CORE SERVICES
    %% =========================
    subgraph Services["🧩 Core Services"]
        AUTH["🔐 Auth<br/>:4001"]
        WALLET["💰 Wallet<br/>:4003"]
        TXN["💳 Transactions<br/>:4004"]
        NOTIF["🔔 Notifications<br/>:4002"]
    end

    %% =========================
    %% DATA & MESSAGING
    %% =========================
    subgraph Infra["🗄️ Data & Messaging"]
        REDIS[(⚡ Redis<br/>:6379)]
        RABBIT["📨 RabbitMQ<br/>:5672<br/><small>auth.events · transaction.events</small>"]
        MONGO[(🗃️ MongoDB<br/>:27017<br/><small>auth · wallet · transactions</small>)]
    end

    %% =========================
    %% OBSERVABILITY
    %% =========================
    subgraph Observability["📊 Observability"]
        PROM["📈 Prometheus<br/>:9090"]
        GRAF["📊 Grafana<br/>:3000"]
        LOKI["📝 Loki<br/>:3100"]
        ALLOY["🔄 Alloy<br/><small>Log Collector</small>"]
    end

    %% =========================
    %% TRAFFIC FLOW
    %% =========================
    NGINX --> AUTH
    NGINX --> WALLET
    NGINX --> TXN

    %% =========================
    %% CACHE
    %% =========================
    AUTH <--> |cache| REDIS
    WALLET <--> |cache| REDIS
    TXN <--> |cache| REDIS

    %% =========================
    %% ASYNC EVENTS
    %% =========================
    AUTH --> |auth.events| RABBIT
    WALLET --> |wallet.events| RABBIT
    TXN --> |transaction.events| RABBIT
    RABBIT --> |consume| NOTIF

    %% =========================
    %% DATABASE
    %% =========================
    AUTH --> |users| MONGO
    WALLET --> |wallets| MONGO
    TXN --> |transactions| MONGO

    %% =========================
    %% METRICS
    %% =========================
    AUTH --> |/metrics| PROM
    WALLET --> |/metrics| PROM
    TXN --> |/metrics| PROM
    NOTIF --> |/metrics| PROM
    PROM --> GRAF

    %% =========================
    %% LOGS
    %% =========================
    AUTH --> |logs| ALLOY
    WALLET --> |logs| ALLOY
    TXN --> |logs| ALLOY
    NOTIF --> |logs| ALLOY
    ALLOY --> LOKI
    LOKI --> GRAF

```

**Communication Patterns**:
- **Client → Services**: HTTP/REST via NGINX Gateway
- **Service → Service**: Asynchronous events via RabbitMQ
- **Event Flow**: No direct service-to-service HTTP calls

📖 [Detailed Architecture Guide](https://sreekarnv.github.io/mint/architecture/) • [Event Flows](https://sreekarnv.github.io/mint/events/)

---

## Quick Start

### Prerequisites

- Docker (v20.10+) & Docker Compose (v2.0+)
- Git

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/sreekarnv/mint.git
cd mint

# 2. Set up environment files
cp auth/.env.example auth/.env.docker
cp wallet/.env.example wallet/.env.docker
cp transactions/.env.example transactions/.env.docker
cp notifications/.env.example notifications/.env.docker

# 3. Generate RSA keys for JWT
cd auth/keys
openssl genrsa -out private_key.pem 2048
openssl rsa -in private_key.pem -pubout -out public_key.pem
cd ../..

# 4. Start all services
docker compose up --build
```

### Verify Installation

```bash
# Check gateway health
curl http://localhost/health

# View running services
docker compose ps
```

**Access Points**:
- API Gateway: http://localhost
- Swagger Documentation: http://localhost/api-docs (Auth service)
- RabbitMQ Management: http://localhost:15672 (guest/guest)
- Prometheus Metrics: http://localhost:9090
- Grafana Dashboards: http://localhost:3000 (admin/admin)
- Loki Logs: http://localhost:3100 (via Grafana)
- MongoDB: mongodb://localhost:27017
- Redis: redis://localhost:6379

📖 [Detailed Setup Guide](https://sreekarnv.github.io/mint/getting-started/installation/) • [Configuration](https://sreekarnv.github.io/mint/getting-started/configuration/)

---

## Services

| Service | Port | Description | Documentation |
|---------|------|-------------|---------------|
| **Auth** | 4001 | User authentication, JWT, JWKS, user management | [Docs](https://sreekarnv.github.io/mint/services/auth/) |
| **Wallet** | 4003 | Wallet creation, balance management, event consumers | [Docs](https://sreekarnv.github.io/mint/services/wallet/) |
| **Transactions** | 4004 | Top-ups, transfers, transaction orchestration | [Docs](https://sreekarnv.github.io/mint/services/transactions/) |
| **Notifications** | 4002 | Email notifications via RabbitMQ events | [Docs](https://sreekarnv.github.io/mint/services/notifications/) |
| **API Gateway** | 80 | NGINX reverse proxy, rate limiting, routing | [Docs](https://sreekarnv.github.io/mint/architecture/#api-gateway) |

📖 [API Reference](https://sreekarnv.github.io/mint/api/auth/) • [Service Details](https://sreekarnv.github.io/mint/services/auth/)

---

## API Examples

### Authentication

```bash
# Register
curl -X POST http://localhost/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "password": "SecurePass123!"}'

# Login
curl -X POST http://localhost/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "password": "SecurePass123!"}' \
  -c cookies.txt
```

### Transactions

```bash
# Top-up wallet
curl -X POST http://localhost/api/v1/transactions/topup \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"amount": 100.00, "description": "Adding funds"}'

# Transfer funds
curl -X POST http://localhost/api/v1/transactions/transfer \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"recipientId": "507f1f77bcf86cd799439011", "amount": 50.00, "description": "Payment"}'
```

📖 [Complete API Documentation](https://sreekarnv.github.io/mint/api/auth/)

---

## Development

```bash
# Run in development mode with hot-reload
docker compose -f docker-compose.dev.yml up --build

# View logs for a specific service
docker compose logs -f auth

# Access MongoDB
docker exec -it mint-mongodb mongosh -u root -p example

# Access RabbitMQ UI
open http://localhost:15672
```

📖 [Development Guide](https://sreekarnv.github.io/mint/development/) • [Troubleshooting](https://sreekarnv.github.io/mint/troubleshooting/)

---

## Testing

Mint includes comprehensive test coverage (112 tests) using Vitest, Supertest, and MongoDB Memory Server.

```bash
# Run all tests across all services
pnpm test

# Run tests for a specific service
pnpm test:auth
pnpm test:wallet
pnpm test:transactions
pnpm test:notifications

# Run tests in watch mode
pnpm test:watch

# Generate coverage reports
pnpm test:coverage
```

**Test Types**:
- **Unit Tests**: Service logic, models, utilities (59 tests)
- **Integration Tests**: API endpoints with Supertest (45 tests)
- **Consumer Tests**: RabbitMQ event handlers (8 tests)
- **Mock Tests**: External dependencies (RabbitMQ, email)

**Coverage Metrics**:
- **Auth**: 35 tests, 59.31% coverage
- **Wallet**: 20 tests, 50.25% coverage
- **Transactions**: 44 tests, 63.41% coverage
- **Notifications**: 13 tests, 15.91% coverage

All tests passing | CI/CD integrated

📖 [Testing Guide](https://sreekarnv.github.io/mint/testing/)

---

## Project Structure

```
mint/
├── auth/              # Authentication Service
├── wallet/            # Wallet Service
├── transactions/      # Transactions Service
├── notifications/     # Notifications Service
├── nginx/             # API Gateway Configuration
├── docs/              # Documentation (MkDocs)
├── docker-compose.yml # Production setup
└── docker-compose.dev.yml # Development setup
```

---

## 📊 Monitoring & Observability

Mint includes a complete observability stack with Prometheus and Grafana for real-time monitoring and alerting.

<div align="center">
  <img src="docs/assets/grafana-dashboard.png" alt="Grafana Dashboard" width="800"/>
  <p><em>Real-time Grafana dashboard showing service metrics, cache performance, and system health</em></p>
</div>

**Metrics Collected**:
- **HTTP Metrics**: Request duration, total requests, active connections, status codes
- **Database Metrics**: Query duration by operation and collection, connection pool stats
- **Cache Metrics**: Hit/miss rates, cache errors, performance by key prefix
- **Transaction Metrics**: Transaction counts by type/status, amount distribution
- **RabbitMQ Metrics**: Message rates, queue depths, consumer lag
- **System Metrics**: CPU, memory, network I/O (via Node.js)

**Access Monitoring**:
```bash
# Prometheus metrics
curl http://localhost:9090

# Grafana dashboards
open http://localhost:3000
# Login: admin/admin
```

**Key Performance Indicators**:
- Cache Hit Rate: **80-90%** for user data and transactions
- API Response Time: **p95 < 100ms**, p99 < 200ms
- Transaction Processing: **<2s** end-to-end latency
- Service Uptime: **99.9%+** availability

📖 [Monitoring Guide](https://sreekarnv.github.io/mint/monitoring/)

---

## 📝 Centralized Logging

Mint implements structured logging with **Loki** for log aggregation and **Grafana Alloy** for log collection, providing centralized log management across all microservices.

<div align="center">
  <img src="docs/assets/loki-logs.png" alt="Loki Logs in Grafana" width="800"/>
  <p><em>Real-time log aggregation in Grafana with Loki, showing structured JSON logs with filtering and search capabilities</em></p>
</div>

**Logging Stack**:
- **Winston**: Structured JSON logging in all services
- **Grafana Alloy**: Log collection and forwarding agent
- **Loki**: Log aggregation and storage
- **Grafana**: Log visualization and querying

**Log Features**:
- **Structured Logging**: JSON format with consistent fields across services
- **Log Levels**: error, warn, info, debug with appropriate filtering
- **Contextual Information**: Service name, version, timestamp, request ID
- **Centralized Aggregation**: All service logs in one place
- **Advanced Filtering**: By service, level, time range, and custom fields
- **Log Retention**: Configurable retention policies

**Querying Logs**:
```bash
# View logs in Grafana
open http://localhost:3000

# Navigate to Explore → Select Loki data source

# Sample LogQL queries:
# All logs from auth service
{service="@mint/auth"}

# Error logs from all services
{level="error"}

# Logs for specific user action
{service="@mint/auth"} |= "login" | json

# Logs in last 5 minutes
{service="@mint/transactions"} [5m]
```

**Log Structure**:
```json
{
  "level": "info",
  "message": "User login successful",
  "service": "@mint/auth",
  "version": "0.0.1",
  "timestamp": "2025-12-31T12:00:00.000Z",
  "userId": "507f1f77bcf86cd799439011",
  "method": "POST",
  "url": "/api/v1/auth/login"
}
```

📖 [Logging Guide](https://sreekarnv.github.io/mint/monitoring/#logging)

---

## Documentation

Comprehensive documentation is available at **[sreekarnv.github.io/mint](https://sreekarnv.github.io/mint/)**

**Quick Links**:
- [Installation Guide](https://sreekarnv.github.io/mint/getting-started/installation/)
- [Architecture Overview](https://sreekarnv.github.io/mint/architecture/)
- [Event Flows](https://sreekarnv.github.io/mint/events/)
- [API Reference](https://sreekarnv.github.io/mint/api/auth/)
- [Service Documentation](https://sreekarnv.github.io/mint/services/auth/)
- [Troubleshooting](https://sreekarnv.github.io/mint/troubleshooting/)
- [Contributing Guide](https://sreekarnv.github.io/mint/about/contributing/)

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Author

**Sreekar Venkata Nutulapati**

[![GitHub](https://img.shields.io/badge/GitHub-sreekarnv-181717?logo=github)](https://github.com/sreekarnv)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-sreekarnv-0077B5?logo=linkedin)](https://in.linkedin.com/in/sreekar-venkata-nutulapati-63672120a)

---

<div align="center">

**Built with TypeScript, Node.js, RabbitMQ, MongoDB, and Docker**

⭐ Star this repository if you find it helpful!

</div>
