import crypto from 'node:crypto';
import { config } from '../config.js';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface ValidatedInitData {
  isValid: boolean;
  user?: TelegramUser;
  authDate?: Date;
  rawParams?: Record<string, string>;
}

/**
 * Validates Telegram Mini App initData against the bot token using HMAC-SHA256.
 */
export function validateTelegramInitData(initDataString: string, botToken = config.telegramBotToken): ValidatedInitData {
  if (!initDataString) {
    return { isValid: false };
  }

  // Development fallback when no bot token is configured
  if (!botToken) {
    try {
      const urlParams = new URLSearchParams(initDataString);
      const userParam = urlParams.get('user');
      let user: TelegramUser | undefined;
      if (userParam) {
        user = JSON.parse(userParam);
      }
      return {
        isValid: true,
        user: user || { id: 99999999, first_name: 'Local', username: 'local_dev' }
      };
    } catch {
      return { isValid: true, user: { id: 99999999, first_name: 'Local', username: 'local_dev' } };
    }
  }

  try {
    const urlParams = new URLSearchParams(initDataString);
    const hash = urlParams.get('hash');
    if (!hash) {
      return { isValid: false };
    }

    urlParams.delete('hash');
    const paramsList: string[] = [];
    const rawParams: Record<string, string> = {};

    urlParams.forEach((val, key) => {
      paramsList.push(`${key}=${val}`);
      rawParams[key] = val;
    });

    paramsList.sort();
    const dataCheckString = paramsList.join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    const isMatch = crypto.timingSafeEqual(
      Buffer.from(calculatedHash, 'utf-8'),
      Buffer.from(hash, 'utf-8')
    );

    if (!isMatch) {
      return { isValid: false };
    }

    let user: TelegramUser | undefined;
    if (rawParams.user) {
      try {
        user = JSON.parse(rawParams.user);
      } catch {
        // ignore json parse error
      }
    }

    let authDate: Date | undefined;
    if (rawParams.auth_date) {
      authDate = new Date(parseInt(rawParams.auth_date, 10) * 1000);
    }

    return {
      isValid: true,
      user,
      authDate,
      rawParams
    };
  } catch {
    return { isValid: false };
  }
}
