import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load environment variables from .env file
dotenv.config();

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export interface AppConfig {
  port: number;
  host: string;
  telegramBotToken: string;
  webAppUrl: string;
  storageDir: string;
  isProduction: boolean;
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '8080', 10),
  host: process.env.HOST || '0.0.0.0',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  webAppUrl: process.env.WEB_APP_URL || 'http://localhost:8080',
  storageDir: process.env.STORAGE_DIR || path.resolve(dirname, '../../storage'),
  isProduction: process.env.NODE_ENV === 'production'
};
