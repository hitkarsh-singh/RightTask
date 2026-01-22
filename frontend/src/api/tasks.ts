import { apiClient } from './client';
import { Task, CreateTaskRequest, UpdateTaskRequest } from '../types';

export const tasksApi = {
  async getAll(): Promise<Task[]> {
    const response = await apiClient.get<Task[]>('/tasks');
    return response.data;
  },

  async getOne(id: string): Promise<Task> {
    const response = await apiClient.get<Task>(`/tasks/${id}`);
    return response.data;
  },

  async create(data: CreateTaskRequest): Promise<Task> {
    const response = await apiClient.post<Task>('/tasks', data);
    return response.data;
  },

  async update(id: string, data: UpdateTaskRequest): Promise<Task> {
    const response = await apiClient.patch<Task>(`/tasks/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/tasks/${id}`);
  },

  async toggleComplete(id: string): Promise<Task> {
    const response = await apiClient.patch<Task>(`/tasks/${id}/toggle`);
    return response.data;
  },
};
