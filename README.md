# 🚀 Mint – Modern Fintech Microservices Platform

**Mint** is a modern fintech backend built with microservices architecture, focusing on **wallet management, transactions, and secure authentication.**

Built as a resume and portfolio project demonstrating:
- Event-driven architecture
- Microservices best practices

---

## 📚 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Security](#-security)
- [Services Overview](#-services-overview)
- [API Gateway](#-api-gateway)
- [Running Locally](#-running-locally)
- [Future Improvements](#-future-improvements)
- [API Testing with Bruno](#-api-testing-with-bruno)

---

## ✨ Features

✅ Secure JWT authentication using RS256 keys  
✅ Individual microservices:
- Auth Service
- Wallet Service
- Transaction Service

✅ Event-driven architecture via RabbitMQ  
✅ Dockerized infrastructure with no unnecessary exposed ports  
✅ Express Gateway as API Gateway with:
- Proxy routing
- Rate limiting

✅ MongoDB storage for all services  
✅ Centralized error handling and validation  
✅ Secure build practices with no secrets in version control


## 🏗️ Architecture

```plaintext
Web Service (React Frontend)
   │
API Gateway (Express Gateway)
   │
 ┌───────────────┬───────────────┬───────────────┐
 │               │               │               │
Auth Service   Wallet Service   Transaction Service
                    │
                RabbitMQ
````

✅ All services communicate asynchronously via RabbitMQ.

---

## ⚙️ Tech Stack

* **Express Gateway** – API Gateway
* **Express.js** – Backend framework
* **TypeScript** – Type safety
* **Bun** – Runtime for fast builds
* **MongoDB** – Primary database
* **RabbitMQ** – Event broker
* **Docker & Docker Compose** – Container orchestration
* **Yup** – Input validation
* **JWT (RS256)** – Auth tokens
* **React.JS** - Frontend Framework
---

## 🔐 Security

Mint is designed with production-grade security in mind:

✅ **RS256 JWT keys**

* Auth Service contains:

  * **Private key** for signing tokens
* Wallet and Transaction services:

  * Only contain the **public key** for verifying tokens

✅ Private keys are:

* **Not committed to Git**
* **Injected during Docker build**
* Copied only where needed

✅ Services do **not expose ports publicly** (except the API Gateway).

---

## 🔑 How JWT Keys Are Managed

**Development flow:**

1. **Generate keys locally:**

```bash
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
```

2. Place `private.pem` and `public.pem` in `./auth/keys/` (do NOT commit private.pem).

3. Docker build copies:

   * `private.pem` → only into Auth Service
   * `public.pem` → into Auth, Wallet, and Transaction services

✅ Ensures:

* Only Auth Service can sign tokens
* Other services can verify tokens
* Private key stays safe

---

## 🔗 Services Overview

### Auth Service

* User registration
* Login (email/password)
* Token issuance with RS256
* Exposes public key for other services

---

### Wallet Service

* Manage user wallets
* Get wallet balance
* Top up wallet balance
* Processes balance updates from RabbitMQ events

---

### Transaction Service

* Initiate transfers between users
* Initiate wallet top-ups
* Store transaction logs
* Consume wallet events to update transaction statuses

---

## 🌐 API Gateway

Handles routing for:

```
/api/auth/* → Auth Service
/api/wallet/* → Wallet Service
/api/transactions/* → Transaction Service
```

✅ Implements:

* Rate limiting
* Proxy routing
* Centralized entry point

---

## 📸 Screenshots

### Home

![Home](./assets/home.png)

### Transactions

![Transactions](./assets/txns.png)

### Dashboard

![Transfer](./assets/dashboard.png)

---

## 🐳 Running Locally

### Prerequisites

* Docker & Docker Compose
* Bun installed locally (if running services outside Docker)

---

### Clone the repo

```bash
git clone https://github.com/sreekarnv/mint.git
cd mint
```

---

### Generate JWT Keys (if not yet created)

```bash
openssl genrsa -out auth/keys/private.pem 2048
openssl rsa -in auth/keys/private.pem -pubout -out auth/keys/public.pem
```

---

### Build and Run with Docker Compose

```bash
docker compose up --build
```

**Ports:**

* Gateway → [http://localhost:4000](http://localhost:4000)
* RabbitMQ UI → [http://localhost:15672](http://localhost:15672)

✅ Other services run in Docker but **do not expose ports** directly.

Default RabbitMQ credentials:

```
user: admin
pass: pass123#
```

---

### How JWT Keys Are Copied in Docker

* During Docker build:

  * Auth Service copies both `private.pem` and `public.pem`.
  * Wallet and Transaction Services only copy `public.pem` from Auth Service’s build context.

---

## 💡 Future Improvements

* Notification Service (emails/SMS)
* Dead-letter queues for RabbitMQ
* Centralized logging & tracing
* Metrics with Prometheus & Grafana
* Frontend integration demo

---

## 🧪 API Testing with Bruno

All Mint API routes are tested and documented using [Bruno](https://docs.usebruno.com/).

✅ The repository includes a `bruno` folder containing:

* All API requests (Auth, Wallet, Transaction)
* Pre-configured environment variables
* Example payloads and headers

### How to Use

1. **Install Bruno:**
   [Download and install Bruno](https://docs.usebruno.com/).

2. **Open the workspace:**
   In Bruno, choose:

   ```
   File → Open Collection
   ```

   and select the `bruno` folder from this repository.

3. **Run requests!**
   Explore and test the API routes locally via Bruno’s UI.

✅ This makes it easy for anyone to:

* Try the API
* Understand request and response shapes
* Validate end-to-end flows

---

## 📄 License

MIT License.

---

## 🙌 Author

[Sreekar Venkata Nutulapati](https://github.com/sreekarnv)

Built as a microservices learning project and resume showcase.
