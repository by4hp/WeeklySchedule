import { default as mongoose } from 'mongoose';

const taskSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
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

export { default as Task } from mongoose.model('Task', taskSchema);
