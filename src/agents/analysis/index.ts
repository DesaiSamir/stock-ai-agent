import { ActionRegistry } from '@/actions/registry';
import { ToolRegistry } from '@/tools/registry';
import { ActionTypes } from '@/constants/actions';
import { BaseAgent } from '../base';
import type { AgentContext, AgentResult, AgentTask } from '../types';
import { logger } from '@/utils/logger';

export class AnalysisAgent extends BaseAgent {
  public readonly name = 'AnalysisAgent';
  public readonly description = 'Performs market analysis and generates trading signals';
  public readonly capabilities: Array<keyof typeof ActionTypes> = [
    'ANALYZE_MARKET',
    'PERFORM_TECHNICAL_ANALYSIS',
    'ANALYZE_NEWS'
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
      // Handle natural language input
      return this.handleNaturalLanguageInput(input, context);
    }

    // Handle structured task
    return this.handleStructuredTask(input, context);
  }

  private async handleNaturalLanguageInput(
    input: string,
    context: AgentContext
  ): Promise<AgentResult> {
    // TODO: Implement natural language processing to determine intent
    // For now, return an error
    logger.info({
      agent: 'AnalysisAgent',
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