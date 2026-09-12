# REST API Reference

The Signet backend exposes HTTP endpoints for document management, signing, and Telegram communication.

## Health Check

### `GET /health`
Returns system status, uptime, and storage metrics.

**Response:**
```json
{
  "status": "ok",
  "uptime": 124.5,
  "storage": {
    "activeDocuments": 2,
    "storageDir": "./storage"
  }
}
```

## Documents

### `POST /api/upload`
Uploads a new PDF document. Supports multipart form data (`file` field) or base64 JSON payload.

**Headers:**
- `Content-Type: multipart/form-data` or `Content-Type: application/json`

**Response (`201 Created`):**
```json
{
  "docId": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "contract.pdf",
  "fileSize": 1048576,
  "pageCount": 3,
  "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "expiresAt": "2026-09-12T14:15:00.000Z"
}
```

### `GET /api/document/:id`
Retrieves the raw PDF binary stream for the specified document ID.

**Response:**
- `Content-Type: application/pdf`

### `GET /api/document/:id/meta`
Returns document metadata.

**Response:**
```json
{
  "docId": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "contract.pdf",
  "fileSize": 1048576,
  "pageCount": 3,
  "pages": [
    { "pageIndex": 0, "width": 595.28, "height": 841.89 },
    { "pageIndex": 1, "width": 595.28, "height": 841.89 },
    { "pageIndex": 2, "width": 595.28, "height": 841.89 }
  ],
  "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "createdAt": "2026-09-12T13:15:00.000Z"
}
```

## Stamping and Signing

### `POST /api/sign`
Bakes signatures, initials, and dates into the specified document.

**Request Body:**
```json
{
  "docId": "550e8400-e29b-41d4-a716-446655440000",
  "placements": [
    {
      "pageIndex": 1,
      "normalizedX": 0.55,
      "normalizedY": 0.72,
      "normalizedWidth": 0.25,
      "normalizedHeight": 0.08,
      "type": "signature",
      "data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
    },
    {
      "pageIndex": 1,
      "normalizedX": 0.55,
      "normalizedY": 0.81,
      "normalizedWidth": 0.20,
      "normalizedHeight": 0.04,
      "type": "date",
      "text": "2026-09-12"
    }
  ],
  "includeAuditCertificate": true,
  "signer": {
    "telegramId": 12345678,
    "name": "Alex",
    "username": "alex"
  }
}
```

**Response:**
```json
{
  "signedDocId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "sha256": "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
  "downloadUrl": "/api/document/6ba7b810-9dad-11d1-80b4-00c04fd430c8"
}
```

### `POST /api/export-to-telegram`
Commands the Telegram bot to send the signed PDF directly to the specified user's chat.

**Request Body:**
```json
{
  "signedDocId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "chatId": 12345678,
  "caption": "Here is your signed document: contract_signed.pdf"
}
```

**Response:**
```json
{
  "ok": true,
  "messageId": 452
}
```

## Sample Documents

### `GET /api/samples`
Returns a list of bundled sample contracts.

**Response:**
```json
[
  { "id": "nda", "title": "Mutual Non-Disclosure Agreement", "pages": 2 },
  { "id": "consulting", "title": "Independent Consulting Agreement", "pages": 2 }
]
```

### `GET /api/samples/:name`
Generates or retrieves the sample document as an ephemeral document ID for direct signing.
