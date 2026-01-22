import { Injectable, Logger } from '@nestjs/common';
import { Neo4jService } from './neo4j.service';
import { Task } from '../tasks/task.entity';

@Injectable()
export class GraphSyncService {
  private readonly logger = new Logger(GraphSyncService.name);

  constructor(private neo4jService: Neo4jService) {}

  /**
   * Sync task to Neo4j graph database
   * Creates/updates Task node and OWNS relationship with User
   */
  async syncTaskToGraph(task: Task): Promise<void> {
    if (!this.neo4jService.isConnected()) {
      this.logger.debug('Neo4j not connected. Skipping graph sync.');
      return;
    }

    try {
      const query = `
        MERGE (u:User {id: $userId})
        MERGE (t:Task {id: $taskId})
        SET t.title = $title,
            t.description = $description,
            t.completed = $completed,
            t.priority = $priority,
            t.createdAt = datetime($createdAt),
            t.updatedAt = datetime($updatedAt)
        MERGE (u)-[:OWNS]->(t)
      `;

      await this.neo4jService.executeWrite(query, {
        userId: task.userId,
        taskId: task.id,
        title: task.title,
        description: task.description || '',
        completed: task.completed,
        priority: task.priority,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      });

      this.logger.debug(`Synced task ${task.id} to Neo4j`);
    } catch (error) {
      this.logger.error(`Failed to sync task ${task.id} to Neo4j:`, error.message);
    }
  }

  /**
   * Delete task from Neo4j graph database
   * Also removes all relationships (DETACH DELETE)
   */
  async deleteTaskFromGraph(taskId: string): Promise<void> {
    if (!this.neo4jService.isConnected()) {
      this.logger.debug('Neo4j not connected. Skipping graph deletion.');
      return;
    }

    try {
      const query = `
        MATCH (t:Task {id: $taskId})
        DETACH DELETE t
      `;

      await this.neo4jService.executeWrite(query, { taskId });
      this.logger.debug(`Deleted task ${taskId} from Neo4j`);
    } catch (error) {
      this.logger.error(`Failed to delete task ${taskId} from Neo4j:`, error.message);
    }
  }

  /**
   * Create dependency relationship in Neo4j
   * taskId DEPENDS_ON dependsOnTaskId
   */
  async createDependency(taskId: string, dependsOnTaskId: string): Promise<void> {
    if (!this.neo4jService.isConnected()) {
      this.logger.debug('Neo4j not connected. Skipping dependency creation.');
      return;
    }

    try {
      const query = `
        MATCH (t1:Task {id: $taskId})
        MATCH (t2:Task {id: $dependsOnTaskId})
        MERGE (t1)-[:DEPENDS_ON]->(t2)
      `;

      await this.neo4jService.executeWrite(query, { taskId, dependsOnTaskId });
      this.logger.debug(`Created dependency: ${taskId} DEPENDS_ON ${dependsOnTaskId}`);
    } catch (error) {
      this.logger.error('Failed to create dependency in Neo4j:', error.message);
      throw error;
    }
  }

  /**
   * Remove dependency relationship from Neo4j
   */
  async removeDependency(taskId: string, dependsOnTaskId: string): Promise<void> {
    if (!this.neo4jService.isConnected()) {
      this.logger.debug('Neo4j not connected. Skipping dependency removal.');
      return;
    }

    try {
      const query = `
        MATCH (t1:Task {id: $taskId})-[r:DEPENDS_ON]->(t2:Task {id: $dependsOnTaskId})
        DELETE r
      `;

      await this.neo4jService.executeWrite(query, { taskId, dependsOnTaskId });
      this.logger.debug(`Removed dependency: ${taskId} DEPENDS_ON ${dependsOnTaskId}`);
    } catch (error) {
      this.logger.error('Failed to remove dependency from Neo4j:', error.message);
    }
  }

  /**
   * Check if creating a dependency would create a cycle
   * Returns true if cycle would be created, false otherwise
   */
  async wouldCreateCycle(taskId: string, newDependencyId: string): Promise<boolean> {
    if (!this.neo4jService.isConnected()) {
      this.logger.debug('Neo4j not connected. Assuming no cycle.');
      return false;
    }

    try {
      // Check if there's already a path from newDependencyId to taskId
      // If there is, adding taskId -> newDependencyId would create a cycle
      const query = `
        MATCH path = (end:Task {id: $newDependencyId})-[:DEPENDS_ON*]->(start:Task {id: $taskId})
        RETURN count(path) > 0 as hasCycle
      `;

      const results = await this.neo4jService.executeQuery<{ hasCycle: boolean }>(query, {
        taskId,
        newDependencyId,
      });

      return results.length > 0 && results[0].hasCycle;
    } catch (error) {
      this.logger.error('Failed to check for cycles:', error.message);
      return false;
    }
  }
}
