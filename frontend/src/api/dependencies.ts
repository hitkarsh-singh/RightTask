import { apiClient } from './client';

export const dependenciesApi = {
  addDependency: async (taskId: string, dependsOnTaskId: string): Promise<void> => {
    await apiClient.post('/dependencies', { taskId, dependsOnTaskId });
  },

  removeDependency: async (taskId: string, dependsOnTaskId: string): Promise<void> => {
    await apiClient.delete('/dependencies', {
      data: { taskId, dependsOnTaskId },
    });
  },

  checkCycle: async (taskId: string, newDependencyId: string): Promise<boolean> => {
    const response = await apiClient.get('/dependencies/cycle-check', {
      params: { taskId, newDependencyId },
    });
    return response.data.hasCycle;
  },

  getTaskDependencies: async (taskId: string): Promise<any[]> => {
    const response = await apiClient.get(`/dependencies/task/${taskId}`);
    return response.data;
  },
};
