import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  schema: './src/database/schema/*.model.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DB_FILE || './database/sysnetdef.db',
  },
  verbose: true,
  strict: true,
});