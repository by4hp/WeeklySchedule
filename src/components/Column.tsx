import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Task } from '../types';
import TaskCard from './TaskCard';
import dayjs from 'dayjs';

interface ColumnProps {
  date: string;
  tasks: Task[];
  onTaskUpdate: (date: string, task: Task) => void;
  onTaskDelete: (date: string, taskId: string) => void;
  onTaskCreate: (date: string) => void;
}

const Column: React.FC<ColumnProps> = ({
  date,
  tasks,
  onTaskUpdate,
  onTaskDelete,
  onTaskCreate
}) => {
  const columnDate = dayjs(date);
  const isToday = columnDate.isSame(dayjs(), 'day');

  const handleCreateTask = (e: React.MouseEvent<HTMLDivElement>) => {
    // 只有当点击的是任务列表区域的直接容器时才创建任务
    if (e.currentTarget === e.target) {
      onTaskCreate(date);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] bg-gray-50 rounded-lg shadow">
      {/* 列头部 */}
      <div className={`flex-none px-3 py-2 ${isToday ? 'bg-blue-50' : 'bg-white'} border-b rounded-t-lg`}>
        <div className="flex justify-between items-baseline">
          <h3 className="text-lg font-semibold text-gray-900">
            {columnDate.format('ddd')}
          </h3>
          <p className={`text-sm ${isToday ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
            {columnDate.format('MM/DD')}
          </p>
        </div>
      </div>
      
      {/* 任务列表区域 - 可滚动 */}
      <div 
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400"
        onDoubleClick={handleCreateTask}
      >
        <div className="p-2 space-y-2">
          {tasks.map((task, index) => (
            <Draggable key={task.id} draggableId={task.id} index={index}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  style={{
                    ...provided.draggableProps.style,
                    opacity: snapshot.isDragging ? 0.5 : 1
                  }}
                >
                  <TaskCard
                    task={task}
                    onUpdate={(updatedTask) => onTaskUpdate(date, updatedTask)}
                    onDelete={() => onTaskDelete(date, task.id)}
                  />
                </div>
              )}
            </Draggable>
          ))}
          {/* 占位符，确保拖拽时有足够空间 */}
          <div style={{ minHeight: '1px' }} />
        </div>
      </div>

      {/* 固定在底部的新增按钮 */}
      <div className="flex-none px-2 py-2 bg-white border-t rounded-b-lg">
        <button
          onClick={() => onTaskCreate(date)}
          className="w-full py-1.5 px-3 bg-white hover:bg-gray-50 border border-gray-300 rounded text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          + Add Task
        </button>
      </div>
    </div>
  );
};

export default Column;
