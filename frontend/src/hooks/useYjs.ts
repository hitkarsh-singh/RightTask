import { useEffect, useState, useRef } from 'react';
import * as Y from 'yjs';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import type { Task } from '../types';

export function useYjs(roomId: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const docRef = useRef<Y.Doc | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const tasksArrayRef = useRef<Y.Array<any> | null>(null);

  useEffect(() => {
    // Create Yjs document
    const doc = new Y.Doc();
    docRef.current = doc;

    // Get or create tasks array
    const tasksArray = doc.getArray('tasks');
    tasksArrayRef.current = tasksArray;

    // Connect to WebSocket
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔗 Connected to Yjs server');

      // Join room
      socket.emit('join-room', roomId);
    });

    // Receive initial state from server
    socket.on('sync-state', (state: ArrayBuffer) => {
      Y.applyUpdate(doc, new Uint8Array(state));
      updateTasksFromYjs();
    });

    // Receive updates from other clients
    socket.on('update', (update: ArrayBuffer) => {
      Y.applyUpdate(doc, new Uint8Array(update));
      updateTasksFromYjs();
    });

    // Listen for local changes and send to server
    const updateHandler = (update: Uint8Array) => {
      socket.emit('update', update);
    };

    doc.on('update', updateHandler);

    // Listen for changes to tasks array
    const observeHandler = () => {
      updateTasksFromYjs();
    };

    tasksArray.observe(observeHandler);

    function updateTasksFromYjs() {
      const tasksData = tasksArray.toArray() as Task[];
      setTasks(tasksData);
    }

    // Initial update
    updateTasksFromYjs();

    // Cleanup
    return () => {
      doc.off('update', updateHandler);
      tasksArray.unobserve(observeHandler);
      socket.disconnect();
    };
  }, [roomId]);

  const addTask = (task: Task) => {
    if (tasksArrayRef.current) {
      tasksArrayRef.current.push([task]);
    }
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    if (tasksArrayRef.current) {
      const index = tasksArrayRef.current.toArray().findIndex((t: Task) => t.id === taskId);
      if (index !== -1) {
        const currentTask = tasksArrayRef.current.get(index);
        tasksArrayRef.current.delete(index, 1);
        tasksArrayRef.current.insert(index, [{ ...currentTask, ...updates }]);
      }
    }
  };

  const deleteTask = (taskId: string) => {
    if (tasksArrayRef.current) {
      const index = tasksArrayRef.current.toArray().findIndex((t: Task) => t.id === taskId);
      if (index !== -1) {
        tasksArrayRef.current.delete(index, 1);
      }
    }
  };

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
  };
}
