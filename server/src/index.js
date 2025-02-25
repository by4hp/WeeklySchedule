import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Task } from './models/Task.js';
import { validateTask, validateDateRange } from './middleware/validateTask.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
const envFiles = [
  join(__dirname, '../.env'),
  join(__dirname, '../.env.production')
];

envFiles.forEach(file => {
  console.log(`Attempting to load env file: ${file}`);
  const result = dotenv.config({ path: file });
  if (result.error) {
    console.log(`Could not load ${file}:`, result.error.message);
  } else {
    console.log(`Successfully loaded ${file}`);
  }
});

// 打印环境变量（不包含敏感信息）
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  MONGODB_URI_SET: !!process.env.MONGODB_URI,
  PWD: process.env.PWD,
  CURRENT_DIR: __dirname
});

// CORS 配置
const corsOptions = {
  origin: function(origin, callback) {
    // 允许所有 vercel.app 子域名和本地开发
    const allowedOrigins = [
      'http://localhost:3000',
      'https://weekly-schedule-client.vercel.app',
      'https://weekly-schedule-client-by4hp.vercel.app',
      'https://weekly-schedule-omega.vercel.app',
      'https://weekly-schedule.vercel.app'
    ];
    
    // 允许没有 origin 的请求（比如来自 Postman 的请求）
    if (!origin) {
      return callback(null, true);
    }
    
    // 检查是否是 vercel.app 域名或在允许列表中
    if (origin.endsWith('.vercel.app') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

const app = express();
const port = process.env.PORT || 3001;

// 确保必要的环境变量存在
if (!process.env.MONGODB_URI) {
  console.error('Fatal Error: MONGODB_URI environment variable is not set');
  process.exit(1);
}

// 在所有路由之前设置 CORS 头
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://weekly-schedule-client.vercel.app',
    'https://weekly-schedule-client-by4hp.vercel.app',
    'https://weekly-schedule-omega.vercel.app',
    'https://weekly-schedule.vercel.app'
  ];

  const origin = req.headers.origin;
  if (origin) {
    if (origin.endsWith('.vercel.app') || allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

// 使用 express.json() 中间件
app.use(express.json());

// 中间件
app.use(cors(corsOptions));

// MongoDB连接
console.log('Attempting to connect to MongoDB...');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    console.log('Database Name:', mongoose.connection.name);
    console.log('Database Host:', mongoose.connection.host);
  })
  .catch((error) => {
    console.error('Could not connect to MongoDB:', error);
    process.exit(1);
  });

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API 路由
app.get('/api/tasks', validateDateRange, async (req, res) => {
  try {
    console.log('Fetching tasks...');
    const { startDate, endDate } = req.query;

    console.log('Date range:', { 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString() 
    });

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
    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/tasks/:id', validateTask, async (req, res) => {
  try {
    // 如果是临时ID，创建新任务
    if (req.params.id.startsWith('temp_')) {
      const task = new Task(req.body);
      await task.save();
      return res.status(201).json(task);
    }

    // 否则更新现有任务
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  console.log(`Attempting to delete task with id: ${req.params.id}`);
  try {
    // 如果是临时ID，直接返回成功
    if (req.params.id.startsWith('temp_')) {
      return res.status(204).end();
    }

    const task = await Task.findByIdAndDelete(req.params.id);
    console.log('Delete operation result:', task);
    
    if (!task) {
      console.log('Task not found');
      return res.status(404).json({ error: 'Task not found' });
    }
    
    console.log('Task deleted successfully');
    return res.status(204).end();
  } catch (error) {
    console.error('Error deleting task:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
