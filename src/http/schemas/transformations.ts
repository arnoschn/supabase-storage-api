export const transformationOptionsSchema = {
  height: { type: 'integer', examples: [100], minimum: 0 },
  width: { type: 'integer', examples: [100], minimum: 0 },
  dpr: { type: 'integer', examples: [1], minimum: 1 },
  resize: { type: 'string', enum: ['cover', 'contain', 'fill'] },
  format: { type: 'string', enum: ['origin', 'avif', 'webp', 'jpeg', 'png'] },
  quality: { type: 'integer', minimum: 20, maximum: 100 },
} as const
