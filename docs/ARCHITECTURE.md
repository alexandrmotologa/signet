# Architecture and Technical Design

This document details the internal design of Signet, covering coordinate transformation mathematics, the ephemeral storage lifecycle, Telegram authentication, and vector stamping.

## 1. Coordinate Transformation Mechanics

A frequent point of failure in web-based PDF annotation is coordinate mismatch between browser rendering viewports and PDF page dimensions:

- Browser coordinates use HTML5 Canvas pixels measured from the top-left origin `(0, 0)`, scaling with viewport width, container padding, and device pixel ratio (DPR).
- PDF coordinates use 72 points per inch (PPI) with a bottom-left origin `(0, 0)`. In PDF specifications, the y-axis points upwards, whereas in browser canvases it points downwards.

### Mathematical Conversion Model

Signet standardizes all placement positions through normalized coordinates relative to the rendered canvas:

```
normalizedX = clientX / renderedCanvasWidth
normalizedY = clientY / renderedCanvasHeight
normalizedWidth = elementWidth / renderedCanvasWidth
normalizedHeight = elementHeight / renderedCanvasHeight
```

When the client requests signing, the server loads the target page using `pdf-lib` and extracts the native page dimensions (`page.getWidth()` and `page.getHeight()`).

The absolute PDF coordinates are calculated as follows:

```typescript
const pdfX = normalizedX * pageWidth;
const pdfWidth = normalizedWidth * pageWidth;
const pdfHeight = normalizedHeight * pageHeight;

// Invert the y-axis for bottom-left origin
const pdfY = pageHeight - (normalizedY * pageHeight) - pdfHeight;
```

This model ensures millimeter-accurate placement regardless of whether the user is reviewing the document on a compact mobile screen or a wide desktop monitor.

## 2. Ephemeral Storage Lifecycle

To preserve privacy and prevent unbounded disk usage, Signet treats all documents as ephemeral:

1. **Intake**: When a PDF arrives via Telegram or direct upload, `tempStore` calculates its SHA-256 hash and writes the file to the configured storage directory using a cryptographically random UUIDv4 document ID.
2. **Metadata Cache**: Document metadata (file size, SHA-256 hash, page count, and creation timestamp) is retained in an in-memory index for fast lookup.
3. **Hourly Sweeper**: A background interval runs every 10 minutes. Any document whose creation timestamp is older than 60 minutes is permanently removed from disk and purged from the in-memory cache.

## 3. Telegram Authentication and Security

Requests originating from the Telegram Mini App pass the `initData` query string supplied by the Telegram client.

The verification process follows Telegram's standard specification:

1. Extract all parameters from `initData` except `hash`.
2. Sort the parameter key-value pairs alphabetically and format them as `key=value\n`.
3. Compute the secret key by calculating `HMAC_SHA256("WebAppData", bot_token)`.
4. Calculate the verification hash using `HMAC_SHA256(secret_key, data_check_string)`.
5. Compare the resulting hex string with the provided `hash` using timing-safe string comparison.

When valid, the server extracts the user's Telegram ID and username to associate with document export permissions and audit records.

## 4. Audit Trail and Tamper Evidence

Signet offers an optional verification page appended to the signed document. This page records:

- Original document SHA-256 digest prior to any edits.
- Final stamped document SHA-256 digest.
- Telegram user ID, display name, and username of the signer.
- ISO 8601 UTC timestamp of execution.
- Ephemeral document identifier and signing transaction checksum.

In addition, standard PDF metadata entries (`Keywords`, `Producer`, `Custom Metadata`) are updated with the audit fingerprint.
