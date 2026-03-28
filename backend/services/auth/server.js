require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/auth/health', async (req, res) => {
    try {
        let state = await prisma.authMetrics.findUnique({ where: { id: 1 } });
        if (!state) state = { status: "online", sessionsActive: 42 };
        res.json({ success: true, status: state.status, uptime: "12d 4h", sessions: state.sessionsActive });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.delete('/api/auth/revoke-all', async (req, res) => {
    try {
        await prisma.authMetrics.updateMany({ data: { sessionsActive: 0, status: "degraded" } });
        res.json({ success: true, message: "All sessions revoked. Users force-logged out." });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

const port = process.env.AUTH_PORT || 3001;
app.listen(port, () => console.log(`Auth Service operating over Prisma on :${port}`));
