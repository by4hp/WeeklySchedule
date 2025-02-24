import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 添加中间件来处理日期
taskSchema.pre('save', function(next) {
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
    date: task.date,
    createdAt: task.createdAt
  };
};

export const Task = mongoose.model('Task', taskSchema);
