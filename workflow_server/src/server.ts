// -*- coding: utf-8 -*-
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { app } from './app.js';

const PORT = process.env.PORT || 4000;
const USE_HTTPS = process.env.USE_HTTPS === 'true' || process.env.ENABLE_HTTPS === 'true';

const certKeyPath = path.resolve('certs/key.pem');
const certOutPath = path.resolve('certs/cert.pem');

let server: http.Server | https.Server;

// OpenSSL 테스트용 SSL 인증서가 존재하거나 USE_HTTPS=true인 경우 HTTPS 서버 구동
if (fs.existsSync(certKeyPath) && fs.existsSync(certOutPath)) {
  const options = {
    key: fs.readFileSync(certKeyPath),
    cert: fs.readFileSync(certOutPath)
  };
  server = https.createServer(options, app);
  server.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🔒 [OpenSSL HTTPS Enabled] Secure Server Running!`);
    console.log(`🚀 Address: https://localhost:${PORT}`);
    console.log(`📜 Certs: ${certOutPath}`);
    console.log(`==================================================\n`);
  });
} else {
  server = http.createServer(app);
  server.listen(PORT, () => {
    console.log(`🚀 Authenticated REST API Server running at http://localhost:${PORT}`);
  });
}

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error [-4091]: Port ${PORT} is already in use!`);
    console.error(`👉 Solution: Please close existing node process on port ${PORT} or change PORT in .env\n`);
    process.exit(1);
  }
});
