import React, { useState, useEffect } from 'react';
import type { Task } from '../types';
import { tasksApi } from '../api/tasks';
import { usePhoenixYjs as useYjs } from '../hooks/usePhoenixYjs';
import { useAuth } from '../context/AuthContext';
import { TaskGraphVisualization } from './TaskGraphVisualization';
import { DependencyEditor } from './DependencyEditor';

export function TaskList() {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskEstimatedHours, setNewTaskEstimatedHours] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [graphRefreshKey, setGraphRefreshKey] = useState(0);
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
        ...(newTaskEstimatedHours > 0 && { estimatedHours: newTaskEstimatedHours }),
      });

      // Add to Yjs (will sync to other clients)
      addTask(task);

      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskEstimatedHours(0);
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
      // Refresh graph after deletion
      setGraphRefreshKey(prev => prev + 1);
    } catch (err: any) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleDependencyChange = () => {
    // Refresh graph when dependencies change
    setGraphRefreshKey(prev => prev + 1);
  };

  return (
    <div className="task-manager">
      <header className="header">
        <div>
          <h1>✅ RightTask</h1>
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

          <div className="form-group">
            <label style={{ fontSize: '14px', marginBottom: '5px', display: 'block' }}>
              Estimated Hours (for critical path calculation):
            </label>
            <input
              type="number"
              value={newTaskEstimatedHours}
              onChange={(e) => setNewTaskEstimatedHours(parseInt(e.target.value) || 0)}
              placeholder="0"
              min="0"
              step="1"
              style={{ width: '150px' }}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </form>
      </div>

      {/* Graph Visualization */}
      <div className="graph-section">
        <div className="graph-header">
          <h2>📊 Task Dependencies</h2>
        </div>
        <TaskGraphVisualization key={graphRefreshKey} />
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

                {task.estimatedHours && task.estimatedHours > 0 && (
                  <div style={{
                    fontSize: '13px',
                    color: '#718096',
                    margin: '8px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <span>⏱️</span>
                    <span>Est. {task.estimatedHours} hour{task.estimatedHours !== 1 ? 's' : ''}</span>
                  </div>
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

                {/* Dependency Editor */}
                <DependencyEditor
                  taskId={task.id}
                  allTasks={tasks}
                  onDependencyChange={handleDependencyChange}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
