require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/patients/stats', async (req, res) => {
    try {
        let state = await prisma.patientMetrics.findUnique({ where: { id: 1 } });
        if (!state) state = { admittedPatients: 128, maintenanceMode: false };
        res.json({ success: true, admittedPatients: state.admittedPatients, maintenanceMode: state.maintenanceMode });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/patients/maintenance-mode', async (req, res) => {
    try {
        await prisma.patientMetrics.updateMany({ data: { maintenanceMode: true, status: "maintenance" } });
        res.json({ success: true, message: "Patient database locked for updates." });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

const port = process.env.PATIENT_PORT || 3002;
app.listen(port, () => console.log(`Patient Service operating on Neon via Prisma :${port}`));
