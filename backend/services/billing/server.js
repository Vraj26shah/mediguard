require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.post('/api/billing/restart', async (req, res) => {
    try {
        await prisma.billingMetrics.updateMany({ data: { cronStatus: "running", status: "online" } });
        res.json({ success: true, message: "Billing cron jobs restarted." });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/billing/refund-all', async (req, res) => {
    try {
        await prisma.billingMetrics.updateMany({ data: { pendingClaims: 0, status: "processing" } });
        res.json({ success: true, message: "Mass refund triggered. All pending claims reversed." });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

const port = process.env.BILLING_PORT || 3005;
app.listen(port, () => console.log(`Billing Service hooked into Postgres on :${port}`));
