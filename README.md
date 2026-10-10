# Mini Ticket Tracker

A lightweight ticket management application built with React, TypeScript, Node.js, Express, and PostgreSQL. The application provides a simple interface for creating and managing tickets, tracking their status and priority, filtering results, and viewing ticket statistics.

## Features

- Create tickets with a title, description, and priority.
- View tickets with pagination and status filtering.
- Update ticket status and priority.
- View ticket statistics grouped by status.
- Check API health and database connectivity.
- Run the full application stack using Docker Compose.
- Run automated backend API tests.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL 16 |
| Containerization | Docker, Docker Compose |
| API testing | Node.js test runner, Supertest |

## Prerequisites

Install the following tools:

- Git
- Docker Engine and Docker Compose
- Node.js and npm (for running local development checks and backend tests)

## Setup and Run

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd mini-ticket-tracker
```

Replace the placeholder URL with the repository's actual GitHub URL.

### 2. Configure environment variables

Create a local environment file:

```bash
cp .env.example .env
```

Edit `.env` and replace the placeholder password with a strong local development password:

```bash
vim .env
```

Example:

```dotenv
POSTGRES_PASSWORD=your_local_development_password
```

The root `.env` file is excluded from Git. Never commit real passwords or other secrets.

### 3. Start the application

From the project root, run:

```bash
docker compose up -d --build
```

Docker Compose builds the frontend and backend containers and starts PostgreSQL. The backend waits for the database health check before starting.

Check the service status:

```bash
docker compose ps
```

### 4. Access the application

- **Frontend:** http://localhost:5173
- **API health check:** http://localhost:3000/api/health

A successful health check returns a response similar to:

```json
{
  "status": "ok",
  "database": "connected"
}
```

### 5. Stop the application

Stop the containers while preserving the database volume:

```bash
docker compose down
```

To remove the database volume and its stored data as well, run:

```bash
docker compose down -v
```

**Warning:** The second command permanently removes the PostgreSQL data stored in the Compose volume.

## Running Tests and Quality Checks

The backend API tests use Node.js's built-in test runner and Supertest. They use a mock database, so they do not require a running PostgreSQL instance.

### Backend tests

```bash
cd backend
npm ci
npm test
npm run build
```

### Frontend checks

In a separate terminal, from the repository root:

```bash
cd frontend
npm ci
npm run lint
npm run build
```

These commands install dependencies, run the existing backend tests, and verify