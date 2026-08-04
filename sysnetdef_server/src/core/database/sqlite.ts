import Database from 'better-sqlite3';
import { ENV } from '../config/env';
import path from 'path';

export const sqliteConnection = new Database(path.resolve(ENV.DB_FILE));