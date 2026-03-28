# SQL Database Migration Plan (Using Neon)

*Note: The original project instructions recommend against using a real database to keep demo resets instant. However, if persistent, shared storage across a team is required, a cloud SQL approach is the best choice.*

The backend currently uses **in-memory JavaScript objects** (local variable storage) to keep track of state. Moving to a relational SQL database requires setting up persistent storage, creating a structured relational mapping, and rewriting the REST endpoints to execute queries instead of modifying objects.

## 1. Technological Stack Setup
- **Database Engine**: **Neon (Serverless PostgreSQL)**. Neon is fantastic for this because it allows multiple developers to connect to the exact same database over the internet without any local Docker or Postgres installation overhead. It provides a simple connection string you drop into your `.env` file.
- **ORM Framework**: **Prisma** (highly recommended). Prisma pairs perfectly with Neon and handles connection pooling efficiently for serverless Postgres.

## 2. Relational Schema & Table Structure
To maintain the isolated microservices design, each domain will manage its own table within your shared Neon database.

### Table: `ServiceGateway` (Port 4000)
Tracks the aggregated global state for the dashboard.
- `id` (Primary Key)
- `serviceKey` (String, Unique) - e.g., 'auth_service'
- `name` (String)
- `port` (Int)
- `status` (String) - e.g., 'online', 'offline'
- `uptime` (String)

### Table: `AuthMetrics` (Port 3001)
- `id` (PK)
- `sessionsActive` (Int)
- `status` (String)

### Table: `PatientMetrics` (Port 3002)
- `id` (PK)
- `admittedPatients` (Int)
- `maintenanceMode` (Boolean)
- `status` (String)

### Table: `DoctorSchedule` (Port 3003)
Because doctor schedules are arrays, this should be tracked as individual rows.
- `id` (PK)
- `doctorName` (String)
- `shift` (String) - e.g., 'Mon-Cardiology'
- `isOnCall` (Boolean)

### Table: `MedicalRecordsPHI` (Port 3004)
- `id` (PK)
- `storageUsed` (String)
- `storageTotal` (String)
- `totalRecords` (Int)
- `status` (String)

### Table: `BillingMetrics` (Port 3005)
- `id` (PK)
- `pendingClaims` (Int)
- `cronStatus` (String)
- `status` (String)

## 3. Step-by-Step Implementation

### Phase 1: Database Initialization
1. Create a free project on [neon.tech](https://neon.tech), grab the Postgres connection string.
2. In the `backend` directory, run: `npm install prisma @prisma/client`
3. Initialize: `npx prisma init`
4. Set your `DATABASE_URL` in the `.env` file to your Neon connection string.
5. In `prisma/schema.prisma`, write out the data models matching the tables described above.
6. Run `npx prisma db push` to generate the physical SQL tables in your Neon cloud database.

### Phase 2: Refactoring the Microservices 
For each `server.js` file across your 5 services, replace the `let state = { ... }` object with Prisma Client calls.

*Example for Records Service (`DELETE /api/records/database/drop`)*:
```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

app.delete('/api/records/database/drop', async (req, res) => {
  // Execute a real SQL DELETE query on Neon Postgres
  await prisma.medicalRecordsPHI.deleteMany({});
  
  // Update local tracker
  await prisma.medicalRecordsPHI.create({
    data: { status: "offline", totalRecords: 0, storageUsed: "0 GB" }
  });

  res.json({ success: true, message: "⚠️ PHI database dropped." });
});
```

### Phase 3: Refactoring the Gateway
1. Update `gateway/server.js`'s `GET /api/status` endpoint to execute a `SELECT *` query fetching all rows from the `ServiceGateway` table rather than returning the `systemState` object.
2. Update the `POST /api/gateway/update` route to execute a SQL `UPDATE` row query targeting the correct `serviceKey`.

### Phase 4: Fixing Global Resets
- Rewrite `POST /api/reset` on the gateway so that instead of resetting variables, it executes a bulk SQL `UPDATE` resetting all states in `ServiceGateway` back to their `"online"` defaults on Neon, and propagates resets to the 5 underlying metrics tables to restore the app for demo runs.
