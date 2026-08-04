import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sqliteConnection } from './sqlite';
import * as userSchema from '../../database/schema/user.model';

export const db = drizzle(sqliteConnection, { schema: { ...userSchema } });