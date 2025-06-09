import { registerAllActions } from '@/actions';
import { registerAllTools } from '@/tools';
import { registerAllAgents } from '@/agents';
import { logger } from '@/utils/logger';

export function initializeApp() {
  try {
    // Register action handlers
    registerAllActions();
    logger.info({ message: 'Actions registered successfully' });

    // Register tools
    registerAllTools();
    logger.info({ message: 'Tools registered successfully' });

    // Register agents
    registerAllAgents();
    logger.info({ message: 'Agents registered successfully' });
  } catch (error) {
    logger.error({
      message: 'Error during app initialization',
      error: error instanceof Error ? error : new Error('Unknown error')
    });
    throw error;
  }
}