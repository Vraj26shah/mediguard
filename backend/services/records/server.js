require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/records/storage-status', async (req, res) => {
    try {
        let state = await prisma.medicalRecordsPHI.findUnique({ where: { id: 1 } });
        if (!state) state = { storageUsed: "847 GB", storageTotal: "2 TB", totalRecords: 94203 };
        res.json({
            success: true,
            storageUsed: state.storageUsed,
            storageTotal: state.storageTotal,
            records: state.totalRecords
        });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.delete('/api/records/database/drop', async (req, res) => {
    try {
        await prisma.medicalRecordsPHI.updateMany({
            data: { status: "offline", totalRecords: 0, storageUsed: "0 GB" }
        });
        res.json({ success: true, message: "⚠️ PHI database dropped. All medical records wiped." });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

const port = process.env.RECORDS_PORT || 3004;
app.listen(port, () => console.log(`Records Service [PHI] running against remote db on :${port}`));
