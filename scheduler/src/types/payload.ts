import { z } from 'zod';

/**
 * Maximum payload size in bytes (1MB)
 */
export const MAX_PAYLOAD_SIZE = 1024 * 1024;

/**
 * Generic HTTP payload schema
 * 
 * Validates that the payload is a valid JSON object and doesn't exceed the maximum size.
 */
export const HttpPayloadSchema = z.record(z.unknown())
  .refine(payload => {
    const size = JSON.stringify(payload).length;
    return size <= MAX_PAYLOAD_SIZE;
  }, {
    message: `Payload size exceeds the maximum allowed limit (${MAX_PAYLOAD_SIZE / 1024}KB)`
  });

/**
 * Type for HTTP payload
 */
export type HttpPayload = z.infer<typeof HttpPayloadSchema>;

/**
 * Validate a payload against the HTTP payload schema
 * 
 * @param payload - The payload to validate
 * @returns The validated payload
 * @throws {z.ZodError} If the payload is invalid
 */
export function validatePayload(payload: unknown): HttpPayload {
  return HttpPayloadSchema.parse(payload);
}

/**
 * Safely parse a payload, returning null if invalid
 * 
 * @param payload - The payload to parse
 * @returns The parsed payload or null if invalid
 */
export function safeParsePayload(payload: unknown): HttpPayload | null {
  const result = HttpPayloadSchema.safeParse(payload);
  return result.success ? result.data : null;
}

/**
 * Sanitize a payload by removing any potentially dangerous properties
 * 
 * @param payload - The payload to sanitize
 * @returns The sanitized payload
 */
export function sanitizePayload(payload: Record<string, unknown>): Record<string, unknown> {
  // Create a copy of the payload to avoid modifying the original
  const sanitized = { ...payload };
  
  // Remove any properties that might be dangerous
  const dangerousProps = ['__proto__', 'constructor', 'prototype'];
  for (const prop of dangerousProps) {
    delete sanitized[prop];
  }
  
  // Recursively sanitize nested objects
  for (const [key, value] of Object.entries(sanitized)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizePayload(value as Record<string, unknown>);
    }
  }
  
  return sanitized;
}

/**
 * Validate and sanitize a payload
 * 
 * @param payload - The payload to validate and sanitize
 * @returns The validated and sanitized payload
 * @throws {z.ZodError} If the payload is invalid
 */
export function validateAndSanitizePayload(payload: unknown): HttpPayload {
  // First validate the payload
  const validatedPayload = validatePayload(payload);
  
  // Then sanitize it
  return sanitizePayload(validatedPayload) as HttpPayload;
}
