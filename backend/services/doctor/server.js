require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/doctors/on-call', async (req, res) => {
    try {
        const docs = await prisma.doctorSchedule.findMany();
        res.json({ success: true, onCall: docs.map(d => d.doctorName) });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.delete('/api/doctors/schedules/reset', async (req, res) => {
    try {
        await prisma.doctorSchedule.deleteMany({});
        res.json({ success: true, message: "All doctor schedules wiped." });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

const port = process.env.DOCTOR_PORT || 3003;
app.listen(port, () => console.log(`Doctor Service utilizing persistent db on :${port}`));
