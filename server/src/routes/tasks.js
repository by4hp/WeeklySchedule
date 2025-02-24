import express from 'express';
import { Task } from '../models/Task.js';
import { validateTask, validateDateRange } from '../middleware/validateTask.js';

const router = express.Router();

// 获取指定日期范围内的任务
router.get('/', validateDateRange, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const tasks = await Task.find({
      date: {
        $gte: start,
        $lte: end
      }
    }).sort({ date: 1 });

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// 创建新任务
router.post('/', validateTask, async (req, res) => {
  try {
    const { content, date, completed } = req.body;
    const task = new Task({
      content,
      date: new Date(date),
      completed: completed || false
    });
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// 更新任务
router.put('/:id', validateTask, async (req, res) => {
  try {
    const { content, date, completed } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { content, date: new Date(date), completed },
      { new: true }
    );
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// 删除任务
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
