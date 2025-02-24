import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import taskRoutes from './routes/task.js';
import { Task } from './models/Task.js';
import { validateTask, validateDateRange } from './middleware/validateTask.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// 中间件
app.use(cors({
  origin: ['https://weekly-schedule-omega.vercel.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API 路由
app.get('/api/tasks', validateDateRange, async (req, res) => {
  try {
    console.log('Fetching tasks...');
    const { start, end } = req.query;
    // 设置查询日期为当天的开始和结束时间
    const startDate = new Date(start);
    const endDate = new Date(end);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    console.log('Date range:', { start, end });
    const query = {
      date: {
        $gte: startDate,
        $lte: endDate
      }
    };
    console.log('MongoDB Query:', JSON.stringify(query));
    const tasks = await Task.find(query).sort({ date: 1 });
    console.log('Found tasks:', tasks.length);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
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

// MongoDB连接
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    console.log('Database Name:', mongoose.connection.name);
    console.log('Database Host:', mongoose.connection.host);
  })
  .catch((error) => console.error('Could not connect to MongoDB:', error));

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
