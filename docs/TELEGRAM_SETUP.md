# Telegram Bot and Mini App Setup Guide

This guide describes how to configure your Telegram bot with `@BotFather` and link the Signet Mini App.

## 1. Create a Bot with BotFather

1. Open Telegram and search for `@BotFather`.
2. Send the `/newbot` command.
3. Choose a display name (for example, `Signet Doc Signer`).
4. Choose a unique username ending in `bot` (for example, `SignetPdfSignBot`).
5. Copy the generated API token and place it into your `.env` file under `TELEGRAM_BOT_TOKEN`.

## 2. Configure Bot Commands and Description

Send the following commands to `@BotFather` to customize your bot:

```
/setcommands
start - Start the bot and view sample documents
help - Instructions for signing and filling PDFs
samples - Select a pre-loaded sample contract to sign
```

Set the bot description:

```
/setdescription
Sign, date, and annotate PDF documents directly on mobile without third-party subscriptions.
```

## 3. Configure the Mini App (Menu Button)

To let users launch Signet directly from the chat menu:

1. Send `/setmenubutton` to `@BotFather`.
2. Select your bot.
3. Provide the menu button title: `Open Signet`.
4. Provide your Mini App URL (for example, `https://your-public-url.com` or local tunnel address).

## 4. Local Development Without a Public Domain

You do not need an external HTTPS domain or reverse tunnel to develop or test Signet:

1. The bot uses Long Polling (`getUpdates`), which connects outbound from your machine to Telegram's servers.
2. The web frontend includes an embedded mock container that simulates Telegram's WebApp environment when opened in any standard desktop or mobile browser.
3. If you want to test inside native Telegram on your phone while running locally, you can use a temporary tunnel such as Cloudflare Tunnel (`cloudflared tunnel --url http://localhost:8080`) or ngrok, then configure that URL in `@BotFather`.
