import type { ToolType } from './tools';
import type { ActionTypes } from '@/constants/actions';

export type ActionType = keyof typeof ActionTypes;

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

export interface ActionConfig {
  name: string;
  description: string;
  requiredTools: ToolType[];
  optionalTools?: ToolType[];
}

export interface ActionPayload {
  [key: string]: unknown;
}

export interface ActionHandler {
  handle: (payload: ActionPayload, context: ActionContext) => Promise<ActionResult>;
}

export interface ActionRequest {
  type: ActionType;
  payload: Record<string, unknown>;
} 