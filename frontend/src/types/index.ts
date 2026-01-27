export interface User {
  id: string;
  email: string;
  username: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: number;
  dependencyIds?: string[];
  dueDate?: string;
  estimatedHours?: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: number;
  estimatedHours?: number;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: number;
}
