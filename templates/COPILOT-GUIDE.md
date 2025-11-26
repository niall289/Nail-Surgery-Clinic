# GitHub Copilot - FootCare Implementation Guide

This directory contains the necessary templates and configurations for implementing the FootCare clinic chatbot. Follow the structure below when creating Copilot chat sessions:

## File Organization

1. Core Configuration (/config)
   - footcare.config.ts
   - env.template
   - tsconfig.json

2. Database Layer (/database)
   - storage.template.ts
   - schema.template.ts
   - migrations.template.sql

3. API Implementation (/api)
   - routes.template.ts
   - supabase.template.ts
   - validation.template.ts

4. Testing (/tests)
   - tests.md
   - test.config.ts

## Copilot Chat Sessions

Organize your Copilot chats by functionality:

1. Configuration & Setup Chat:
   - Upload: footcare.config.ts, env.template
   - Focus: Environment setup, configuration
   
2. Database Implementation Chat:
   - Upload: storage.template.ts, schema.template.ts
   - Focus: Data models, storage logic
   
3. API Implementation Chat:
   - Upload: routes.template.ts, supabase.template.ts
   - Focus: Endpoints, webhooks, image handling
   
4. Testing & Validation Chat:
   - Upload: tests.md, test.config.ts
   - Focus: Test implementation, validation

## Implementation Steps

1. Start with Configuration & Setup Chat:
   - Initialize project structure
   - Configure environment variables
   - Set up clinic-specific values
   
2. Move to Database Implementation Chat:
   - Create database tables
   - Implement storage functions
   - Set up migrations
   
3. Continue with API Implementation Chat:
   - Create API routes
   - Implement webhook handling
   - Set up image processing
   
4. Finish with Testing & Validation Chat:
   - Implement test cases
   - Validate implementations
   - Test deployment setup

## File Distribution Strategy

Each chat should focus on a specific aspect of the implementation to maintain context and clarity. Files should be uploaded at the start of each chat session to provide the necessary context for GitHub Copilot.