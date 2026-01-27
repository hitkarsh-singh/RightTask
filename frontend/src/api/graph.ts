import { apiClient } from './client';
import type { TaskGraph, CriticalPath, ImpactAnalysis } from '../types/graph';

export const graphApi = {
  getTaskGraph: async (): Promise<TaskGraph> => {
    const response = await apiClient.get('/graph/user');
    return response.data;
  },

  getCriticalPath: async (): Promise<CriticalPath> => {
    const response = await apiClient.get('/graph/critical-path');
    return response.data;
  },

  getImpactAnalysis: async (taskId: string, delayHours?: number): Promise<ImpactAnalysis> => {
    const params = delayHours ? { delayHours: delayHours.toString() } : {};
    const response = await apiClient.get(`/graph/impact/${taskId}`, { params });
    return response.data;
  },
};
