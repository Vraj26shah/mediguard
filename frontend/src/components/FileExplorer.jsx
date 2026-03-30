/**
 * ═══════════════════════════════════════════════════════════════════════
 * FILEEXPLORER.JSX — Mock File System Tree
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Left sidebar component showing hierarchical file/folder tree:
 *   • Expandable/collapsible folders (state: openFolders Set)
 *   • File icons colored by type: [js], [sq], [ym], [sh], [{}], [ev]
 *   • Click file → onFileSelect callback
 *   • Click folder → toggle expansion
 *   • Selected file highlighted in blue
 *
 * Data: Hardcoded mock healthcare project structure (no real I/O)
 */

import { useState } from 'react';

const FILE_TREE = [
  {
    name: 'Devsec-backend',
    path: '',
    type: 'folder',
    children: [
      {
        name: 'src',
        path: 'src',
        type: 'folder',
        children: [
          {
            name: 'api',
            path: 'src/api',
            type: 'folder',
            children: [
              {
                name: 'auth.js',
                path: 'src/api/auth.js',
                language: 'javascript',
                content: `const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authGuard');

// POST /auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Verify credentials against database
    const user = await db.query(
      'SELECT id, username FROM users WHERE username = $1',
      [username]
    );

    if (!user.rows.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: user.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/logout
router.post('/logout', verifyToken, async (req, res) => {
  // Invalidate session token
  res.json({ success: true });
});

module.exports = router;`,
              },
              {
                name: 'patients.js',
                path: 'src/api/patients.js',
                language: 'javascript',
                content: `const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authGuard');

// GET /patients/:id
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM patients WHERE id = $1',
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Decrypt PHI fields
    const patient = result.rows[0];
    patient.name = decrypt(patient.name_enc);
    patient.dob = decrypt(patient.dob_enc);

    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;`,
              },
              {
                name: 'billing.js',
                path: 'src/api/billing.js',
                language: 'javascript',
                content: `const express = require('express');
const router = express.Router();

// POST /billing/invoice
router.post('/invoice', async (req, res) => {
  const { patientId, amount, description } = req.body;

  try {
    const invoice = await db.query(
      'INSERT INTO invoices (patient_id, amount, description) VALUES ($1, $2, $3) RETURNING *',
      [patientId, amount, description]
    );

    res.status(201).json(invoice.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;`,
              },
            ],
          },
          {
            name: 'db',
            path: 'src/db',
            type: 'folder',
            children: [
              {
                name: 'migrations',
                path: 'src/db/migrations',
                type: 'folder',
                children: [
                  {
                    name: '001_init.sql',
                    path: 'src/db/migrations/001_init.sql',
                    language: 'sql',
                    content: `-- Initial schema for Devsec database
-- Created: 2024-01-15
-- PHI fields are encrypted at rest

CREATE TABLE patients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mrn         VARCHAR(20) UNIQUE NOT NULL,
  name_enc    BYTEA NOT NULL,
  dob_enc     BYTEA NOT NULL,
  email_enc   BYTEA NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invoices (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES patients(id),
  amount      DECIMAL(10, 2) NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_patient_id ON invoices(patient_id);`,
                  },
                  {
                    name: '002_phi.sql',
                    path: 'src/db/migrations/002_phi.sql',
                    language: 'sql',
                    content: `-- Add PHI encryption key rotation support
-- Created: 2024-02-10

CREATE TABLE key_rotation_log (
  id          SERIAL PRIMARY KEY,
  old_key_id  VARCHAR(64) NOT NULL,
  new_key_id  VARCHAR(64) NOT NULL,
  rotated_at  TIMESTAMPTZ DEFAULT NOW(),
  status      VARCHAR(20) DEFAULT 'pending'
);

ALTER TABLE patients ADD COLUMN key_version INT DEFAULT 1;
ALTER TABLE patients ADD COLUMN last_reencrypted TIMESTAMPTZ;

CREATE INDEX idx_key_rotation_status ON key_rotation_log(status);`,
                  },
                ],
              },
              {
                name: 'models.js',
                path: 'src/db/models.js',
                language: 'javascript',
                content: `const Pool = require('pg').Pool;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

class Patient {
  static async findById(id) {
    const res = await pool.query('SELECT * FROM patients WHERE id = $1', [id]);
    return res.rows[0];
  }

  static async create(mrn, nameEnc, dobEnc, emailEnc) {
    const res = await pool.query(
      'INSERT INTO patients (mrn, name_enc, dob_enc, email_enc) VALUES ($1, $2, $3, $4) RETURNING *',
      [mrn, nameEnc, dobEnc, emailEnc]
    );
    return res.rows[0];
  }
}

module.exports = { Patient };`,
              },
            ],
          },
          {
            name: 'middleware',
            path: 'src/middleware',
            type: 'folder',
            children: [
              {
                name: 'authGuard.js',
                path: 'src/middleware/authGuard.js',
                language: 'javascript',
                content: `const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

module.exports = { verifyToken };`,
              },
              {
                name: 'phiMask.js',
                path: 'src/middleware/phiMask.js',
                language: 'javascript',
                content: `// PHI (Protected Health Information) masking middleware
// Automatically masks sensitive fields in responses

function maskPHI(data) {
  if (data.name) {
    data.name = '***' + data.name.slice(-2);
  }
  if (data.dob) {
    data.dob = '****-**-**';
  }
  if (data.email) {
    data.email = data.email.replace(/(.{1})(.*)(@.+)/, '$1***$3');
  }
  return data;
}

function phiMaskMiddleware(req, res, next) {
  const originalJson = res.json;

  res.json = function(data) {
    if (data && !req.user?.hasPhiAccess) {
      data = maskPHI(data);
    }
    return originalJson.call(this, data);
  };

  next();
}

module.exports = { phiMaskMiddleware };`,
              },
            ],
          },
          {
            name: 'config.js',
            path: 'src/config.js',
            language: 'javascript',
            content: `require('dotenv').config();

module.exports = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '24h',
  },

  encryption: {
    algorithm: process.env.ENCRYPT_ALGO || 'aes-256-gcm',
    keyId: process.env.ENCRYPT_KEY_ID,
  },
};`,
          },
          {
            name: 'server.js',
            path: 'src/server.js',
            language: 'javascript',
            content: `const express = require('express');
const cors = require('cors');
const config = require('./config');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', require('./api/auth'));
app.use('/patients', require('./api/patients'));
app.use('/billing', require('./api/billing'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(\`Devsec server running on port \${config.port}\`);
});`,
          },
        ],
      },
      {
        name: 'infra',
        path: 'infra',
        type: 'folder',
        children: [
          {
            name: 'docker-compose.yml',
            path: 'infra/docker-compose.yml',
            language: 'yaml',
            content: `version: '3.9'

services:
  api:
    build: .
    ports:
      - "4000:4000"
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: Devsec
      DB_USER: \${DB_USER}
      DB_PASSWORD: \${DB_PASSWORD}
      JWT_SECRET: \${JWT_SECRET}
      ENCRYPT_KEY_ID: \${ENCRYPT_KEY_ID}
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - Devsec

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: Devsec
      POSTGRES_USER: \${DB_USER}
      POSTGRES_PASSWORD: \${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - Devsec

volumes:
  postgres_data:

networks:
  Devsec:`,
          },
          {
            name: 'Dockerfile',
            path: 'infra/Dockerfile',
            language: 'plaintext',
            content: `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "src/server.js"]`,
          },
          {
            name: 'nginx.conf',
            path: 'infra/nginx.conf',
            language: 'plaintext',
            content: `upstream Devsec_api {
  server api:4000;
}

server {
  listen 80;
  server_name _;

  client_max_body_size 10M;

  location / {
    proxy_pass http://Devsec_api;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /health {
    access_log off;
    proxy_pass http://Devsec_api;
  }
}`,
          },
        ],
      },
      {
        name: 'scripts',
        path: 'scripts',
        type: 'folder',
        children: [
          {
            name: 'seed.js',
            path: 'scripts/seed.js',
            language: 'javascript',
            content: `const db = require('../src/db/models');
const crypto = require('crypto');

// Sample data for seeding the database
const seedPatients = [
  {
    mrn: 'MRN001',
    name: 'John Doe',
    dob: '1980-05-15',
    email: 'john@example.com',
  },
  {
    mrn: 'MRN002',
    name: 'Jane Smith',
    dob: '1985-10-20',
    email: 'jane@example.com',
  },
];

async function seed() {
  console.log('Seeding database...');

  for (const patient of seedPatients) {
    try {
      // Encrypt PHI fields
      const nameEnc = encrypt(patient.name);
      const dobEnc = encrypt(patient.dob);
      const emailEnc = encrypt(patient.email);

      await db.Patient.create(
        patient.mrn,
        nameEnc,
        dobEnc,
        emailEnc
      );
      console.log(\`Created patient: \${patient.mrn}\`);
    } catch (err) {
      console.error(\`Error creating patient: \${err.message}\`);
    }
  }

  console.log('Seeding complete');
}

seed().catch(console.error);`,
          },
          {
            name: 'backup.sh',
            path: 'scripts/backup.sh',
            language: 'shell',
            content: `#!/bin/bash

# Devsec Database Backup Script
# Usage: ./backup.sh

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/Devsec_backup_$TIMESTAMP.sql"

mkdir -p "$BACKUP_DIR"

echo "Starting database backup..."

pg_dump \\
  -h "$DB_HOST" \\
  -U "$DB_USER" \\
  -d "$DB_NAME" \\
  -F c \\
  -f "$BACKUP_FILE"

echo "Backup completed: $BACKUP_FILE"

# Keep only last 7 backups
find "$BACKUP_DIR" -name "Devsec_backup_*.sql" -mtime +7 -delete

echo "Cleanup complete"`,
          },
          {
            name: 'rotate-keys.sh',
            path: 'scripts/rotate-keys.sh',
            language: 'shell',
            content: `#!/bin/bash

# Encryption Key Rotation Script
# Rotates PHI encryption keys for compliance

set -e

echo "Starting encryption key rotation..."

# Generate new key
NEW_KEY=$(openssl rand -hex 32)
NEW_KEY_ID=$(date +%s)

echo "New Key ID: $NEW_KEY_ID"

# Log rotation start
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" <<EOF
INSERT INTO key_rotation_log (old_key_id, new_key_id, status)
VALUES ('$OLD_KEY_ID', '$NEW_KEY_ID', 'in_progress');
EOF

echo "Re-encrypting patient data..."
# Application would perform re-encryption here

# Update rotation status
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" <<EOF
UPDATE key_rotation_log SET status = 'completed' WHERE new_key_id = '$NEW_KEY_ID';
EOF

echo "Key rotation completed successfully"`,
          },
        ],
      },
      {
        name: '.env.example',
        path: '.env.example',
        language: 'plaintext',
        content: `NODE_ENV=development
PORT=4000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=Devsec
DB_USER=Devsec
DB_PASSWORD=your_secure_password_here

JWT_SECRET=your_jwt_secret_key_here_change_in_production

ENCRYPT_ALGO=aes-256-gcm
ENCRYPT_KEY_ID=key_v1`,
      },
      {
        name: 'package.json',
        path: 'package.json',
        language: 'json',
        content: `{
  "name": "Devsec-backend",
  "version": "1.0.0",
  "description": "AI-powered SRE assistant for healthcare platform",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "seed": "node scripts/seed.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "pg": "^8.8.0",
    "jsonwebtoken": "^9.0.0",
    "dotenv": "^16.0.3"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}`,
      },
    ],
  },
];

export default function FileExplorer({ onFileSelect, selectedFile }) {
  const [openFolders, setOpenFolders] = useState(new Set(['src', 'src/api', 'src/db', 'infra', 'scripts']));

  const toggleFolder = (path) => {
    const newOpen = new Set(openFolders);
    if (newOpen.has(path)) {
      newOpen.delete(path);
    } else {
      newOpen.add(path);
    }
    setOpenFolders(newOpen);
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop();
    const iconMap = {
      js: '[js]',
      sql: '[sq]',
      yml: '[ym]',
      yaml: '[ym]',
      sh: '[sh]',
      json: '[{}]',
      env: '[ev]',
      Dockerfile: '[dk]',
      conf: '[cf]',
    };
    return iconMap[ext] || '[  ]';
  };

  const getIconColor = (fileName) => {
    const ext = fileName.split('.').pop();
    const colorMap = {
      js: 'text-yellow-600',
      sql: 'text-blue-500',
      yml: 'text-orange-500',
      yaml: 'text-orange-500',
      sh: 'text-green-500',
      json: 'text-gray-400',
      env: 'text-purple-400',
      Dockerfile: 'text-orange-400',
      conf: 'text-gray-500',
    };
    return colorMap[ext] || 'text-gray-600';
  };

  const renderTree = (items, depth = 0) => {
    return items.map((item) => (
      <div key={item.path || item.name}>
        <div
          className={`flex items-center gap-2 px-3 py-1 text-sm cursor-pointer transition-colors ${
            item.type === 'folder'
              ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
              : selectedFile?.path === item.path
                ? 'bg-gray-800 text-blue-400'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
          }`}
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
          onClick={() => {
            if (item.type === 'folder') {
              toggleFolder(item.path);
            } else {
              onFileSelect(item);
            }
          }}
        >
          {item.type === 'folder' ? (
            <>
              <svg
                className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${openFolders.has(item.path) ? 'rotate-90' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              <span className="text-gray-400">{item.name}</span>
            </>
          ) : (
            <>
              <span className={getIconColor(item.name)}>{getFileIcon(item.name)}</span>
              <span>{item.name}</span>
            </>
          )}
        </div>
        {item.type === 'folder' && openFolders.has(item.path) && item.children && renderTree(item.children, depth + 1)}
      </div>
    ));
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {renderTree(FILE_TREE)}
      </div>
    </div>
  );
}
