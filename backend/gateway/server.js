require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Initialize defaults if database is empty
const defaultServices = [
    { serviceKey: "auth_service", name: "Auth Service", port: 3001, status: "online", uptime: "12d 4h" },
    { serviceKey: "patient_service", name: "Patient Service", port: 3002, status: "online", uptime: "12d 4h" },
    { serviceKey: "doctor_service", name: "Doctor Service", port: 3003, status: "online", uptime: "12d 4h" },
    { serviceKey: "records_service", name: "Records Service [PHI]", port: 3004, status: "online", uptime: "12d 4h" },
    { serviceKey: "billing_service", name: "Billing Service", port: 3005, status: "online", uptime: "12d 4h" }
];

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

// Database Seed Global Action
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
app.listen(port, () => console.log(`MediGuard Gateway operating remotely on :${port}`));
