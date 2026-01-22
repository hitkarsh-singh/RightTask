import { useEffect, useState, useRef } from 'react';
import * as Y from 'yjs';
import { Socket } from 'phoenix';
import type { Task } from '../types';

const PHOENIX_URL = import.meta.env.VITE_PHOENIX_URL || 'ws://localhost:4000/socket';

export function usePhoenixYjs(roomId: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const docRef = useRef<Y.Doc | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const channelRef = useRef<any | null>(null);
  const tasksArrayRef = useRef<Y.Array<any> | null>(null);

  useEffect(() => {
    const doc = new Y.Doc();
    const tasksArray = doc.getArray('tasks');
    docRef.current = doc;
    tasksArrayRef.current = tasksArray;

    // Connect to Phoenix
    const socket = new Socket(PHOENIX_URL);
    socket.connect();
    socketRef.current = socket;

    // Join room channel
    const channel = socket.channel(`room:${roomId}`, {});
    channelRef.current = channel;

    channel.join()
      .receive('ok', (response: { state: number[] }) => {
        console.log('🔗 Joined Phoenix room:', roomId);

        if (response.state && response.state.length > 0) {
          Y.applyUpdate(doc, new Uint8Array(response.state));
          updateTasksFromYjs();
        }
      })
      .receive('error', (resp: any) => {
        console.error('❌ Failed to join room:', resp);
      });

    // Receive updates from other clients
    channel.on('update', (payload: { data: number[] }) => {
      Y.applyUpdate(doc, new Uint8Array(payload.data));
      updateTasksFromYjs();
    });

    // Send local updates to server
    const updateHandler = (update: Uint8Array) => {
      // Convert Uint8Array to array of numbers for Phoenix serialization
      channel.push('update', { data: Array.from(update) });
    };

    doc.on('update', updateHandler);

    // Observe array changes
    const observeHandler = () => {
      updateTasksFromYjs();
    };

    tasksArray.observe(observeHandler);

    function updateTasksFromYjs() {
      const tasksData = tasksArray.toArray() as Task[];
      setTasks(tasksData);
    }

    updateTasksFromYjs();

    // Cleanup
    return () => {
      doc.off('update', updateHandler);
      tasksArray.unobserve(observeHandler);
      channel.leave();
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

  return { tasks, addTask, updateTask, deleteTask };
}
