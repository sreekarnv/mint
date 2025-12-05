# Welcome to Mint Documentation

<div align="center" markdown="1">

**A production-ready, event-driven microservices wallet system featuring secure authentication, real-time transaction processing, and automated notifications.**

</div>

<p align="center">
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-22.x-green?logo=node.js" alt="Node.js"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript" alt="TypeScript"></a>
  <a href="https://www.rabbitmq.com/"><img src="https://img.shields.io/badge/RabbitMQ-Event--Driven-orange?logo=rabbitmq" alt="RabbitMQ"></a>
  <a href="https://www.mongodb.com/"><img src="https://img.shields.io/badge/MongoDB-7.x-green?logo=mongodb" alt="MongoDB"></a>
  <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-Compose-blue?logo=docker" alt="Docker"></a>
  <a href="https://github.com/sreekarnv/mint/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License"></a>
</p>

---

## Overview

Mint is a **microservices-based wallet system** built with Node.js, TypeScript, and event-driven architecture using RabbitMQ. It demonstrates production-ready patterns for building scalable, distributed systems.

### Key Features

- **🔐 Secure Authentication** - JWT with RS256 asymmetric encryption
- **💰 Real-time Wallet Management** - Event-driven balance updates
- **🔁 Robust Transaction Processing** - ACID-compliant with automatic rollback
- **📨 Smart Notifications** - Email alerts for all wallet activities
- **🔗 Production API Gateway** - NGINX with rate limiting and load balancing

---

## Quick Links

<div class="grid cards" markdown>

-   :material-clock-fast:{ .lg .middle } __Getting Started__

    ---

    Install Mint in minutes and run your first transaction

    [:octicons-arrow-right-24: Installation Guide](getting-started/installation.md)

-   :material-book-open-page-variant:{ .lg .middle } __Architecture__

    ---

    Learn about the microservices architecture and event-driven design

    [:octicons-arrow-right-24: Architecture Overview](architecture.md)

-   :material-api:{ .lg .middle } __API Reference__

    ---

    Complete API documentation for all services

    [:octicons-arrow-right-24: API Docs](api/auth.md)

-   :material-cog:{ .lg .middle } __Development__

    ---

    Set up your local development environment

    [:octicons-arrow-right-24: Developer Guide](development.md)

</div>

---

## Architecture at a Glance

```mermaid
graph TB
    Client[Client Application]
    Gateway[NGINX Gateway :80]
    Auth[Auth Service :4001]
    Wallet[Wallet Service :4003]
    Transactions[Transactions Service :4004]
    Notifications[Notifications Service :4002]
    RabbitMQ[(RabbitMQ :5672)]
    MongoDB[(MongoDB :27017)]

    Client --> Gateway
    Gateway --> Auth
    Gateway --> Wallet
    Gateway --> Transactions

    Auth --> RabbitMQ
    Transactions --> RabbitMQ
    Wallet --> RabbitMQ
    RabbitMQ --> Notifications

    Auth --> MongoDB
    Wallet --> MongoDB
    Transactions --> MongoDB

    style Gateway fill:#2196F3
    style RabbitMQ fill:#FF9800
    style MongoDB fill:#4CAF50
```

---

## Technology Stack

| Category | Technologies |
|----------|-------------|
| **Runtime** | Node.js 22.x, TypeScript 5.x |
| **Framework** | Express.js 5.x |
| **Database** | MongoDB 7.x with Mongoose |
| **Message Broker** | RabbitMQ 3.x |
| **API Gateway** | NGINX Alpine |
| **Authentication** | JWT (RS256), Argon2 |
| **Validation** | Zod |
| **Containerization** | Docker, Docker Compose |
| **Logging** | Winston, Pino |

---

## Project Highlights

### Event-Driven Architecture

All service-to-service communication happens through RabbitMQ events, ensuring:

- **Loose Coupling** - Services are independent and can be deployed separately
- **Scalability** - Easy horizontal scaling of individual services
- **Reliability** - Guaranteed message delivery with acknowledgments
- **Async Processing** - Non-blocking operations for better performance

### Security First

- **RS256 JWT Tokens** - Asymmetric encryption for enhanced security
- **JWKS Endpoint** - Public key distribution for token verification
- **HTTP-only Cookies** - Protection against XSS attacks
- **Argon2 Password Hashing** - Industry-standard password security
- **Rate Limiting** - Protection against brute force attacks

### Production Ready

- **Health Checks** - Monitor service availability
- **Error Handling** - Graceful error responses and logging
- **Docker Compose** - Simple deployment with container orchestration
- **Environment Config** - Separate configs for dev/prod environments
- **API Documentation** - Comprehensive OpenAPI-style documentation

---

## Use Cases

Mint's architecture is suitable for:

- **Portfolio Projects** - Demonstrate microservices expertise
- **Learning Platform** - Understand event-driven architecture
- **MVP Foundation** - Build fintech applications quickly
- **Interview Preparation** - Discuss system design patterns
- **Production Template** - Base for real-world wallet systems

---

## What's Next?

<div class="grid cards" markdown>

-   **Installation**

    Get Mint up and running in 5 minutes

    [Start Here :octicons-arrow-right-24:](getting-started/installation.md)

-   **Quick Start**

    Complete your first transaction flow

    [Try It :octicons-arrow-right-24:](getting-started/quick-start.md)

-   **API Reference**

    Explore all available endpoints

    [View APIs :octicons-arrow-right-24:](api/auth.md)

-   **Contributing**

    Help improve Mint

    [Contribute :octicons-arrow-right-24:](about/contributing.md)

</div>

---

## Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/sreekarnv/mint/issues)
- **Documentation**: Browse the guides in the sidebar
- **Source Code**: [View on GitHub](https://github.com/sreekarnv/mint)

---

<div align="center" markdown="1">

**Built with :heart: by [Sreekar Venkata Nutulapati](https://github.com/sreekarnv)**

[GitHub](https://github.com/sreekarnv) · [LinkedIn](https://in.linkedin.com/in/sreekar-venkata-nutulapati-63672120a)

</div>
