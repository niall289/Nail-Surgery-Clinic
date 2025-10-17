# Webhook Testing and Verification Guide

This document provides instructions for testing the webhook submission functionality in the Nail Surgery Clinic application.

## Overview

The webhook system has been enhanced with the following features:
- Robust retry logic (3 attempts with exponential backoff)
- 30-second timeout per request
- Proper error classification (retry on 5xx and 429, no retry on 4xx except 429)
- Environment-aware logging (dev vs production)
- Enriched payload with source, clinic_group, and preferred_clinic fields
- Support for both base64 and Buffer image formats

## Test Endpoints

### 1. Using the Built-in Test Endpoint

The application includes a test endpoint that you can use to verify webhook functionality:

```bash
# Start the server in development mode
npm run dev:server

# In another terminal, test the webhook
curl -X POST http://localhost:5021/api/test-webhook
```

Expected output:
```json
{
  "message": "Webhook test completed, check server logs for details"
}
```

Check the server console logs to see:
- Masked webhook secret (first 3 chars + '…')
- Truncated payload (~500 chars in dev mode)
- Retry attempts if the webhook endpoint is unreachable
- Success or failure status

### 2. Testing via Consultation Submission

You can also test the webhook by submitting a consultation through the webhook proxy endpoint:

```bash
# Submit a test consultation with webhook forwarding
curl -X POST http://localhost:5021/api/webhook-proxy \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "07123456789",
    "issue_category": "ingrown_toenail",
    "issue_specifics": "Pain in left big toe for 2 weeks"
  }'
```

**Expected responses:**
- `200 OK` with `{"message": "Webhook submitted successfully"}` - Success
- `200 OK` with `{"message": "Webhook attempted", "warning": "..."}` - Soft failure (webhook failed but request accepted)
- `400 Bad Request` - Invalid data format
- `500 Internal Server Error` - Server error

**Note:** The webhook proxy always returns 200 OK even if the external webhook fails, to ensure the chatbot can continue functioning.

### 3. Testing with Image Data

To test webhook submission with an image:

```bash
curl -X POST http://localhost:5021/api/webhook-proxy \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "phone": "07987654321",
    "issue_category": "nail_fungus",
    "issue_specifics": "Discolored nail",
    "has_image": true,
    "image_path": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FAP0XBgFBMGK0AAAAAElFTkSuQmCC"
  }'
```

**Note:** The example above uses a small 10x10 pixel test image. For realistic testing with actual images, you can:
1. Convert a real image to base64: `base64 -i your_image.png` (or use an online tool)
2. Prefix with the data URI scheme: `data:image/png;base64,<your_base64_data>`
3. Test with images of varying sizes to ensure proper handling

## Environment Configuration

Ensure your `.env` file has the following variables set:

```bash
# Webhook Configuration
PORTAL_WEBHOOK_URL=https://eteaportal.engageiobots.com/api/webhooks/nailsurgery
NAIL_WEBHOOK_SECRET=your_actual_secret_here

# Set to development for verbose logging
NODE_ENV=development
```

**Security Warning:** 
- **NEVER commit your actual webhook secret to version control**
- Use a strong, randomly generated secret (at least 32 characters)
- Keep the secret confidential and only share it with authorized personnel
- Rotate the secret periodically for security
- Use different secrets for development and production environments

**Generating a secure secret:**
```bash
# On Linux/Mac:
openssl rand -hex 32

# Or using Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Expected Behavior

### Successful Submission
- Status: 200 OK
- Response includes `success: true`
- Console logs show "✅ Webhook submission successful"

### Failed Submission with Retries
If the webhook endpoint is unreachable or returns 5xx errors:
- The system will retry up to 3 times
- Exponential backoff: 1s, 2s, 4s between attempts
- Console logs show retry attempts
- Final response includes `success: false` with error details

### Non-Retryable Errors (4xx except 429)
- No retries for client errors (400, 401, 403, 404, etc.)
- Immediate failure response
- Console logs show the error status

## Debugging

### Development Mode Logging
In development (`NODE_ENV !== 'production'`), the system logs:
- Webhook URL
- Masked secret (first 3 characters + '…')
- Truncated payload (first 500 characters)
- Retry attempts and backoff times
- Success/failure status

### Production Mode Logging
In production:
- Minimal logging
- No request body logging
- No secret masking logs
- Only success/error status messages

## Payload Enrichment

All webhook submissions automatically include:
```json
{
  "source": "nail_surgery_clinic",
  "clinic_group": "The Nail Surgery Clinic",
  "preferred_clinic": null,
  "...": "other consultation data"
}
```

## Integration Testing

To test the complete flow:

1. Start the server: `npm run dev:server`
2. Open the chatbot interface
3. Submit a consultation through the UI
4. Check server logs for webhook submission details
5. Verify the data reaches the ETEA Portal

## Troubleshooting

### Webhook Secret Issues
- Ensure `NAIL_WEBHOOK_SECRET` is set in `.env`
- Check server logs for masked secret value
- Verify secret matches the one configured in ETEA Portal

### Timeout Issues
- Default timeout is **30 seconds per attempt** (hardcoded, not configurable)
- Total possible wait time: up to 97 seconds (3 attempts × 30s + backoff delays)
- If requests consistently timeout, check network connectivity
- Verify the webhook endpoint is accessible
- Consider if the remote endpoint needs performance optimization

### Image Upload Issues
- Verify base64 images include proper data URI prefix: `data:image/png;base64,...`
- Check image size (very large images may cause issues)
- Ensure Supabase credentials are configured for image storage

### Retry Logic Issues
- 5xx errors and 429 (rate limit) trigger retries
- Other 4xx errors do not trigger retries
- Network errors trigger retries
- Maximum 3 attempts with exponential backoff

## Additional Notes

- The webhook system maintains backward compatibility with existing callers
- Image data can be provided as base64 strings or Buffer objects
- The system uses Node.js 18 built-in `fetch`, `FormData`, and `AbortController`
- No external HTTP libraries are required
