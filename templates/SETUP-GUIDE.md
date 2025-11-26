# FootCare Clinic - Project Setup Guide

## Prerequisites

1. Node.js 16+ installed
2. Supabase project created
3. Access to the EteaPortal
4. Git installed

## Project Setup Steps

1. Clone the Repository
```bash
git clone <repository-url>
cd footcare-clinic-chatbot
```

2. Install Dependencies
```bash
npm install
```

3. Configure Environment Variables
- Copy `env.template` to `.env`
- Fill in required values:
  ```
  SUPABASE_URL=<your-supabase-project-url>
  SUPABASE_KEY=<your-supabase-service-role-key>
  WEBHOOK_SECRET=<your-footcare-webhook-secret>
  ```

4. Initialize Database
```bash
npm run db:setup
```

5. Build the Project
```bash
npm run build
```

6. Start Development Server
```bash
npm run dev
```

## Configuration Checklist

1. Supabase Setup
   - [ ] Project created
   - [ ] Database tables initialized
   - [ ] Storage bucket created
   - [ ] Service role key generated

2. Environment Variables
   - [ ] SUPABASE_URL configured
   - [ ] SUPABASE_KEY configured
   - [ ] WEBHOOK_SECRET configured
   - [ ] PORT set (optional)
   - [ ] PORTAL_WEBHOOK_URL configured (optional)

3. Project Configuration
   - [ ] Clinic values in footcare.config.ts verified
   - [ ] Database table names confirmed
   - [ ] Webhook paths validated
   - [ ] Image prefix set

## Deployment Steps

1. Build Production Version
```bash
npm run build:prod
```

2. Set Production Environment
```bash
NODE_ENV=production
```

3. Start Production Server
```bash
npm start
```

## Testing

1. Run Test Suite
```bash
npm test
```

2. Test Webhook Endpoint
```bash
curl -X POST http://localhost:3000/api/v1/test-webhook
```

3. Verify Portal Integration
```bash
npm run test:integration
```

## Maintenance

1. Update Dependencies
```bash
npm update
```

2. Check Logs
```bash
npm run logs
```

3. Backup Database
```bash
npm run db:backup
```

## Troubleshooting

1. Webhook Issues
   - Verify webhook secret
   - Check portal connectivity
   - Validate payload format

2. Image Processing
   - Confirm storage bucket access
   - Check image size limits
   - Verify MIME types

3. Database Connection
   - Validate Supabase URL
   - Check service role key
   - Verify table permissions

## Support

For technical support:
1. Check documentation in `./docs`
2. Review error logs in `./logs`
3. Contact support team

## Security Notes

1. Never commit .env file
2. Rotate webhook secret regularly
3. Use HTTPS in production
4. Implement rate limiting
5. Monitor access logs