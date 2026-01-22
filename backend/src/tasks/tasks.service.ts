import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Task } from './task.entity';
import { CreateTaskDto, UpdateTaskDto } from './dto';
import { GraphSyncService } from '../graph/graph-sync.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private eventEmitter: EventEmitter2,
    private graphSyncService: GraphSyncService,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: string): Promise<Task> {
    const task = this.tasksRepository.create({
      ...createTaskDto,
      userId,
    });

    const savedTask = await this.tasksRepository.save(task);
    this.eventEmitter.emit('task.created', savedTask);
    return savedTask;
  }

  async findAll(userId: string): Promise<Task[]> {
    return this.tasksRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id, userId },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string): Promise<Task> {
    const task = await this.findOne(id, userId);

    Object.assign(task, updateTaskDto);

    const updatedTask = await this.tasksRepository.save(task);
    this.eventEmitter.emit('task.updated', updatedTask);
    return updatedTask;
  }

  async remove(id: string, userId: string): Promise<void> {
    const task = await this.findOne(id, userId);
    const taskId = task.id; // Store ID before removing
    await this.tasksRepository.remove(task);
    this.eventEmitter.emit('task.deleted', taskId);
  }

  async toggleComplete(id: string, userId: string): Promise<Task> {
    const task = await this.findOne(id, userId);
    task.completed = !task.completed;
    const updatedTask = await this.tasksRepository.save(task);
    this.eventEmitter.emit('task.updated', updatedTask);
    return updatedTask;
  }

  // Event listeners for graph sync
  @OnEvent('task.created')
  async handleTaskCreated(task: Task) {
    await this.graphSyncService.syncTaskToGraph(task);
  }

  @OnEvent('task.updated')
  async handleTaskUpdated(task: Task) {
    await this.graphSyncService.syncTaskToGraph(task);
  }

  @OnEvent('task.deleted')
  async handleTaskDeleted(taskId: string) {
    await this.graphSyncService.deleteTaskFromGraph(taskId);
  }
}
