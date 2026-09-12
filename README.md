# Signet

Signet is a self-hosted Telegram Mini App and bot that lets users sign, date, and annotate PDF documents directly on their mobile device without third-party signing services.

The system runs entirely on your own infrastructure. Incoming PDF files are processed using pure JavaScript PDF engines, stamped with cryptographic precision, and returned directly to the user's Telegram chat.

## Architecture

Signet consists of two main components packaged together:

1. **Backend Service (`server/`)**: Built with Node.js, Fastify, and TypeScript. It runs a grammY Telegram bot in long polling mode and uses `pdf-lib` to embed signatures, initials, dates, and optional audit certificates directly into vector PDF documents.
2. **Mini App Frontend (`web/`)**: Built with React 19, Vite, and Tailwind CSS. It uses `pdfjs-dist` to render documents onto an HTML5 canvas and `signature_pad` for smooth touch drawing with Bezier curves. It also includes an in-browser mock container for direct local development outside Telegram.

```
                  +-----------------------------------+
                  |         Telegram Client           |
                  |  (Sends PDF / Opens Mini App)     |
                  +-----------------+-----------------+
                                    |
                    Telegram Bot API / Long Polling
                                    |
                                    v
+-------------------------------------------------------------+
|                         Signet Host                         |
|                                                             |
|  +-------------------------------------------------------+  |
|  |             Fastify HTTP & Telegram Bot               |  |
|  |                                                       |  |
|  |  * Long Polling Bot (/start, document interceptor)    |  |
|  |  * REST API (/api/upload, /api/sign, /api/document)   |  |
|  |  * Ephemeral Store (auto cleanup after 60 minutes)    |  |
|  |  * Coordinate Transformer (Canvas to PDF points)      |  |
|  |  * PDF Stamping Engine (pdf-lib vector embedding)     |  |
|  |  * Audit Trail & SHA-256 Hash Verification            |  |
|  +---------------------------+---------------------------+  |
|                              ^                              |
|                              | REST / JSON + Base64         |
|                              v                              |
|  +-------------------------------------------------------+  |
|  |             Telegram Mini App (React + Vite)          |  |
|  |                                                       |  |
|  |  * PDF Canvas Renderer (pdfjs-dist)                   |  |
|  |  * Touch Signature Pad (Bezier smoothing)             |  |
|  |  * Draggable & Resizable Stamping Overlays            |  |
|  |  * In-Browser Dev Mock Harness                        |  |
|  +-------------------------------------------------------+  |
+-------------------------------------------------------------+
```

## Features

- **Zero third-party dependencies**: Does not rely on DocuSign, Adobe Sign, or paid external APIs.
- **Pure JavaScript PDF manipulation**: Uses `pdf-lib` and `pdfjs-dist` with zero native C/C++ or headless Chromium binaries.
- **Zero domain requirement**: Bot runs via long polling. Local testing runs directly in your browser without requiring a reverse proxy or public HTTPS domain.
- **Accurate coordinate mapping**: Converts CSS canvas coordinates to 72 DPI PDF point units with bottom-left origin across screen orientations and zoom levels.
- **Dual mode signature input**: Sign via finger or stylus drawing, or type your name using cursive typography.
- **Multi-item placement**: Add signatures, dates, and initials anywhere on any page of the document.
- **Tamper-evident audit certificate**: Optional verification sheet appended to the PDF detailing signer credentials, UTC timestamps, and SHA-256 document hashes.
- **Ephemeral storage**: Temporary files automatically expire and get deleted from disk after 60 minutes.
- **Sample documents included**: Pre-loaded mutual NDA and consulting agreement allow instant testing out of the box.

## Quick Start

### Requirements

- Node.js 20 or higher
- npm 10 or higher
- Optional: Docker and Docker Compose

### 1. Clone and install dependencies

```bash
git clone https://github.com/alexandrmotologa/signet.git
cd signet
npm install --prefix server
npm install --prefix web
```

### 2. Configure environment variables

Copy the example configuration:

```bash
cp .env.example .env
```

Edit `.env` and supply your Telegram bot token obtained from `@BotFather`:

```ini
TELEGRAM_BOT_TOKEN=your_token_from_botfather
PORT=8080
HOST=0.0.0.0
WEB_APP_URL=http://localhost:8080
STORAGE_DIR=./storage
```

If you do not have a bot token yet, you can still run the project in mock mode. The server starts normally and the web app runs with a simulated Telegram environment.

### 3. Run development servers

To start the backend server with hot-reload:

```bash
npm run dev:server
```

To start the frontend Vite development server:

```bash
npm run dev:web
```

Open `http://localhost:5173` in your browser to interact with the Mini App inside the mock Telegram shell.

### 4. Build and run in production

```bash
npm run build
npm run start
```

Or with Docker:

```bash
docker compose up --build
```

The unified service will be available on `http://localhost:8080`.

## User Workflow

1. A user sends or forwards a PDF file to the Telegram bot.
2. The bot downloads the file, generates an ephemeral document ID, and replies with a **Sign & Fill Document** button.
3. The user taps the button to open the Telegram Mini App inside Telegram.
4. The user views the document, draws or types their signature, drags it onto the signature line, and taps **Add Date**.
5. The user taps **Save and Send to Telegram**.
6. The server bakes the vector signature onto the specified coordinates and the Telegram bot sends the signed PDF directly back into the chat.

## License

MIT License. See [LICENSE](LICENSE) for details.
