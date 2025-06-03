import { z } from 'zod';

export const ActionSchema = z.object({
  type: z.string(),
  payload: z.record(z.unknown()),
  metadata: z.record(z.unknown()).optional(),
});

export interface ActionHandler {
  type: string;
  description: string;
  payloadSchema: Record<string, unknown>;
  execute: (
    payload: Record<string, unknown>,
    context: ActionContext
  ) => Promise<ActionResult>;
}

export interface ActionContext {
  actionId: string;
  timestamp: string;
  messageId?: string;
  conversationId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface ActionResult {
  success: boolean;
  data?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export type Action = z.infer<typeof ActionSchema>; 