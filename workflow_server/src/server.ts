import { app } from './app.js';

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Authenticated 3-Tier REST API Server running at http://localhost:${PORT}`);
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error [-4091]: Port ${PORT} is already in use!`);
    console.error(`👉 Solution: Please close existing node process on port ${PORT} or change PORT in .env\n`);
    process.exit(1);
  }
});
