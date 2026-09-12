import { Bot, InlineKeyboard, InputFile } from 'grammy';
import { config } from '../config.js';
import { tempStore } from '../storage/tempStore.js';
import { SAMPLES_LIST, generateSamplePdf } from '../pdf/samples.js';

export class SignetBot {
  private bot: Bot | null = null;
  private isRunning = false;

  constructor() {
    if (config.telegramBotToken) {
      try {
        this.bot = new Bot(config.telegramBotToken);
        this.setupHandlers();
      } catch (err) {
        console.warn('[SignetBot] Failed to initialize grammY bot instance:', err);
      }
    } else {
      console.log('[SignetBot] No TELEGRAM_BOT_TOKEN provided. Running in web mock mode.');
    }
  }

  private setupHandlers(): void {
    if (!this.bot) return;

    // Command: /start
    this.bot.command('start', async (ctx) => {
      const keyboard = new InlineKeyboard()
        .webApp('✍️ Sign Sample NDA', `${config.webAppUrl}?sample=nda`)
        .row()
        .webApp('✍️ Sign Consulting Agreement', `${config.webAppUrl}?sample=consulting`)
        .row()
        .text('ℹ️ How to sign your PDF', 'action_help');

      await ctx.reply(
        'Welcome to Signet.\n\n' +
        'Sign, date, and annotate PDF documents directly on your phone without third-party subscriptions.\n\n' +
        'Send or forward any PDF file to this chat to sign it, or choose a sample document below to test the signing workflow.',
        { reply_markup: keyboard }
      );
    });

    // Command: /samples
    this.bot.command('samples', async (ctx) => {
      const keyboard = new InlineKeyboard();
      for (const sample of SAMPLES_LIST) {
        keyboard.webApp(`📄 ${sample.title}`, `${config.webAppUrl}?sample=${sample.id}`).row();
      }

      await ctx.reply('Select a sample agreement to test the signature pad and placement engine:', {
        reply_markup: keyboard
      });
    });

    // Command: /help
    this.bot.command('help', async (ctx) => {
      await ctx.reply(
        'How to use Signet:\n\n' +
        '1. Send or forward any PDF contract, invoice, or NDA to this chat.\n' +
        '2. Tap "Sign & Fill Document" to launch the Mini App.\n' +
        '3. Draw or type your signature and position it on the document.\n' +
        '4. Add a date stamp or initials if needed.\n' +
        '5. Tap "Save and Send to Telegram" to receive the signed vector PDF directly in this chat.'
      );
    });

    // Callback query for inline help button
    this.bot.callbackQuery('action_help', async (ctx) => {
      await ctx.answerCallbackQuery();
      await ctx.reply(
        'Send any PDF file to this chat.\n\n' +
        'Signet will prepare a dedicated signing session and provide a direct launch button for the Mini App.'
      );
    });

    // Document file listener
    this.bot.on('message:document', async (ctx) => {
      const doc = ctx.message.document;
      const isPdf =
        doc.mime_type === 'application/pdf' ||
        (doc.file_name && doc.file_name.toLowerCase().endsWith('.pdf'));

      if (!isPdf) {
        await ctx.reply('Please upload a PDF document. Other file formats are not supported.');
        return;
      }

      const statusMsg = await ctx.reply('Receiving and preparing document for signing...');

      try {
        const file = await ctx.getFile();
        const fileUrl = `https://api.telegram.org/file/bot${config.telegramBotToken}/${file.file_path}`;

        const res = await fetch(fileUrl);
        if (!res.ok) {
          throw new Error(`Failed to fetch file from Telegram: ${res.statusText}`);
        }

        const arrayBuf = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        const filename = doc.file_name || 'document.pdf';

        const meta = await tempStore.saveDocument(buffer, filename);

        const launchUrl = `${config.webAppUrl}?docId=${meta.docId}`;
        const keyboard = new InlineKeyboard().webApp('✍️ Sign & Fill Document', launchUrl);

        await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => {});

        const sizeKb = Math.round(meta.fileSize / 1024);
        await ctx.reply(
          `📄 ${meta.filename}\n` +
          `Pages: ${meta.pageCount} | Size: ${sizeKb} KB\n\n` +
          'Tap below to review, sign, and date your document:',
          { reply_markup: keyboard }
        );
      } catch (err) {
        console.error('[SignetBot] Error downloading document:', err);
        await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => {});
        await ctx.reply('An error occurred while processing your PDF. Please try sending the file again.');
      }
    });
  }

  public async start(): Promise<void> {
    if (!this.bot) return;
    if (this.isRunning) return;

    try {
      this.isRunning = true;
      console.log('[SignetBot] Launching Telegram Bot in Long Polling mode...');
      // Run bot polling non-blocking
      this.bot.start({
        onStart: (botInfo) => {
          console.log(`[SignetBot] Successfully connected as @${botInfo.username}`);
        }
      }).catch((err) => {
        console.warn('[SignetBot] Bot polling error (check token or network):', err.message);
        this.isRunning = false;
      });
    } catch (err) {
      console.warn('[SignetBot] Could not start bot polling:', err);
      this.isRunning = false;
    }
  }

  public async stop(): Promise<void> {
    if (this.bot && this.isRunning) {
      await this.bot.stop();
      this.isRunning = false;
    }
  }

  public async sendSignedDocument(
    chatId: number,
    buffer: Buffer,
    filename: string,
    caption = 'Here is your completed and signed document.'
  ): Promise<{ messageId: number }> {
    if (!this.bot) {
      throw new Error('Telegram bot is not configured on this server.');
    }

    const inputFile = new InputFile(buffer, filename);
    const sent = await this.bot.api.sendDocument(chatId, inputFile, {
      caption: `✅ ${caption}\n\nStamped securely via Signet.`
    });

    return { messageId: sent.message_id };
  }
}

export const signetBot = new SignetBot();
