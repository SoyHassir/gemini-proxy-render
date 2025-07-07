# Gemini API Proxy

A simple Node.js proxy to securely use the Google Gemini API by keeping your API key on the server. Ideal for personal AI projects and easy to deploy on Google Cloud Run.

## Required Setup

### Environment Variables

* `GEMINI_API_KEY` **(Required)**: Your Google Gemini API key.
* `ALLOWED_ORIGINS` (Optional): Comma-separated domains for CORS.

## Endpoints

#### `GET /health`
A health check endpoint to confirm the service is online.

#### `POST /api/gemini`
Proxies requests to the Gemini API. Send a JSON body with a `prompt`:
```json
{
  "prompt": "Your text prompt here"
}
