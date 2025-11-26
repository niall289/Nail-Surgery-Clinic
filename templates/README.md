# Template Configuration Guide

This directory contains template files for setting up a new clinic chatbot integration. Follow these steps to configure the templates for your specific clinic:

## Files Overview

1. `supabase.template.ts` - Core integration with Supabase and webhook handling
2. `routes.template.ts` - API endpoints and webhook routes
3. `storage.template.ts` - Database operations and storage management

## Configuration Steps

1. Replace clinic-specific values in `supabase.template.ts`:
   ```typescript
   const CLINIC_CONFIG = {
     name: '{{CLINIC_NAME}}',           // e.g. 'The Nail Surgery Clinic'
     source: '{{CLINIC_SOURCE}}',       // e.g. 'nailsurgery'
     chatbotSource: '{{CHATBOT_SOURCE}}', // e.g. 'nailsurgery'
     domain: '{{CLINIC_DOMAIN}}',       // e.g. 'nailsurgeryclinic.engageiobots.com'
     imagePrefix: '{{IMAGE_PREFIX}}',    // e.g. 'nail_image'
     webhookPath: '{{WEBHOOK_PATH}}'    // e.g. 'nailsurgery'
   };
   ```

2. Configure endpoints in `routes.template.ts`:
   ```typescript
   const ENDPOINT_CONFIG = {
     apiPrefix: '/api/v1',                   // API version prefix
     webhookPath: '/webhook',                // Main webhook path
     partialPath: '/webhook/partial'         // Partial sync endpoint
   };
   ```

3. Set up database config in `storage.template.ts`:
   ```typescript
   const DB_CONFIG = {
     consultationsTable: 'consultations',    // Table for consultation records
     storageTable: 'files'                  // Table for file storage
   };
   ```

## Environment Variables

Required environment variables:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase service role key
- `PORTAL_WEBHOOK_URL` - Portal webhook endpoint (optional)
- `WEBHOOK_SECRET` - Secret for webhook authentication
- `PORT` - Server port (defaults to 3000)

## Testing

1. Use the `/api/v1/health` endpoint to verify the server is running
2. Test webhook submission with `/api/v1/test-webhook`
3. Verify partial sync with the `/api/v1/webhook/partial` endpoint

## Integration Flow

1. Client collects consultation data progressively
2. Each field update is sent to `/webhook/partial`
3. Final submission triggers webhook forwarding
4. Images are processed and stored in Supabase
5. Complete consultation data is sent to the portal

## Error Handling

- All endpoints include error handling
- Webhook failures don't prevent local saves
- Image processing includes fallbacks
- Development mode provides detailed logging

## Security Notes

1. Always use `WEBHOOK_SECRET` for authentication
2. Validate all incoming data against schema
3. Use HTTPS in production
4. Implement rate limiting as needed