const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runNativeCrudTests() {
    console.log("\n=================================");
    console.log("🔥 NEON DATABASE CRUD TESTING 🔥");
    console.log("=================================");

    try {
        // ----------------------------------------------------
        // CREATE (Seeding new mock records)
        // ----------------------------------------------------
        console.log("\n1. [CREATE] Seeding isolated AuthMetrics row for testing...");
        const createdRow = await prisma.authMetrics.create({
            data: { sessionsActive: 999, status: "TEST_CREATE" }
        });
        console.log("✅ Create Successful. Row ID:", createdRow.id);

        // ----------------------------------------------------
        // READ (Fetching records)
        // ----------------------------------------------------
        console.log("\n2. [READ] Validating the created Auth row fetch...");
        const readRow = await prisma.authMetrics.findUnique({
            where: { id: createdRow.id }
        });
        console.log("✅ Read Successful. Current status:", readRow.status);

        // ----------------------------------------------------
        // UPDATE (Modifying records)
        // ----------------------------------------------------
        console.log("\n3. [UPDATE] Changing sessionsActive status via update call...");
        const updatedRow = await prisma.authMetrics.update({
            where: { id: createdRow.id },
            data: { sessionsActive: 0, status: "TEST_UPDATE" }
        });
        console.log("✅ Update Successful. Sessions reduced properly to:", updatedRow.sessionsActive, "| Status:", updatedRow.status);

        // ----------------------------------------------------
        // DELETE (Deleting records)
        // ----------------------------------------------------
        console.log("\n4. [DELETE] Executing cleanup deletion of test row...");
        const deletedRow = await prisma.authMetrics.delete({
            where: { id: createdRow.id }
        });
        console.log("✅ Delete Successful. Dropped ID:", deletedRow.id);

        console.log("\n🎉 NEON PERSISTENCE & CRUD VALIDATED 🎉\n");

    } catch (err) {
        console.error("❌ CRTICAL DB FAILURE:", err.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

async function runApiIntegrationTests() {
    console.log("=================================");
    console.log("🚀 FULL API INTEGRATION TESTING 🚀");
    console.log("=================================\n");

    // Spin up servers locally
    require('./gateway/server.js');
    require('./services/auth/server.js');
    require('./services/patient/server.js');
    require('./services/doctor/server.js');
    require('./services/records/server.js');
    require('./services/billing/server.js');

    await new Promise(r => setTimeout(r, 2000));

    const fetchJson = async (url, method = 'GET', body = null) => {
        try {
            const options = { method, headers: { 'Content-Type': 'application/json' } };
            if (body) options.body = JSON.stringify(body);
            const res = await fetch(url, options);
            const data = await res.json();
            return { status: res.status, body: data };
        } catch (err) {
            return { status: "NETWORK_ERROR", msg: err.message };
        }
    };

    try {
        // Test CREATE / UPSERT globally via reset
        console.log("▶ [GLOBAL SEED] POST /api/reset (Port 4000) - Upserting complete layout");
        const resetRes = await fetchJson('http://localhost:4000/api/reset', 'POST');
        console.log(resetRes);

        // Test READ on microservice
        console.log("\n▶ [READ] GET /api/auth/health (Port 3001)");
        console.log(await fetchJson('http://localhost:3001/api/auth/health'));

        console.log("\n▶ [READ] GET /api/records/storage-status (Port 3004)");
        console.log(await fetchJson('http://localhost:3004/api/records/storage-status'));

        // Test UPDATE on microservice
        console.log("\n▶ [UPDATE] POST /api/patients/maintenance-mode (Port 3002)");
        console.log(await fetchJson('http://localhost:3002/api/patients/maintenance-mode', 'POST'));

        // Test DELETE actions on microservices
        console.log("\n▶ [DELETE] DELETE /api/records/database/drop (Port 3004) - Targeting PHI DB");
        console.log(await fetchJson('http://localhost:3004/api/records/database/drop', 'DELETE'));

        console.log("\n▶ [DELETE] DELETE /api/doctors/schedules/reset (Port 3003)");
        console.log(await fetchJson('http://localhost:3003/api/doctors/schedules/reset', 'DELETE'));

    } catch (err) {
        console.error("❌ API TESTS FAILED:", err);
    }

    process.exit(0);
}

const main = async () => {
    await runNativeCrudTests();
    await runApiIntegrationTests();
};

main();
