import { Task } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class CustomApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'CustomApiError';
  }
}

export const api = {
  async fetchTasks(start: string, end: string): Promise<Task[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/tasks?start=${start}&end=${end}`
      );
      const data = await response.json();
      
      if (!response.ok) {
        throw new CustomApiError(response.status, Array.isArray(data.errors) 
          ? data.errors.join(', ') 
          : data.error || 'Failed to fetch tasks'
        );
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  },

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(task),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new CustomApiError(response.status, Array.isArray(data.errors) 
          ? data.errors.join(', ') 
          : data.error || 'Failed to create task'
        );
      }
      
      return data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },

  async updateTask(
    id: string, 
    task: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Task> {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(task),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new CustomApiError(response.status, Array.isArray(data.errors) 
          ? data.errors.join(', ') 
          : data.error || 'Failed to update task'
        );
      }
      
      return data;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  async deleteTask(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new CustomApiError(response.status, Array.isArray(data.errors) 
          ? data.errors.join(', ') 
          : data.error || 'Failed to delete task'
        );
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }
};

// 添加乐观更新工具函数
export const optimisticApi = {
  async createTask(
    task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>,
    onOptimisticUpdate: (optimisticTask: Task) => void,
    onRollback: () => void
  ): Promise<Task> {
    const tempId = `temp_${Date.now()}`;
    const optimisticTask = {
      ...task,
      id: tempId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      // 立即更新 UI
      onOptimisticUpdate(optimisticTask);

      // 发送实际请求
      const createdTask = await api.createTask({
        content: task.content,
        date: task.date,
        completed: task.completed || false
      });

      return createdTask;
    } catch (error) {
      // 如果失败，回滚 UI
      onRollback();
      throw error;
    }
  },

  updateTask: async (
    id: string,
    update: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>,
    currentTask: Task,
    onOptimisticUpdate: (optimisticTask: Task) => void,
    onRollback: () => void
  ): Promise<Task> => {
    // 创建乐观更新的任务
    const optimisticTask: Task = {
      ...currentTask,
      ...update,
      updatedAt: new Date().toISOString()
    };

    // 立即更新 UI
    onOptimisticUpdate(optimisticTask);

    try {
      // 实际发送请求
      const updatedTask = await api.updateTask(id, update);
      return updatedTask;
    } catch (error) {
      // 如果失败，回滚 UI
      onRollback();
      throw error;
    }
  },

  deleteTask: async (
    id: string,
    onOptimisticUpdate: () => void,
    onRollback: () => void
  ): Promise<void> => {
    // 立即更新 UI
    onOptimisticUpdate();

    try {
      // 实际发送请求
      await api.deleteTask(id);
    } catch (error) {
      // 如果失败，回滚 UI
      onRollback();
      throw error;
    }
  }
};
