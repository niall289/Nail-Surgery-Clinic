# Integration Test Suite

## Partial Upload Tests

```typescript
describe('Partial Upload Flow', () => {
  it('should handle individual field updates', async () => {
    const response = await fetch(`${API_URL}/api/v1/webhook/partial`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        field: 'name',
        value: 'Test Patient'
      })
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.consultation.name).toBe('Test Patient');
  });

  it('should update existing consultation', async () => {
    const response = await fetch(`${API_URL}/api/v1/webhook/partial`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consultationId: 1,
        field: 'email',
        value: 'test@example.com'
      })
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.consultation.email).toBe('test@example.com');
  });

  it('should handle final submission', async () => {
    const response = await fetch(`${API_URL}/api/v1/webhook/partial`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        field: 'final_submission',
        consultationData: {
          name: 'Test Patient',
          email: 'test@example.com',
          phone: '07123456789',
          issue_category: 'test_issue'
        }
      })
    });
    
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.consultation.name).toBe('Test Patient');
  });
});
```

## Webhook Submission Tests

```typescript
describe('Webhook Submission', () => {
  it('should submit webhook successfully', async () => {
    const result = await submitWebhook({
      name: 'Test Patient',
      email: 'test@example.com'
    });
    
    expect(result.success).toBe(true);
    expect(result.message).toBe('Webhook submitted successfully');
  });

  it('should handle missing webhook secret', async () => {
    process.env.WEBHOOK_SECRET = '';
    
    const result = await submitWebhook({
      name: 'Test Patient'
    });
    
    expect(result.success).toBe(false);
    expect(result.message).toBe('WEBHOOK_SECRET missing');
  });

  it('should handle webhook failure', async () => {
    process.env.PORTAL_WEBHOOK_URL = 'http://invalid-url';
    
    const result = await submitWebhook({
      name: 'Test Patient'
    });
    
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/Webhook (failed|exception)/);
  });
});
```

## Image Processing Tests

```typescript
describe('Image Processing', () => {
  const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';

  it('should upload base64 image', async () => {
    const imageUrl = await uploadBase64Image(base64Image);
    expect(imageUrl).toMatch(/^https:.*\.png$/);
  });

  it('should handle invalid base64', async () => {
    const imageUrl = await uploadBase64Image('invalid-base64');
    expect(imageUrl).toBeNull();
  });

  it('should include image URL in webhook', async () => {
    const result = await submitWebhook({
      name: 'Test Patient'
    }, base64Image);
    
    expect(result.success).toBe(true);
    expect(result.response.image_url).toMatch(/^https:.*\.png$/);
  });
});
```

## Integration Flow Tests

```typescript
describe('Full Integration Flow', () => {
  it('should complete full consultation flow', async () => {
    // 1. Start consultation with name
    const nameResponse = await fetch(`${API_URL}/api/v1/webhook/partial`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        field: 'name',
        value: 'Test Patient'
      })
    });
    const { consultation: { id } } = await nameResponse.json();
    
    // 2. Add email
    await fetch(`${API_URL}/api/v1/webhook/partial`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consultationId: id,
        field: 'email',
        value: 'test@example.com'
      })
    });
    
    // 3. Add image
    await fetch(`${API_URL}/api/v1/webhook/partial`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consultationId: id,
        field: 'image_path',
        value: base64Image
      })
    });
    
    // 4. Complete consultation
    const finalResponse = await fetch(`${API_URL}/api/v1/webhook/partial`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consultationId: id,
        field: 'final_submission',
        consultationData: {
          name: 'Test Patient',
          email: 'test@example.com',
          image_path: base64Image,
          issue_category: 'test_issue'
        }
      })
    });
    
    const finalData = await finalResponse.json();
    expect(finalData.success).toBe(true);
    expect(finalData.consultation.name).toBe('Test Patient');
    expect(finalData.consultation.email).toBe('test@example.com');
    expect(finalData.consultation.image_url).toBeDefined();
  });
});
```

## Error Handling Tests

```typescript
describe('Error Handling', () => {
  it('should handle invalid consultation data', async () => {
    const response = await fetch(`${API_URL}/api/v1/webhook/partial`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        field: 'final_submission',
        consultationData: {
          // Missing required fields
        }
      })
    });
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.errors).toBeDefined();
  });

  it('should handle missing field/value', async () => {
    const response = await fetch(`${API_URL}/api/v1/webhook/partial`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Missing field or value');
  });

  it('should handle image upload failures', async () => {
    const invalidImage = 'data:image/png;base64,invalid';
    
    const response = await fetch(`${API_URL}/api/v1/webhook/partial`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        field: 'image_path',
        value: invalidImage
      })
    });
    
    expect(response.status).toBe(200);
    // Should continue without image
  });
});
```