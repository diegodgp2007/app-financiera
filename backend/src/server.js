import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { closeDatabase } from './database.js';

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'API financiera funcionando' });
});

app.listen(port, () => {
  console.log(`API disponible en http://localhost:${port}`);
  console.log('Base SQLite lista.');
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    closeDatabase();
    process.exit(0);
  });
}
