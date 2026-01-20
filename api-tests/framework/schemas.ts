// JSON schemas for API response validation (use with AJV)
export const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    email: { type: 'string' },
    username: { type: 'string' },
    roles: { type: 'array', items: { type: 'string' } }
  },
  required: ['id', 'email']
};

export const productSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    sku: { type: 'string' },
    name: { type: 'string' },
    price: { type: 'number' }
  },
  required: ['id', 'sku']
};

export const orderSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    userId: { type: 'string' },
    status: { type: 'string' },
    total: { type: 'number' }
  },
  required: ['id', 'userId', 'status']
};

export const notificationSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    messageId: { type: 'string' }
  },
  required: ['success']
};
