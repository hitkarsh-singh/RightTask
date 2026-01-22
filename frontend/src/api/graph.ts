import { apiClient } from './client';
import type { TaskGraph } from '../types/graph';

export const graphApi = {
  getTaskGraph: async (): Promise<TaskGraph> => {
    const response = await apiClient.get('/graph/user');
    return response.data;
  },
};
