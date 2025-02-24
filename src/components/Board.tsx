import React from 'react';
import dayjs from 'dayjs';
import { Droppable } from 'react-beautiful-dnd';
import { WeekData, Task } from '../types';
import Column from './Column';

interface BoardProps {
  weekData: WeekData;
  isLoading: boolean;
  onTaskUpdate: (date: string, task: Task) => void;
  onTaskCreate: (date: string) => void;
  onTaskDelete: (date: string, taskId: string) => void;
}

const Board: React.FC<BoardProps> = ({
  weekData,
  isLoading,
  onTaskUpdate,
  onTaskDelete,
  onTaskCreate
}) => {
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full grid grid-cols-7 gap-4">
      {weekData.columns.map((column) => (
        <Droppable droppableId={column.date} key={column.date}>
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="h-full"
            >
              <Column
                date={column.date}
                tasks={column.tasks}
                onTaskUpdate={onTaskUpdate}
                onTaskDelete={onTaskDelete}
                onTaskCreate={onTaskCreate}
              />
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      ))}
    </div>
  );
};

export default Board;
