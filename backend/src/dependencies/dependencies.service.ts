import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task } from '../tasks/task.entity';
import { GraphSyncService } from '../graph/graph-sync.service';
import { Neo4jService } from '../graph/neo4j.service';

export interface GraphNode {
  id: string;
  label: string;
  completed: boolean;
  priority: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'DEPENDS_ON';
}

export interface TaskGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

@Injectable()
export class DependenciesService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private graphSyncService: GraphSyncService,
    private neo4jService: Neo4jService,
  ) {}

  /**
   * Add a dependency relationship between two tasks
   * taskId DEPENDS_ON dependsOnTaskId
   */
  async addDependency(taskId: string, dependsOnTaskId: string, userId: string): Promise<void> {
    // 1. Verify both tasks exist and belong to user
    const task = await this.tasksRepository.findOne({
      where: { id: taskId, userId },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    const dependsOnTask = await this.tasksRepository.findOne({
      where: { id: dependsOnTaskId, userId },
    });

    if (!dependsOnTask) {
      throw new NotFoundException(`Task with ID ${dependsOnTaskId} not found`);
    }

    // 2. Check for self-dependency
    if (taskId === dependsOnTaskId) {
      throw new BadRequestException('A task cannot depend on itself');
    }

    // 3. Check if dependency already exists
    const existingDeps = task.dependencyIds || [];
    if (existingDeps.includes(dependsOnTaskId)) {
      throw new BadRequestException('Dependency already exists');
    }

    // 4. Detect cycles
    const hasCycle = await this.graphSyncService.wouldCreateCycle(taskId, dependsOnTaskId);
    if (hasCycle) {
      throw new BadRequestException('Circular dependency detected');
    }

    // 5. Create relationship in Neo4j
    await this.graphSyncService.createDependency(taskId, dependsOnTaskId);

    // 6. Update task.dependencyIds in SQLite
    task.dependencyIds = [...existingDeps, dependsOnTaskId];
    await this.tasksRepository.save(task);
  }

  /**
   * Remove a dependency relationship between two tasks
   */
  async removeDependency(taskId: string, dependsOnTaskId: string, userId: string): Promise<void> {
    const task = await this.tasksRepository.findOne({
      where: { id: taskId, userId },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    // Remove from Neo4j
    await this.graphSyncService.removeDependency(taskId, dependsOnTaskId);

    // Remove from SQLite
    const existingDeps = task.dependencyIds || [];
    task.dependencyIds = existingDeps.filter(id => id !== dependsOnTaskId);
    await this.tasksRepository.save(task);
  }

  /**
   * Get all tasks that a given task depends on
   */
  async getDependencies(taskId: string, userId: string): Promise<Task[]> {
    const task = await this.tasksRepository.findOne({
      where: { id: taskId, userId },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    const dependencyIds = task.dependencyIds || [];
    if (dependencyIds.length === 0) {
      return [];
    }

    // Fetch all dependency tasks from SQLite
    return this.tasksRepository.find({
      where: {
        id: In(dependencyIds),
        userId,
      },
    });
  }

  /**
   * Get the complete task graph for a user
   * Returns nodes and edges in D3.js compatible format
   */
  async getTaskGraph(userId: string): Promise<TaskGraph> {
    if (!this.neo4jService.isConnected()) {
      // Fallback: Build graph from SQLite data
      return this.buildGraphFromSQLite(userId);
    }

    try {
      const query = `
        MATCH (u:User {id: $userId})-[:OWNS]->(t:Task)
        OPTIONAL MATCH (t)-[d:DEPENDS_ON]->(dep:Task)
        RETURN t.id as taskId, t.title as title, t.completed as completed, t.priority as priority,
               collect({source: t.id, target: dep.id}) as dependencies
      `;

      const results = await this.neo4jService.executeQuery<any>(query, { userId });

      const nodes: GraphNode[] = [];
      const edges: GraphEdge[] = [];

      results.forEach(record => {
        // Add node
        nodes.push({
          id: record.taskId,
          label: record.title,
          completed: record.completed,
          priority: record.priority,
        });

        // Add edges
        if (record.dependencies && Array.isArray(record.dependencies)) {
          record.dependencies.forEach((dep: any) => {
            if (dep.target) {
              edges.push({
                source: dep.source,
                target: dep.target,
                type: 'DEPENDS_ON',
              });
            }
          });
        }
      });

      return { nodes, edges };
    } catch (error) {
      // Fallback to SQLite if Neo4j query fails
      return this.buildGraphFromSQLite(userId);
    }
  }

  /**
   * Build graph from SQLite data (fallback when Neo4j is unavailable)
   */
  private async buildGraphFromSQLite(userId: string): Promise<TaskGraph> {
    const tasks = await this.tasksRepository.find({
      where: { userId },
    });

    const nodes: GraphNode[] = tasks.map(task => ({
      id: task.id,
      label: task.title,
      completed: task.completed,
      priority: task.priority,
    }));

    const edges: GraphEdge[] = [];
    tasks.forEach(task => {
      const dependencyIds = task.dependencyIds || [];
      dependencyIds.forEach(depId => {
        edges.push({
          source: task.id,
          target: depId,
          type: 'DEPENDS_ON',
        });
      });
    });

    return { nodes, edges };
  }

  /**
   * Check if creating a dependency would create a cycle
   */
  async checkCycle(taskId: string, newDependencyId: string, userId: string): Promise<boolean> {
    // Verify both tasks exist and belong to user
    const task = await this.tasksRepository.findOne({
      where: { id: taskId, userId },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    const dependsOnTask = await this.tasksRepository.findOne({
      where: { id: newDependencyId, userId },
    });

    if (!dependsOnTask) {
      throw new NotFoundException(`Task with ID ${newDependencyId} not found`);
    }

    // Check for self-dependency
    if (taskId === newDependencyId) {
      return true;
    }

    return this.graphSyncService.wouldCreateCycle(taskId, newDependencyId);
  }
}
