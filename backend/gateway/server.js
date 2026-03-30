require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// ---------------------------------------------------------
// 🛡️ ARMOR-IQ POLICY ENGINE INITIALIZATION
// ---------------------------------------------------------
// Adjusting path to reach the root config folder (from backend/gateway up to mediguard/config)
const policyPath = path.join(__dirname, '../../config/armoriq.policy.json');
let policyData = { rules: [] };

try {
    policyData = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
    console.log(`✅ ArmorIQ Policy loaded successfully. Found ${policyData.rules.length} security rules.`);
} catch (error) {
    console.error(`❌ CRITICAL: Failed to load ArmorIQ policy at ${policyPath}. Gateway will deny all requests by default.`, error.message);
}

// Initialize defaults if database is empty
const defaultServices = [
    { serviceKey: "auth_service", name: "Auth Service", port: 3001, status: "online", uptime: "12d 4h" },
    { serviceKey: "patient_service", name: "Patient Service", port: 3002, status: "online", uptime: "12d 4h" },
    { serviceKey: "doctor_service", name: "Doctor Service", port: 3003, status: "online", uptime: "12d 4h" },
    { serviceKey: "records_service", name: "Records Service [PHI]", port: 3004, status: "online", uptime: "12d 4h" },
    { serviceKey: "billing_service", name: "Billing Service", port: 3005, status: "online", uptime: "12d 4h" }
];

// ---------------------------------------------------------
// 🧠 THE AI GATEWAY (YOUR CORE INTEGRATION)
// ---------------------------------------------------------
app.post('/api/chat', async (req, res) => {
    const { message, role } = req.body;

    console.log(`\n--- 🚨 NEW COMMAND RECEIVED ---`);
    console.log(`Operator Role: [${role}]`);
    console.log(`Command Prompt: "${message}"`);

    // Step 1: INTENT EXTRACTION (The "OpenClaw" Brain)
    // Currently using keyword parsing to guarantee a flawless local demo.
    let aiSelectedTool = "check_status";
    const msg = message.toLowerCase();

    if (msg.includes("drop") || msg.includes("wipe") || msg.includes("delete")) {
        if (msg.includes("patient") || msg.includes("records")) {
            aiSelectedTool = "drop_patient_records";
        } else if (msg.includes("billing")) {
            aiSelectedTool = "drop_billing";
        } else {
            aiSelectedTool = "drop_database"; // generic drop
        }
    } else if (msg.includes("restart")) {
        aiSelectedTool = "restart_service";
    }

    console.log(`AI Extracted Tool Intent: [${aiSelectedTool}]`);

    // Step 2: INTENT VERIFICATION (The "ArmorIQ" Shield)
    let isAllowed = false;
    let blockReason = "Default Block: Action not explicitly allowed.";

    for (const rule of policyData.rules) {
        const roleMatches = rule.condition.role === "*" || rule.condition.role === role;

        // Handle wildcard tools (e.g., "drop_*")
        const toolPattern = rule.condition.tool.replace('*', '.*');
        const toolMatches = new RegExp(`^${toolPattern}$`).test(aiSelectedTool);

        if (roleMatches && toolMatches) {
            if (rule.action === "BLOCK") {
                isAllowed = false;
                blockReason = rule.reason;
                break; // Hard block overrides everything
            } else if (rule.action === "ALLOW") {
                isAllowed = true;
                blockReason = "Action Authorized.";
            }
        }
    }

    // Step 3: EXECUTION OR BLOCK
    if (!isAllowed) {
        console.log(`🛡️  ArmorIQ Verdict: BLOCKED - ${blockReason}`);
        return res.json({
            status: "BLOCKED",
            message: `[INTENT VIOLATION] Action halted by ArmorIQ.`,
            reason: blockReason,
            tool: aiSelectedTool
        });
    }

    console.log(`✅ ArmorIQ Verdict: ALLOWED. Executing command...`);

    // Step 4: INFRASTRUCTURE MODIFICATION (If allowed)
    try {
        if (aiSelectedTool.startsWith("drop_")) {
            // Talk directly to Divyanshu's Prisma DB to take the service offline
            await prisma.serviceGateway.update({
                where: { serviceKey: "records_service" },
                data: { status: "offline" }
            });
            return res.json({
                status: "ALLOW",
                message: `Successfully executed ${aiSelectedTool}. The database has been wiped and the records service is offline.`,
                tool: aiSelectedTool
            });
        }

        // Default success response for safe commands
        return res.json({
            status: "ALLOW",
            message: `Command executed safely: ${aiSelectedTool}.`,
            tool: aiSelectedTool
        });

    } catch (error) {
        console.error("Database error during AI execution:", error);
        return res.status(500).json({ status: "ERROR", message: "Database failure during execution." });
    }
});

// ---------------------------------------------------------
// 🏥 DIVYANSHU'S INFRASTRUCTURE ROUTES
// ---------------------------------------------------------
app.get('/api/status', async (req, res) => {
    try {
        const servicesArray = await prisma.serviceGateway.findMany();
        const services = {};
        servicesArray.forEach(s => {
            services[s.serviceKey] = s;
        });
        res.json({ success: true, services: services });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/gateway/update', async (req, res) => {
    const service = req.body?.service;
    const status = req.body?.status;
    if (!service) return res.status(400).json({ success: false, message: 'Invalid service key' });

    try {
        await prisma.serviceGateway.update({
            where: { serviceKey: service },
            data: { status: status }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/reset', async (req, res) => {
    try {
        for (const def of defaultServices) {
            await prisma.serviceGateway.upsert({
                where: { serviceKey: def.serviceKey },
                update: { status: "online", uptime: "0d 0h" },
                create: { ...def }
            });
        }

        await prisma.authMetrics.upsert({ where: { id: 1 }, update: { sessionsActive: 42, status: 'online' }, create: { id: 1, sessionsActive: 42, status: 'online' } });
        await prisma.patientMetrics.upsert({ where: { id: 1 }, update: { admittedPatients: 128, maintenanceMode: false, status: 'online' }, create: { id: 1, admittedPatients: 128, maintenanceMode: false, status: 'online' } });

        await prisma.doctorSchedule.deleteMany({});
        const docs = [
            { doctorName: "Dr. Sharma", shift: "Mon-Cardiology", isOnCall: true },
            { doctorName: "Dr. Patel", shift: "Tue-Ortho", isOnCall: true },
            { doctorName: "Dr. Mehta", shift: "Wed-ICU", isOnCall: true }
        ];
        await prisma.doctorSchedule.createMany({ data: docs });

        await prisma.medicalRecordsPHI.upsert({
            where: { id: 1 },
            update: { storageUsed: "847 GB", storageTotal: "2 TB", totalRecords: 94203, status: "online" },
            create: { id: 1, storageUsed: "847 GB", storageTotal: "2 TB", totalRecords: 94203, status: "online" }
        });

        await prisma.billingMetrics.upsert({
            where: { id: 1 },
            update: { pendingClaims: 312, cronStatus: "running", status: "online" },
            create: { id: 1, pendingClaims: 312, cronStatus: "running", status: "online" }
        });

        res.json({ success: true, message: "All services & Neon cloud DB reset to online" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

const port = process.env.GATEWAY_PORT || 4000;
app.listen(port, () => console.log(`🛡️  MediGuard Gateway & ArmorIQ operating locally on :${port}`));