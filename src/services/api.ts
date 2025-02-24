import { Task } from '../types';

const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api`;

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
          : data.error || '获取任务失败');
      }
      
      return data;
    } catch (error) {
      if (error instanceof CustomApiError) {
        throw error;
      }
      throw new Error('获取任务时发生网络错误');
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
          : data.error || '创建任务失败');
      }

      return data;
    } catch (error) {
      if (error instanceof CustomApiError) {
        throw error;
      }
      throw new Error('创建任务时发生网络错误');
    }
  },

  async updateTask(id: string, task: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Task> {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(task),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new CustomApiError(response.status, Array.isArray(data.errors)
          ? data.errors.join(', ')
          : data.error || '更新任务失败');
      }

      return data;
    } catch (error) {
      if (error instanceof CustomApiError) {
        throw error;
      }
      throw new Error('更新任务时发生网络错误');
    }
  },

  async deleteTask(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      // 不管响应内容如何，只要状态码在 200-299 范围内就认为是成功
      if (response.ok) {
        return;
      }

      // 只有在响应不成功时才尝试解析错误信息
      const data = await response.json().catch(() => ({ error: '删除任务失败' }));
      throw new CustomApiError(
        response.status,
        (data && (Array.isArray(data.errors) ? data.errors.join(', ') : data.error)) || '删除任务失败'
      );
    } catch (error) {
      if (error instanceof CustomApiError) {
        throw error;
      }
      console.error('Delete task error:', error);
      throw new Error('删除任务时发生网络错误');
    }
  },
};
