import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { app } from './app.js';
import { initSocketServer } from './lib/socket.js';

const PORT = process.env.PORT || 4000;
const USE_HTTPS = process.env.USE_HTTPS === 'true' || process.env.ENABLE_HTTPS === 'true';

const certKeyPath = path.resolve('certs/key.pem');
const certOutPath = path.resolve('certs/cert.pem');

let server: http.Server | https.Server;

import { globalPrisma } from './lib/globalPrisma.js';
import { prisma } from './lib/prisma.js';

async function initDefaultWorkspace() {
  try {
    const envDefaultName = process.env.DEFAULT_WORKSPACE_NAME?.trim();
    let defaultWs = await globalPrisma.workspace.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { id: 'asc' },
    });

    if (defaultWs) {
      if (envDefaultName && defaultWs.name !== envDefaultName) {
        defaultWs = await globalPrisma.workspace.update({
          where: { id: defaultWs.id },
          data: { name: envDefaultName },
        });
        console.log(`🏢 [Workspace] Synced default workspace name from env: "${defaultWs.name}" (ID: ${defaultWs.id})`);
      } else {
        const iconDesc = defaultWs.icon
          ? defaultWs.icon.startsWith('data:')
            ? 'Custom PNG'
            : defaultWs.icon
          : 'None';
        console.log(`🏢 [Workspace] Active default workspace: "${defaultWs.name}" (ID: ${defaultWs.id}, Icon: ${iconDesc})`);
      }
    } else {
      const firstAdmin = await globalPrisma.user.findFirst({
        where: { role: 'ADMIN' },
        orderBy: { id: 'asc' },
      });
      const ownerId = firstAdmin ? firstAdmin.id : 1;
      const initialName = envDefaultName || 'AntiGravity';
      defaultWs = await globalPrisma.workspace.create({
        data: {
          name: initialName,
          slug: 'default-workspace',
          dbType: 'postgresql',
          dbUrl: process.env.WORKSPACE_DATABASE_URL || 'postgresql://juyeong:qkrwndud@localhost:5432/workspace',
          ownerId: ownerId,
          status: 'ACTIVE',
        },
      });
      console.log(`🏢 [Workspace] Initialized default workspace: "${defaultWs.name}" (ID: ${defaultWs.id})`);
    }
  } catch (err: any) {
    console.warn(`⚠️ [Workspace Init Warning]:`, err.message);
  }
}

async function logDatabaseConnection() {
  try {
    const userCount = await globalPrisma.user.count();
    const workspaceCount = await globalPrisma.workspace.count();
    const projectCount = await prisma.project.count();
    const issueCount = await prisma.issue.count();

    const globalUrl = process.env.GLOBAL_DATABASE_URL || '';
    const workspaceUrl = process.env.WORKSPACE_DATABASE_URL || '';
    const maskUrl = (u: string) => u.replace(/:([^:@]+)@/, ':****@');

    console.log(`🐘 [PostgreSQL Connected & Active]`);
    console.log(`   - Global DB   : ${maskUrl(globalUrl)} (Users: ${userCount}, Workspaces: ${workspaceCount})`);
    console.log(`   - Workspace DB: ${maskUrl(workspaceUrl)} (Projects: ${projectCount}, Issues: ${issueCount})`);

    await initDefaultWorkspace();
  } catch (err: any) {
    console.error(`❌ [PostgreSQL Connection Error]:`, err.message);
  }
}

// OpenSSL 테스트용 SSL 인증서가 존재하거나 USE_HTTPS=true인 경우 HTTPS 서버 구동
if (fs.existsSync(certKeyPath) && fs.existsSync(certOutPath)) {
  const options = {
    key: fs.readFileSync(certKeyPath),
    cert: fs.readFileSync(certOutPath)
  };
  server = https.createServer(options, app);
  initSocketServer(server);
  server.listen(PORT, async () => {
    console.log(`\n==================================================`);
    console.log(`🔒 [OpenSSL HTTPS Enabled] Secure Server Running!`);
    console.log(`🚀 Address: https://localhost:${PORT}`);
    console.log(`📜 Certs: ${certOutPath}`);
    await logDatabaseConnection();
    console.log(`==================================================\n`);
  });
} else {
  server = http.createServer(app);
  initSocketServer(server);
  server.listen(PORT, async () => {
    console.log(`🚀 Authenticated REST API & Socket.IO Server running at http://localhost:${PORT}`);
    await logDatabaseConnection();
  });
}

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error [-4091]: Port ${PORT} is already in use!`);
    console.error(`👉 Solution: Please close existing node process on port ${PORT} or change PORT in .env\n`);
    process.exit(1);
  }
});
