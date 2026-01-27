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
  type: 'DEPENDS_ON' | 'BLOCKS';
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
        OPTIONAL MATCH (t)-[b:BLOCKS]->(blocked:Task)
        RETURN t.id as taskId, t.title as title, t.completed as completed, t.priority as priority,
               collect(DISTINCT {source: t.id, target: dep.id, type: 'DEPENDS_ON'}) as dependencies,
               collect(DISTINCT {source: t.id, target: blocked.id, type: 'BLOCKS'}) as blocks
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

        // Add DEPENDS_ON edges
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

        // Add BLOCKS edges
        if (record.blocks && Array.isArray(record.blocks)) {
          record.blocks.forEach((block: any) => {
            if (block.target) {
              edges.push({
                source: block.source,
                target: block.target,
                type: 'BLOCKS',
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

  /**
   * Calculate the critical path in the task dependency graph
   * Returns the longest path based on estimatedHours
   */
  async getCriticalPath(userId: string): Promise<{
    path: Task[];
    totalHours: number;
    criticalTaskIds: string[];
  }> {
    if (!this.neo4jService.isConnected()) {
      return this.calculateCriticalPathFromSQLite(userId);
    }

    try {
      // Use Neo4j to find the critical path
      const query = `
        MATCH (u:User {id: $userId})-[:OWNS]->(t:Task)
        OPTIONAL MATCH path = (t)-[:DEPENDS_ON*]->(dep:Task)
        WITH t, path,
             CASE WHEN path IS NULL THEN [t]
                  ELSE nodes(path)
             END AS pathNodes
        WITH pathNodes,
             reduce(total = 0, node IN pathNodes |
               total + coalesce(node.estimatedHours, 0)) AS pathDuration
        RETURN pathNodes, pathDuration
        ORDER BY pathDuration DESC
        LIMIT 1
      `;

      const results = await this.neo4jService.executeQuery<any>(query, { userId });

      if (results.length === 0) {
        return { path: [], totalHours: 0, criticalTaskIds: [] };
      }

      const pathNodeIds = results[0].pathNodes.map((node: any) => node.properties.id);
      const totalHours = results[0].pathDuration;

      // Fetch full task objects from SQLite
      const tasks = await this.tasksRepository.find({
        where: {
          id: In(pathNodeIds),
          userId,
        },
      });

      return {
        path: tasks,
        totalHours,
        criticalTaskIds: pathNodeIds,
      };
    } catch (error) {
      // Fallback to SQLite calculation
      return this.calculateCriticalPathFromSQLite(userId);
    }
  }

  /**
   * Calculate critical path using SQLite data (fallback)
   */
  private async calculateCriticalPathFromSQLite(userId: string): Promise<{
    path: Task[];
    totalHours: number;
    criticalTaskIds: string[];
  }> {
    const tasks = await this.tasksRepository.find({
      where: { userId },
    });

    if (tasks.length === 0) {
      return { path: [], totalHours: 0, criticalTaskIds: [] };
    }

    // Build adjacency list
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    tasks.forEach(task => {
      graph.set(task.id, task.dependencyIds || []);
      inDegree.set(task.id, 0);
    });

    // Calculate in-degrees
    tasks.forEach(task => {
      (task.dependencyIds || []).forEach(depId => {
        inDegree.set(depId, (inDegree.get(depId) || 0) + 1);
      });
    });

    // Find longest path using dynamic programming
    const memo = new Map<string, { duration: number; path: string[] }>();

    const calculateLongestPath = (taskId: string): { duration: number; path: string[] } => {
      if (memo.has(taskId)) {
        return memo.get(taskId)!;
      }

      const task = tasks.find(t => t.id === taskId);
      if (!task) {
        return { duration: 0, path: [] };
      }

      const dependencies = task.dependencyIds || [];
      if (dependencies.length === 0) {
        const result = {
          duration: task.estimatedHours || 0,
          path: [taskId],
        };
        memo.set(taskId, result);
        return result;
      }

      let maxDuration = 0;
      let maxPath: string[] = [];

      dependencies.forEach(depId => {
        const { duration, path } = calculateLongestPath(depId);
        if (duration > maxDuration) {
          maxDuration = duration;
          maxPath = path;
        }
      });

      const result = {
        duration: maxDuration + (task.estimatedHours || 0),
        path: [taskId, ...maxPath],
      };
      memo.set(taskId, result);
      return result;
    };

    // Calculate for all tasks and find the maximum
    let criticalPath: string[] = [];
    let maxTotalHours = 0;

    tasks.forEach(task => {
      const { duration, path } = calculateLongestPath(task.id);
      if (duration > maxTotalHours) {
        maxTotalHours = duration;
        criticalPath = path;
      }
    });

    const criticalTasks = tasks.filter(t => criticalPath.includes(t.id));

    return {
      path: criticalTasks,
      totalHours: maxTotalHours,
      criticalTaskIds: criticalPath,
    };
  }

  /**
   * Calculate impact analysis for a specific task
   * Shows which tasks would be affected if this task is delayed
   */
  async getImpactAnalysis(taskId: string, userId: string, delayHours: number = 0): Promise<{
    affectedTasks: Task[];
    totalImpactedTasks: number;
    impactedTaskIds: string[];
  }> {
    // Verify task exists
    const task = await this.tasksRepository.findOne({
      where: { id: taskId, userId },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    if (!this.neo4jService.isConnected()) {
      return this.calculateImpactFromSQLite(taskId, userId);
    }

    try {
      // Find all tasks that depend on this task (directly or transitively)
      const query = `
        MATCH (source:Task {id: $taskId})<-[:DEPENDS_ON*]-(affected:Task)
        MATCH (u:User {id: $userId})-[:OWNS]->(affected)
        RETURN DISTINCT affected.id as affectedId
      `;

      const results = await this.neo4jService.executeQuery<{ affectedId: string }>(query, {
        taskId,
        userId,
      });

      const affectedIds = results.map(r => r.affectedId);

      if (affectedIds.length === 0) {
        return { affectedTasks: [], totalImpactedTasks: 0, impactedTaskIds: [] };
      }

      const affectedTasks = await this.tasksRepository.find({
        where: {
          id: In(affectedIds),
          userId,
        },
      });

      return {
        affectedTasks,
        totalImpactedTasks: affectedTasks.length,
        impactedTaskIds: affectedIds,
      };
    } catch (error) {
      return this.calculateImpactFromSQLite(taskId, userId);
    }
  }

  /**
   * Calculate impact using SQLite data (fallback)
   */
  private async calculateImpactFromSQLite(taskId: string, userId: string): Promise<{
    affectedTasks: Task[];
    totalImpactedTasks: number;
    impactedTaskIds: string[];
  }> {
    const allTasks = await this.tasksRepository.find({
      where: { userId },
    });

    // Build reverse dependency graph (who depends on whom)
    const affectedIds = new Set<string>();
    const queue: string[] = [taskId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;

      // Find all tasks that depend on currentId
      allTasks.forEach(t => {
        if ((t.dependencyIds || []).includes(currentId) && !affectedIds.has(t.id)) {
          affectedIds.add(t.id);
          queue.push(t.id);
        }
      });
    }

    const affectedTasks = allTasks.filter(t => affectedIds.has(t.id));

    return {
      affectedTasks,
      totalImpactedTasks: affectedTasks.length,
      impactedTaskIds: Array.from(affectedIds),
    };
  }
}
