# MediGuard Backend Information (Neon / Prisma)

The MediGuard backend is a **cloud-persistent microservices architecture**. It models health systems interactions, mutating live data stored remotely on a serverless Neon PostgreSQL database via Prisma ORM.

## Architecture Overview
Instead of a monolithic server or localized variables, the application infrastructure is divided into a single API Gateway and five independent domain microservices. Extensible data scaling and persistence allow multiple developers to access the exact same state globally.

- **Neon Cloud Database**: The central truth. Managed securely via Prisma schema validation.
- **Gateway Server**: Aggregates mock statuses, controls global dashboard UI polling, and performs mass database seeding.
- **5 Microservices**: Handle specific domain functionality mutating their own isolated database metric tables dynamically via SQL mappings.

## Directory and File Structure

```text
mediguard/backend/
├── .env                      # Contains the active Neon DATABASE_URL schema, API Keys, and Port numbers
├── package.json              # Defines startup scripts (concurrently, nodemon) and dependencies (Prisma, Express, dotenv)
├── prisma/
│   └── schema.prisma         # The unified relational SQL model layout mapping all 6 tables securely
├── gateway/
│   └── server.js             # Port 4000: Gateway API. Pulls statuses from ServiceGateway table; handles global demo resets
└── services/
    ├── auth/
    │   └── server.js         # Port 3001: Maps AuthMetrics table. Handles user token actions.
    ├── patient/
    │   └── server.js         # Port 3002: Maps PatientMetrics table. Tracks admissions and locks statuses.
    ├── doctor/
    │   └── server.js         # Port 3003: Maps DoctorSchedule array tables. Tracks localized staff rotations.
    ├── records/
    │   └── server.js         # Port 3004: Maps MedicalRecordsPHI. The primary demo target dropping protected system records.
    └── billing/
        └── server.js         # Port 3005: Maps BillingMetrics. Modifies chron variables and resets pending statuses.
```

## How to Run the Infrastructure Locally
Because there are 6 distinct servers natively connected, we utilize `concurrently` to safely run them all via a single Node process wrapper inside your terminal.

1. **Install Dependencies:**  
   If you have pulled for the first time or modified the `prisma` settings tracking properties:
   ```bash
   npm install
   npx prisma generate
   ```
2. **Start All System Loops (Auto-Reloading):**  
   To launch the gateway alongside all 5 microservices at once using `nodemon`, run:
   ```bash
   npm run dev:all
   ```
   *(This triggers the Node loops assigning Ports 4000, 3001, 3002, 3003, 3004, and 3005 natively defined by `.env`)*

## How It Works Under the Hood
1. **Frontend Polling**: The React dashboard UI consistently polls `http://localhost:4000/api/status`. The Gateway sequentially processes a `findMany` query against the `ServiceGateway` Postgres table, translating it into standard JSON map boundaries matching frontend interface logic completely.
2. **Action Runtime Hooks**: When the AI agent commands a system destructive change, OpenClaw constructs tools mapped to directly hit the targeted internal port boundaries (e.g., `DELETE http://localhost:3004/api/records/database/drop`). 
3. **Remote SQL Mutation**: If ArmorClaw evaluates the request against `armoriq.policy.json` and evaluates the user role as **authorized**, the individual active microservices execute synchronous Prisma statements modifying the isolated cloud variables automatically. 
4. **Clean Reset Handling**: Because testing variables vanish naturally over cloud latency runs, you do not have to rewrite rows iteratively. Executing `POST /api/reset` to the Gateway forces `upsert` queries to refresh table metrics directly matching optimal local application targets globally.

## Command Execution Validations
You can fetch and update system states by triggering queries against your localhost tree structure dynamically. 
```bash
# Global Status Extraction
curl http://localhost:4000/api/status

# Standard Microservices Route Deletion Target
curl -X DELETE http://localhost:3004/api/records/database/drop

# Triggers Global Neon Cloud Refresh Seed (Must run to deploy the initial tables context!)
curl -X POST http://localhost:4000/api/reset
```
