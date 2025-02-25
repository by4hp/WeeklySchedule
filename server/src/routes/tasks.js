import express from 'express';
import { Task } from '../models/Task.js';
import { validateTask, validateDateRange } from '../middleware/validateTask.js';
import { redis } from '../services/redis.js';

const router = express.Router();

// 获取任务列表
router.get('/', validateDateRange, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // 尝试从缓存获取数据
    const cachedTasks = await redis.getTasksCache(startDate.toISOString(), endDate.toISOString());
    if (cachedTasks) {
      console.log('Returning cached tasks');
      return res.json(cachedTasks);
    }

    // 如果缓存未命中，从数据库获取
    console.log('Fetching tasks...');
    console.log('Date range:', { startDate, endDate });
    
    const query = {
      date: {
        $gte: startDate,
        $lte: endDate
      }
    };
    
    console.log('MongoDB Query:', JSON.stringify(query));
    const tasks = await Task.find(query).sort({ date: 1 });
    console.log('Found tasks:', tasks.length);

    // 设置缓存
    await redis.setTasksCache(startDate.toISOString(), endDate.toISOString(), tasks);
    
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 创建新任务
router.post('/', validateTask, async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    
    // 清除相关的缓存
    await redis.invalidateTasksCache(
      new Date(task.date).toISOString(),
      new Date(task.date).toISOString()
    );
    
    // 缓存新任务
    await redis.setTaskCache(task._id.toString(), task);
    
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 更新任务
router.patch('/:id', validateTask, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const oldDate = new Date(task.date).toISOString();
    
    // 更新任务
    Object.assign(task, req.body);
    await task.save();
    
    // 清除相关的缓存
    await Promise.all([
      redis.invalidateTaskCache(task._id.toString()),
      redis.invalidateTasksCache(oldDate, oldDate),
      redis.invalidateTasksCache(
        new Date(task.date).toISOString(),
        new Date(task.date).toISOString()
      )
    ]);
    
    // 更新缓存
    await redis.setTaskCache(task._id.toString(), task);
    
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 删除任务
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const date = new Date(task.date).toISOString();
    
    await task.deleteOne();
    
    // 清除相关的缓存
    await Promise.all([
      redis.invalidateTaskCache(req.params.id),
      redis.invalidateTasksCache(date, date)
    ]);
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
