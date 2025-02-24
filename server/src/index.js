import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Task } from './models/Task.js';
import { validateTask, validateDateRange } from './middleware/validateTask.js';

dotenv.config();

const app = express();

// 中间件
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://weekly-schedule-omega.vercel.app'
    : 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());

// MongoDB Atlas 连接
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB();

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API 路由
app.get('/api/tasks', validateDateRange, async (req, res) => {
  try {
    const { start, end } = req.query;
    // 设置查询日期为当天的开始和结束时间
    const startDate = new Date(start);
    const endDate = new Date(end);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const tasks = await Task.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks', validateTask, async (req, res) => {
  try {
    const { content, date, completed } = req.body;
    // 确保使用传入的日期，并设置为当天的开始时间
    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);

    const task = await Task.create({
      content,
      date: taskDate,
      completed
    });
    res.status(201).json(task);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: '验证错误',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/tasks/:id', validateTask, async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!task) {
      return res.status(404).json({ error: '任务未找到' });
    }
    res.json(task);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: '验证错误',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ error: '任务未找到' });
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
