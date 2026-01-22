import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { tasksApi } from '../api/tasks';
import { useYjs } from '../hooks/useYjs';
import { useAuth } from '../context/AuthContext';

export function TaskList() {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, logout } = useAuth();

  // Use Yjs for real-time collaboration
  const { tasks, addTask, updateTask, deleteTask } = useYjs('main-room');

  // Load initial tasks from backend
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const fetchedTasks = await tasksApi.getAll();
      // Sync tasks to Yjs
      fetchedTasks.forEach((task) => addTask(task));
    } catch (err: any) {
      console.error('Failed to load tasks:', err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setLoading(true);
    setError('');

    try {
      const task = await tasksApi.create({
        title: newTaskTitle,
        description: newTaskDescription || undefined,
      });

      // Add to Yjs (will sync to other clients)
      addTask(task);

      setNewTaskTitle('');
      setNewTaskDescription('');
    } catch (err: any) {
      setError('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const updatedTask = await tasksApi.toggleComplete(task.id);
      updateTask(task.id, updatedTask);
    } catch (err: any) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await tasksApi.delete(taskId);
      deleteTask(taskId);
    } catch (err: any) {
      console.error('Failed to delete task:', err);
    }
  };

  return (
    <div className="task-manager">
      <header className="header">
        <div>
          <h1>🌀 Symbiotic Task Manager</h1>
          <p className="subtitle">
            Real-time collaborative tasks powered by CRDTs • {tasks.length} tasks
          </p>
        </div>
        <div className="user-info">
          <span>👤 {user?.username}</span>
          <button onClick={logout} className="btn-secondary">
            Logout
          </button>
        </div>
      </header>

      <div className="create-task-form">
        <h2>➕ Create New Task</h2>
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleCreateTask}>
          <div className="form-group">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Task title..."
              required
            />
          </div>

          <div className="form-group">
            <textarea
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              placeholder="Task description (optional)..."
              rows={3}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </form>
      </div>

      <div className="tasks-container">
        <h2>📋 Your Tasks</h2>

        {tasks.length === 0 ? (
          <div className="empty-state">
            <p>No tasks yet. Create your first task above!</p>
          </div>
        ) : (
          <div className="tasks-grid">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`task-card ${task.completed ? 'completed' : ''}`}
              >
                <div className="task-header">
                  <h3>{task.title}</h3>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="btn-delete"
                    title="Delete task"
                  >
                    🗑️
                  </button>
                </div>

                {task.description && (
                  <p className="task-description">{task.description}</p>
                )}

                <div className="task-footer">
                  <button
                    onClick={() => handleToggleComplete(task)}
                    className="btn-toggle"
                  >
                    {task.completed ? '✅ Completed' : '⭕ Mark Complete'}
                  </button>
                  <span className="task-date">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
