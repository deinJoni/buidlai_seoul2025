import dotenv from 'dotenv';
import { serve } from '@hono/node-server';
import { app } from './routes.js';
import './jobs.js'; // Start polling job

dotenv.config();

serve({ fetch: app.fetch, port: Number(process.env.PORT) });
console.log(`🚀 Server running on http://localhost:${process.env.PORT}`);
