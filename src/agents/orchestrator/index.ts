import { ActionRegistry } from '@/actions/registry';
import { ToolRegistry } from '@/tools/registry';
import { ActionTypes } from '@/constants/actions';
import { BaseAgent } from '../base';
import type { Agent, AgentContext, AgentResult, AgentTask, OrchestratorAgentInterface } from '../types';
import { logger } from '@/utils/logger';
import { promptAgent } from '@/agents/prompt-agent';

export class OrchestratorAgent extends BaseAgent implements OrchestratorAgentInterface {
  public readonly name = 'OrchestratorAgent';
  public readonly description = 'Coordinates between different agents, actions, and tools';
  public readonly capabilities: Array<keyof typeof ActionTypes> = [
    'START_MARKET_ANALYSIS',
    'ANALYZE_MARKET',
    'START_TRADE_EXECUTION',
    'EXECUTE_TRADE'
  ];

  private agents: Agent[] = [];

  constructor(
    actionRegistry: ActionRegistry,
    toolRegistry: ToolRegistry
  ) {
    super(actionRegistry, toolRegistry);
  }

  public registerAgent(agent: Agent): void {
    this.agents.push(agent);
  }

  public getAvailableAgents(): Agent[] {
    return this.agents;
  }

  public async delegate(task: AgentTask, context: AgentContext): Promise<AgentResult> {
    try {
      logger.info({
        agent: 'OrchestratorAgent',
        action: 'delegate',
        task,
        context: { ...context }
      });

      // Find the most suitable agent for the task
      const suitableAgent = this.findSuitableAgent(task);
      if (!suitableAgent) {
        return this.createErrorResult(`No suitable agent found for task: ${task.name}`);
      }

      // Execute the task using the selected agent
      const result = await suitableAgent.execute(task, context);

      // Log the result
      logger.info({
        agent: 'OrchestratorAgent',
        action: 'delegate',
        selectedAgent: suitableAgent.name,
        result: { success: result.success, error: result.error }
      });

      return result;
    } catch (error) {
      logger.error({
        agent: 'OrchestratorAgent',
        action: 'delegate',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return this.createErrorResult(
        error instanceof Error ? error.message : 'Failed to delegate task'
      );
    }
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
    try {
      logger.info({
        agent: 'OrchestratorAgent',
        task: input,
        context: { ...context }
      });

      // Check if task type is supported
      if (input.type !== 'action' && input.type !== 'tool') {
        return this.createErrorResult(`Unsupported task type: ${input.type}`);
      }

      // Execute the task based on type
      if (input.type === 'action') {
        return this.executeAction(input, context);
      } else {
        return this.executeTool(input, context);
      }
    } catch (error) {
      logger.error({
        agent: 'OrchestratorAgent',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return this.createErrorResult(
        error instanceof Error ? error.message : 'Failed to execute task'
      );
    }
  }

  private findSuitableAgent(task: AgentTask): Agent | undefined {
    try {
      // First try to find an exact match for the task name in capabilities
      const exactMatch = this.agents.find(agent =>
        agent.capabilities.includes(task.name as keyof typeof ActionTypes)
      );
      if (exactMatch) {
        return exactMatch;
      }

      // If no exact match, try to find an agent that handles similar tasks
      // Group tasks by domain (market analysis, trading, risk, etc.)
      const taskDomain = this.getTaskDomain(task.name);
      return this.agents.find(agent =>
        agent.capabilities.some(cap => this.getTaskDomain(cap) === taskDomain)
      );
    } catch (error) {
      logger.error({
        agent: 'OrchestratorAgent',
        action: 'findSuitableAgent',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return undefined;
    }
  }

  private getTaskDomain(taskName: string): string {
    if (taskName.includes('MARKET') || taskName.includes('ANALYZE')) {
      return 'market-analysis';
    }
    if (taskName.includes('TRADE') || taskName.includes('ORDER')) {
      return 'trading';
    }
    if (taskName.includes('RISK') || taskName.includes('STOP') || taskName.includes('PROFIT')) {
      return 'risk-management';
    }
    if (taskName.includes('NEWS') || taskName.includes('EVENT')) {
      return 'news';
    }
    if (taskName.includes('PORTFOLIO') || taskName.includes('POSITION')) {
      return 'portfolio';
    }
    return 'general';
  }

  private async handleNaturalLanguageInput(
    input: string,
    context: AgentContext
  ): Promise<AgentResult> {
    try {
      logger.info({
        agent: 'OrchestratorAgent',
        input,
        context: { ...context }
      });

      // Use promptAgent to interpret the natural language input
      const interpretResult = await promptAgent.interpret(input, context);
      if (!interpretResult.success) {
        return this.createErrorResult(`Failed to interpret input: ${interpretResult.error}`);
      }

      const tasks = interpretResult.data as AgentTask[];
      if (!tasks || tasks.length === 0) {
        return this.createErrorResult('No tasks generated from input');
      }

      // Execute all tasks in sequence
      const results = await Promise.all(
        tasks.map(task => this.execute(task, context))
      );

      // Check if any task failed
      const failedTasks = results.filter(result => !result.success);
      if (failedTasks.length > 0) {
        return this.createErrorResult(
          `Some tasks failed: ${failedTasks.map(t => t.error).join(', ')}`
        );
      }

      // Return combined results
      return this.createSuccessResult({
        tasks: tasks.length,
        results: results.map(r => r.data)
      });
    } catch (error) {
      logger.error({
        agent: 'OrchestratorAgent',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return this.createErrorResult(
        error instanceof Error ? error.message : 'Failed to process natural language input'
      );
    }
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