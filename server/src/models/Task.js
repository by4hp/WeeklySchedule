import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  content: {
    type: String,
    default: '',
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 添加中间件来处理日期
taskSchema.pre('save', function(next) {
  // 确保日期被设置为当天的 00:00:00
  if (this.date) {
    const date = new Date(this.date);
    date.setHours(0, 0, 0, 0);
    this.date = date;
  }
  next();
});

// 添加实例方法
taskSchema.methods.toJSON = function() {
  const task = this.toObject();
  return {
    id: task._id,
    content: task.content,
    completed: task.completed,
    date: task.date.toISOString(),
    createdAt: task.createdAt,
    updatedAt: task.updatedAt
  };
};

export const Task = mongoose.model('Task', taskSchema);
