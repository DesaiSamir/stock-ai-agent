import { ActionRegistry } from '@/actions/registry';
import { ToolRegistry } from '@/tools/registry';
import { ActionTypes } from '@/constants/actions';
import { BaseAgent } from '../base';
import type { AgentContext, AgentResult, AgentTask } from '../types';
import { logger } from '@/utils/logger';

export class NewsAgent extends BaseAgent {
  public readonly name = 'NewsAgent';
  public readonly description = 'Analyzes news and market events';
  public readonly capabilities: Array<keyof typeof ActionTypes> = [
    'ANALYZE_NEWS',
    'GET_NEWS',
    'GET_EVENTS'
  ];

  constructor(
    actionRegistry: ActionRegistry,
    toolRegistry: ToolRegistry
  ) {
    super(actionRegistry, toolRegistry);
  }

  public async execute(
    input: string | AgentTask,
    context: AgentContext
  ): Promise<AgentResult> {
    if (typeof input === 'string') {
      return this.handleNaturalLanguageInput(input, context);
    }
    return this.handleStructuredTask(input, context);
  }

  private async handleNaturalLanguageInput(
    input: string,
    context: AgentContext
  ): Promise<AgentResult> {
    logger.info({
      agent: 'NewsAgent',
      input,
      context
    });
    return this.createErrorResult('Natural language processing not implemented');
  }

  private async handleStructuredTask(
    task: AgentTask,
    context: AgentContext
  ): Promise<AgentResult> {
    if (task.type === 'action') {
      return this.executeAction(task, context);
    } else {
      return this.executeTool(task, context);
    }
  }
} 