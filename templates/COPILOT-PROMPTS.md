# GitHub Copilot Prompts for FootCare Implementation

## Working Portal Configuration

Use this exact configuration for successful portal submissions:

```markdown
To configure your chatbot for successful portal submissions, use these exact production values:

1. Database Configuration:
- Supabase URL: https://oszmxxeycbfbvsojosva.supabase.co
- Database URL: postgresql://postgres:[YOUR-PASSWORD]@db.oszmxxeycbfbvsojosva.supabase.co:5432/postgres
- Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zem14eGV5Y2JmYnZzb2pvc3ZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIzNDE0NiwiZXhwIjoyMDc0ODEwMTQ2fQ._gCFTr0ozB_IJzqM-ds3-ccsjK74dq0XI9dr2xUeAaQ
- Storage Bucket: triageimages

2. Webhook Configuration:
- Base URL: https://eteaportal.engageiobots.com/api/webhooks/
- Clinic Slug: [your-clinic-slug] (e.g., 'nailsurgery', 'footcare', 'lasercare')
- Full URL Example: https://eteaportal.engageiobots.com/api/webhooks/nailsurgery
- Secret Header: X-Webhook-Secret
- Secret Value Format: [clinicslug]_secret_2025 (e.g., 'nailsurgery_secret_2025')

3. Required Payload Fields:
- name: string
- email: string
- phone: string
- issue_category: string
- symptom_description: string
- clinic_domain: string (e.g., "nailsurgeryclinic.engageiobots.com")
- clinic_source: string (e.g., "chatbot_widget")
- source: string (matches clinic slug, e.g., "nailsurgery")
- chatbotSource: string (same as source)
- clinic_group: string (e.g., "The Nail Surgery Clinic")

4. Optional Fields:
- preferred_clinic: string
- issue_specifics: string
- image_url: string (for uploaded images)

5. Image Handling:
- Upload to Supabase bucket 'triageimages' first
- Add the public URL as image_url in the payload
- OR send raw image data as 'image' field in FormData

6. Request Configuration:
- Method: POST
- Headers: 
  - X-Webhook-Secret: [clinic-specific secret]
  - Content-Type: Set automatically when using FormData

7. Clinic Identification:
- Each clinic has a unique slug (e.g., 'nailsurgery')
- Slug is used in:
  - Webhook URL path
  - Webhook secret
  - Source/chatbotSource fields
  - Domain construction
  - Portal routing and access control

This configuration is based on the working Nail Surgery Clinic implementation.
```

## Configuration & Setup Chat

Initial prompt:
```
I'm implementing a FootCare clinic chatbot based on the Nail Surgery template. I have the following configuration files:
1. footcare.config.ts - Contains clinic-specific values
2. env.template - Environment variable template

Please help me:
1. Verify the configuration values
2. Set up the project structure
3. Initialize the environment
4. Configure TypeScript and dependencies
```

## Database Implementation Chat

Initial prompt:
```
I'm implementing the database layer for the FootCare clinic chatbot. I have:
1. storage.template.ts - Database operations template
2. schema.template.ts - Data model definitions

Please help me:
1. Create the database tables for FootCare
2. Implement the storage functions
3. Set up data migrations
4. Validate the schema implementation
```

## API Implementation Chat

Initial prompt:
```
I'm implementing the API layer for the FootCare clinic chatbot. I have:
1. routes.template.ts - API endpoints template
2. supabase.template.ts - Supabase integration

Please help me:
1. Implement the webhook endpoints
2. Set up image processing
3. Configure error handling
4. Implement partial submission logic
```

## Testing & Validation Chat

Initial prompt:
```
I'm implementing tests for the FootCare clinic chatbot. I have:
1. tests.md - Test case specifications
2. test.config.ts - Test configuration

Please help me:
1. Implement the test cases
2. Set up test data
3. Create integration tests
4. Validate the implementation
```

## Key Points for Each Chat

1. Configuration & Setup:
   - Focus on clinic-specific values
   - Environment configuration
   - Project structure
   - Dependency management

2. Database Implementation:
   - Table creation
   - Storage functions
   - Data migrations
   - Schema validation

3. API Implementation:
   - Webhook endpoints
   - Image processing
   - Error handling
   - Partial submissions

4. Testing & Validation:
   - Test implementation
   - Test data setup
   - Integration testing
   - Validation checks

## Follow-up Questions

For each chat, consider asking:
1. "Is the current implementation following best practices?"
2. "Are there any potential issues to consider?"
3. "What additional error handling might be needed?"
4. "How can we improve performance/reliability?"