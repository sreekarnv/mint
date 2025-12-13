<div align="center">

# Mint - Event-Driven Wallet Microservices


[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-Event--Driven-orange?logo=rabbitmq)](https://www.rabbitmq.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x-green?logo=mongodb)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue?logo=docker)](https://www.docker.com/)
[![Documentation](https://img.shields.io/badge/docs-online-brightgreen?logo=readthedocs)](https://sreekarnv.github.io/mint/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**A production-ready, event-driven microservices wallet system featuring secure authentication, real-time transaction processing, and automated notifications.**

[**📖 Documentation**](https://sreekarnv.github.io/mint/) • [API Reference](https://sreekarnv.github.io/mint/api/auth/) • [Quick Start](#-quick-start) • [Architecture](#-architecture)

</div>

---

## Overview

Mint is a modern wallet platform built with microservices architecture and event-driven communication. It demonstrates production-ready patterns including JWT authentication, distributed transactions, message queuing, and API gateway design.

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
  <a href="https://www.nginx.com/" target="_blank">
    <img src="https://img.shields.io/badge/NGINX-009639?style=for-the-badge&logo=nginx&logoColor=white" />
  </a>
  <a href="https://www.docker.com/" target="_blank">
    <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
  </a>
</p>



---

## Features

- **🔐 Secure Authentication**: JWT (RS256) with JWKS, Argon2 password hashing, HTTP-only cookies
- **💰 Wallet Management**: Event-driven wallet creation, real-time balance updates, transaction history
- **🔁 Transaction Processing**: Top-ups and transfers with PENDING → PROCESSING → COMPLETED/FAILED states
- **📨 Smart Notifications**: Automated emails for signups and transactions via RabbitMQ consumers
- **🔗 API Gateway**: NGINX reverse proxy with rate limiting, health checks, and load balancing
- **🏗️ Microservices Design**: Independent services, database-per-service pattern, horizontal scalability

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     NGINX API Gateway (Port 80)                  │
│                  Rate Limiting │ Load Balancing                  │
└─────────────────────────────────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
    ┌────▼────┐          ┌──────▼───────┐      ┌───────▼────────┐
    │  Auth   │          │  Wallet      │      │ Transactions   │
    │ Service │          │  Service     │      │   Service      │
    │:4001    │          │  :4003       │      │   :4004        │
    └────┬────┘          └──────┬───────┘      └───────┬────────┘
         │                      │                      │
         │    ┌─────────────────┼──────────────────────┤
         │    │                 │                      │
    ┌────▼────▼─────────────────▼──────────────────────▼────────┐
    │              RabbitMQ Message Broker (:5672)               │
    │         Exchanges: auth.events, transaction.events         │
    └───────────────────────────┬────────────────────────────────┘
                                │
                        ┌───────▼────────┐
                        │ Notifications  │
                        │    Service     │
                        │    :4002       │
                        └────────────────┘

         ┌──────────────────────────────────────────┐
         │    MongoDB (Port 27017)                  │
         │  - auth_db (Users)                       │
         │  - wallet_db (Wallets)                   │
         │  - transactions_db (Transactions)        │
         └──────────────────────────────────────────┘
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
- RabbitMQ Management: http://localhost:15672 (guest/guest)
- MongoDB: mongodb://localhost:27017

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
