# Mini Ticket Tracker

A lightweight ticket management application built with React, TypeScript, Node.js, Express, and PostgreSQL. The application provides a simple interface for creating and managing tickets, tracking their status and priority, filtering results, and viewing ticket statistics.

## Features

- Create tickets with a title, description, and priority.
- View tickets with pagination and status filtering.
- Update ticket status and priority.
- View ticket statistics grouped by status.
- Check API health and database connectivity.
- Run the full application stack using Docker Compose or local development tools.
- Run automated backend API tests.

## Technology Stack

| Component        | Technology                     |
|------------------|--------------------------------|
| Frontend         | React, TypeScript, Vite        |
| Backend          | Node.js, Express, TypeScript   |
| Database         | PostgreSQL 16                  |
| Containerization | Docker, Docker Compose         |
| API testing      | Node.js test runner, Supertest |

## Prerequisites

Choose one of the following setup options.

**Option A: Docker Compose**

- Git
- Docker Engine
- Docker Compose plugin

**Option B: Local installation without Docker**

- Git
- Node.js and npm
- PostgreSQL 16 or a compatible version

## Setup and Run

### 1. Clone the repository

```bash
git clone git@github-tluoy:tluoy/mini-ticket-tracker.git
cd mini-ticket-tracker
```

The command above uses the configured GitHub SSH alias. If you do not have SSH configured, clone the repository using its HTTPS URL:

```bash
git clone https://github.com/tluoy/mini-ticket-tracker.git
cd mini-ticket-tracker
```

### 2. Configure environment variables

The application uses environment variables for PostgreSQL credentials and the backend database connection. Local `.env` files are excluded from Git because they may contain passwords.

Choose the configuration that matches how you intend to run the application.

#### Option A: Docker Compose

Create the root environment file from the supplied template:

```bash
cp .env.example .env
vim .env
```

Set a local PostgreSQL password:

```dotenv
POSTGRES_PASSWORD=your_local_development_password
```

Replace the example value with your own password.

When Docker Compose starts the application, it reads `POSTGRES_PASSWORD` from the root `.env` file. It uses this value to configure PostgreSQL and construct the backend's `DATABASE_URL`.

No separate `backend/.env` file is required for the Docker Compose setup.

The backend connection string follows this format:

```text
postgresql://ticket_user:<POSTGRES_PASSWORD>@db:5432/ticket_tracker
```

Here, `db` is the PostgreSQL service name on the Docker network. Containers use this service name to communicate with PostgreSQL.

#### Option B: Run without Docker

In this setup, PostgreSQL, the backend, and the frontend run directly on your machine.

**Create the PostgreSQL database and user**

First, ensure PostgreSQL is installed and running. On a Linux system using systemd, you can check its status with:

```bash
sudo systemctl status postgresql
```

If PostgreSQL is installed but stopped, start it:

```bash
sudo systemctl start postgresql
```

Open the PostgreSQL command-line client as an administrator:

```bash
sudo -u postgres psql
```

Create the application database user and database. Replace the example password with your own local password:

```sql
CREATE USER ticket_user WITH PASSWORD 'your_local_development_password';
CREATE DATABASE ticket_tracker OWNER ticket_user;
\q
```

If the user or database already exists, inspect the existing configuration instead of blindly creating duplicates.

**Load the database schema**

From the repository root, run:

```bash
psql -h localhost -U ticket_user -d ticket_tracker -f backend/sql/schema.sql
```

Enter the password assigned to `ticket_user` when prompted. This command executes the SQL schema against the existing database.

Run it against a new, empty database. If the database already contains tables or data, inspect the schema before rerunning the script.

**Configure the backend**

Create the backend environment file:

```bash
vim backend/.env
```

Add the following configuration:

```dotenv
DATABASE_URL=postgresql://ticket_user:your_local_development_password@localhost:5432/ticket_tracker
PORT=3000
```

Use the same password assigned to the PostgreSQL user. The hostname `localhost` is appropriate because the backend and PostgreSQL are running directly on your machine.

The backend loads environment variables through `dotenv/config`. Its database module, `backend/src/db.ts`, uses the `pg` package to create a connection pool using `DATABASE_URL`.

In this local setup, the root `.env` file is not required unless you separately use it for another purpose. The backend uses `backend/.env`.

**Password consistency**

The password in the backend's `DATABASE_URL` must match the password PostgreSQL expects for `ticket_user`.

In the Docker Compose setup, Compose derives the backend connection string from the root `POSTGRES_PASSWORD` variable. In the local setup, the connection string in `backend/.env` must use the password assigned to `ticket_user`.

Changing a password in an environment file does not automatically update the password stored in an existing PostgreSQL database. Update the PostgreSQL user's password separately if necessary.

Keep both `.env` files out of Git. Never commit real credentials or other secrets.

### 3. Start the application

#### Option A: Start with Docker Compose

From the repository root, run:

```bash
docker compose up -d --build
```

Docker Compose builds the application images and starts PostgreSQL, the backend, and the frontend. The backend is configured to wait for PostgreSQL's health check before starting.

On first initialization of an empty PostgreSQL data volume, the PostgreSQL container executes the SQL initialization script mounted from `backend/sql/schema.sql`. This creates the database objects defined by that script.

The initialization scripts are not automatically rerun every time the container restarts. PostgreSQL uses its persistent data volume to preserve database data across restarts.

Check the service status:

```bash
docker compose ps
```

View the logs if a service fails to start:

```bash
docker compose logs db
docker compose logs backend
docker compose logs frontend
```

#### Option B: Start without Docker

Start PostgreSQL first, and ensure you have completed the database and schema setup described above.

Open separate terminal sessions from the repository root.

**Terminal 1 — Backend API**

```bash
cd backend
npm ci
npm run dev
```

The backend reads `backend/.env` and connects to the local PostgreSQL instance using `DATABASE_URL`.

**Terminal 2 — Frontend**

```bash
cd frontend
npm ci
npm run dev
```

The frontend development server runs separately from the backend and database.

If your PostgreSQL installation uses a different port, hostname, authentication method, or service manager, adjust the connection settings and startup commands to match your environment.

### 4. Access the application

Once the services are running, open the frontend:

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **API health check:** [http://localhost:3000/api/health](http://localhost:3000/api/health)

You can also check the API health endpoint from a terminal:

```bash
curl http://localhost:3000/api/health
```

A successful response should indicate that the API is running and the database connection is healthy, for example:

```json
{
  "status": "ok",
  "database": "connected"
}
```

The exact response depends on the implementation of the health endpoint.

### 5. Stop the application

**Docker Compose setup**

Stop and remove the application containers while preserving the database volume:

```bash
docker compose down
```

To remove the Compose-managed volumes as well, run:

```bash
docker compose down -v
```

**Warning:** The second command can permanently delete the PostgreSQL data stored in the Compose volume. Use it only when you intend to remove that data.

**Local installation without Docker**

Stop the backend and frontend development servers with `Ctrl+C` in their respective terminals. PostgreSQL can remain running as a local service.

## Running Tests and Quality Checks

The backend API tests use Node.js's built-in test runner and Supertest. They use a mock database, so the backend tests do not require a running PostgreSQL instance.

### Backend tests

From the repository root:

```bash
cd backend
npm ci
npm test
npm run build
```

These commands install backend dependencies, execute the API tests, and compile the TypeScript backend.

### Frontend checks

From the repository root, open a separate terminal or return to the root directory:

```bash
cd frontend
npm ci
npm run lint
npm run build
```

These commands install frontend dependencies, run ESLint, and build the production frontend.

## Decisions & Tradeoffs

I chose React and TypeScript for a maintainable frontend with type safety. Express provides a lightweight REST API without unnecessary framework complexity. PostgreSQL was selected for reliable relational storage of ticket data. Docker Compose simplifies local setup by running the frontend, backend, and database together, while the local installation option supports developers who do not use Docker. Pagination and status filtering keep ticket listing manageable as the number of tickets grows. Automated API tests use a mock database, making endpoint behavior testable without a live database. Authentication and authorization were left out to keep the implementation focused on the assignment's core requirements. The UI prioritizes functionality over visual polish because the assignment emphasizes engineering judgment. With more time, I would add authentication, ticket assignment, end-to-end tests, and a continuous integration pipeline.