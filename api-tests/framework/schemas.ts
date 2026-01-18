// Example JSON schemas (AJV can be used to validate responses)
export const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    email: { type: 'string' }
  },
  required: ['id', 'email']
};

export const productSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    sku: { type: 'string' }
  },
  required: ['id', 'sku']
};
