import { AgentContext, AgentResult, AgentTask } from '@/agents/types';
import { logger } from '@/utils/logger';
import { ChatService } from '@/services/chat';
import { getAvailableActions } from '@/actions';
import { getAvailableTools } from '@/tools';
import { v4 as uuidv4 } from 'uuid';

export class PromptAgent {
  name = 'PromptAgent';
  description = 'Interprets natural language input and returns structured tasks.';

  private generateSystemPrompt(): string {
    const actions = getAvailableActions();
    const tools = getAvailableTools();

    // Group actions by domain
    const actionsByDomain = actions.reduce((acc, action) => {
      const domain = this.getActionDomain(action.type);
      if (!acc[domain]) acc[domain] = [];
      acc[domain].push({
        name: action.type,
        description: action.description,
        schema: action.payloadSchema
      });
      return acc;
    }, {} as Record<string, Array<{ name: string; description: string; schema: unknown }>>);

    // Build the prompt
    let prompt = `You are an expert trading assistant. Your job is to interpret user requests and output a JSON array of tasks for the trading system to execute. Each task should use the available actions and include the action name and any required payload.

Available Actions:
`;

    // Add actions by domain
    Object.entries(actionsByDomain).forEach(([domain, domainActions]) => {
      prompt += `\n${domain}:\n`;
      domainActions.forEach(action => {
        prompt += `- ${action.name}: ${action.description}\n`;
      });
    });

    // Add available tools
    if (tools.length > 0) {
      prompt += '\nAvailable Tools:\n';
      tools.forEach(tool => {
        prompt += `- ${tool.type}: ${tool.description}\n`;
      });
    }

    // Add example requests and responses
    prompt += `
Example Requests and Responses:

1. User: "Analyze AAPL and suggest a trade"
Response:
[
  {
    "type": "action",
    "name": "GET_MARKET_DATA",
    "payload": { "symbol": "AAPL" },
    "priority": 1
  },
  {
    "type": "action",
    "name": "ANALYZE_MARKET",
    "payload": { "symbol": "AAPL" },
    "priority": 2
  },
  {
    "type": "action",
    "name": "ANALYZE_NEWS",
    "payload": { "symbol": "AAPL" },
    "priority": 2
  },
  {
    "type": "action",
    "name": "ASSESS_RISK",
    "payload": { "symbol": "AAPL" },
    "priority": 3
  }
]

Always output a valid JSON array of tasks. Each task must have:
- type: "action" or "tool"
- name: One of the available action/tool names
- payload: Object with required parameters
- priority: Number indicating execution order (1 = highest)

Do not include any explanation or extra text in the output.`;

    return prompt;
  }

  private getActionDomain(actionType: string): string {
    if (actionType.includes('MARKET') || actionType.includes('ANALYZE')) {
      return 'Market Analysis';
    }
    if (actionType.includes('TRADE') || actionType.includes('ORDER')) {
      return 'Trade Execution';
    }
    if (actionType.includes('RISK') || actionType.includes('STOP') || actionType.includes('PROFIT')) {
      return 'Risk Management';
    }
    if (actionType.includes('NEWS') || actionType.includes('EVENT')) {
      return 'News and Events';
    }
    if (actionType.includes('PORTFOLIO') || actionType.includes('POSITION')) {
      return 'Portfolio Management';
    }
    return 'General';
  }

  async interpret(input: string, context: AgentContext): Promise<AgentResult> {
    try {
      const systemPrompt = this.generateSystemPrompt();
      const chatService = ChatService.getInstance();
      const conversationId = uuidv4();
      const messages = [
        chatService['createMessage'](systemPrompt, 'system', 'text'),
        chatService['createMessage'](input, 'user', 'text')
      ].map(msg => ({ ...msg, conversationId }));
      logger.info({ agent: 'PromptAgent', messages, context: { ...context } });
      const response = await chatService.sendMessage(messages);
      // Expecting the LLM to return a JSON array of tasks
      const tasks: AgentTask[] = JSON.parse(response.reply);
      return { success: true, data: tasks, error: undefined };
    } catch (error) {
      logger.error({ agent: 'PromptAgent', error: error instanceof Error ? error.message : 'Unknown error' });
      return { success: false, data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const promptAgent = new PromptAgent(); 