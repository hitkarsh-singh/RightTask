import { useState, useEffect } from 'react';
import { dependenciesApi } from '../api/dependencies';
import type { Task } from '../types';

interface DependencyEditorProps {
  taskId: string;
  allTasks: Task[];
  onDependencyChange?: () => void;
}

export function DependencyEditor({ taskId, allTasks, onDependencyChange }: DependencyEditorProps) {
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dependencies, setDependencies] = useState<Task[]>([]);

  // Load current dependencies
  useEffect(() => {
    const loadDependencies = async () => {
      try {
        const deps = await dependenciesApi.getTaskDependencies(taskId);
        setDependencies(deps);
      } catch (err) {
        console.error('Failed to load dependencies:', err);
      }
    };

    loadDependencies();
  }, [taskId]);

  const handleAddDependency = async () => {
    if (!selectedTaskId) return;

    setLoading(true);
    setError('');

    try {
      // Check for cycle
      const hasCycle = await dependenciesApi.checkCycle(taskId, selectedTaskId);
      if (hasCycle) {
        setError('⚠️ This would create a circular dependency');
        setLoading(false);
        return;
      }

      // Add dependency
      await dependenciesApi.addDependency(taskId, selectedTaskId);

      // Refresh dependencies
      const deps = await dependenciesApi.getTaskDependencies(taskId);
      setDependencies(deps);
      setSelectedTaskId('');
      setError('');

      // Notify parent component
      if (onDependencyChange) {
        onDependencyChange();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add dependency');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDependency = async (depId: string) => {
    try {
      await dependenciesApi.removeDependency(taskId, depId);

      // Refresh dependencies
      const deps = await dependenciesApi.getTaskDependencies(taskId);
      setDependencies(deps);

      // Notify parent component
      if (onDependencyChange) {
        onDependencyChange();
      }
    } catch (err) {
      console.error('Failed to remove dependency:', err);
    }
  };

  // Get available tasks (exclude current task and existing dependencies)
  const availableTasks = allTasks.filter(t => {
    if (t.id === taskId) return false;
    if (dependencies.find(d => d.id === t.id)) return false;
    return true;
  });

  return (
    <div className="dependency-editor">
      <h4>Dependencies</h4>

      {/* Current dependencies */}
      {dependencies.length > 0 ? (
        <div className="dependency-list">
          {dependencies.map(dep => (
            <span key={dep.id} className="dependency-tag">
              {dep.title}
              <button
                onClick={() => handleRemoveDependency(dep.id)}
                className="remove-btn"
                title="Remove dependency"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: '13px', color: '#a0aec0', marginBottom: '10px' }}>
          No dependencies
        </p>
      )}

      {/* Add new */}
      {availableTasks.length > 0 && (
        <div className="add-dependency">
          <select
            value={selectedTaskId}
            onChange={(e) => {
              setSelectedTaskId(e.target.value);
              setError('');
            }}
            disabled={loading}
          >
            <option value="">Select dependency...</option>
            {availableTasks.map(t => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddDependency}
            disabled={!selectedTaskId || loading}
          >
            {loading ? 'Adding...' : 'Add'}
          </button>
        </div>
      )}

      {error && (
        <div className="error-message" style={{ marginTop: '10px', fontSize: '13px' }}>
          {error}
        </div>
      )}
    </div>
  );
}
