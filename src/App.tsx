import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, DropResult, Droppable } from 'react-beautiful-dnd';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import updateLocale from 'dayjs/plugin/updateLocale';
import localeData from 'dayjs/plugin/localeData';
import { WeekData, Task } from './types';
import WeekNavigator from './components/WeekNavigator';
import { api, optimisticApi } from './services/api';
import Toast from './components/Toast';
import Column from './components/Column';

// 扩展 dayjs
dayjs.extend(weekOfYear);
dayjs.extend(updateLocale);
dayjs.extend(localeData);

// 设置一周的起始日为周一
dayjs.updateLocale('en', {
  weekStart: 1,
  weekdays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
});

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
  show: boolean;
}

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [weekData, setWeekData] = useState<WeekData>({ columns: [] });
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'info',
    show: false
  });

  const fetchWeekTasks = useCallback(async (date: dayjs.Dayjs) => {
    // 确保从周一开始
    const startOfWeek = date.startOf('week');
    console.log('Week starts from:', startOfWeek.format('YYYY-MM-DD (dddd)'));
    const endOfWeek = date.endOf('week');
    console.log('Week ends at:', endOfWeek.format('YYYY-MM-DD (dddd)'));
    
    setError(null);
    
    try {
      const tasks = await api.fetchTasks(
        startOfWeek.format('YYYY-MM-DD'),
        endOfWeek.format('YYYY-MM-DD')
      );
      
      // 按日期组织任务
      const tasksByDate = tasks.reduce((acc: { [key: string]: Task[] }, task) => {
        const date = dayjs(task.date).format('YYYY-MM-DD');
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(task);
        return acc;
      }, {});

      // 生成周数据，从周一开始
      const newWeekData: WeekData = {
        columns: Array.from({ length: 7 }, (_, i) => {
          const columnDate = startOfWeek.add(i, 'day').format('YYYY-MM-DD');
          console.log(`Column ${i + 1}:`, dayjs(columnDate).format('YYYY-MM-DD (dddd)'));
          return {
            date: columnDate,
            tasks: tasksByDate[columnDate] || []
          };
        })
      };

      setWeekData(newWeekData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取任务失败';
      setError(errorMessage);
      console.error('获取任务失败:', err);
    }
  }, []);

  useEffect(() => {
    fetchWeekTasks(currentDate);
  }, [currentDate, fetchWeekTasks]);

  const handleTaskMove = useCallback(async (taskId: string, fromDate: string, toDate: string, toIndex: number) => {
    try {
      // 先获取任务的完整信息
      const taskToMove = weekData.columns
        .find(col => col.date === fromDate)
        ?.tasks.find(task => task.id === taskId);

      if (!taskToMove) {
        throw new Error('任务未找到');
      }

      // 先更新本地状态
      setWeekData(prevWeekData => {
        const newWeekData = { ...prevWeekData };
        
        // 从所有列中移除任务
        newWeekData.columns = newWeekData.columns.map(column => ({
          ...column,
          tasks: column.tasks.filter(task => task.id !== taskId)
        }));

        // 将任务添加到目标列
        const toColumn = newWeekData.columns.find(col => col.date === toDate);
        if (toColumn) {
          const updatedTask = {
            ...taskToMove,
            date: toDate
          };
          const newTasks = [...toColumn.tasks];
          newTasks.splice(toIndex, 0, updatedTask);
          toColumn.tasks = newTasks;
        }

        return newWeekData;
      });

      // 更新服务器
      const updatedTask = await api.updateTask(taskId, { 
        date: toDate,
        content: taskToMove.content,
        completed: taskToMove.completed
      });

      // 确保本地状态与服务器返回的数据同步
      setWeekData(prevWeekData => {
        const newWeekData = { ...prevWeekData };
        const targetColumn = newWeekData.columns.find(col => col.date === toDate);
        if (targetColumn) {
          targetColumn.tasks = targetColumn.tasks.map(task => 
            task.id === updatedTask.id ? updatedTask : task
          );
        }
        return newWeekData;
      });

      showToast('任务移动成功', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '移动任务失败';
      setError(errorMessage);
      console.error('移动任务失败:', err);
      // 如果失败，重新获取数据以恢复正确状态
      fetchWeekTasks(currentDate);
    }
  }, [weekData, currentDate, fetchWeekTasks]);

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination || !result.source) {
      return;
    }

    const sourceId = result.source.droppableId;
    const destId = result.destination.droppableId;
    const taskId = result.draggableId;

    if (sourceId === destId && result.source.index === result.destination.index) {
      return;
    }

    handleTaskMove(taskId, sourceId, destId, result.destination.index);
  }, [handleTaskMove]);

  const handleTaskUpdate = useCallback(async (date: string, task: Task) => {
    const originalWeekData = weekData;
    try {
      const currentTask = task;
      const update = {
        content: task.content,
        completed: task.completed,
        date: task.date
      };

      const updatedTask = await optimisticApi.updateTask(
        task.id,
        update,
        currentTask,
        (optimisticTask) => {
          // 立即更新UI
          setWeekData(prevWeekData => {
            const newWeekData = { ...prevWeekData };
            const column = newWeekData.columns.find(col => col.date === date);
            if (column) {
              column.tasks = column.tasks.map(t => 
                t.id === optimisticTask.id ? optimisticTask : t
              );
            }
            return newWeekData;
          });
        },
        () => {
          // 如果失败，回滚到原始状态
          setWeekData(originalWeekData);
          const errorMessage = '更新任务失败';
          setError(errorMessage);
          showToast(errorMessage, 'error');
        }
      );

      // 服务器请求成功后，确保使用服务器返回的最新数据
      setWeekData(prevWeekData => {
        const newWeekData = { ...prevWeekData };
        const column = newWeekData.columns.find(col => col.date === date);
        if (column) {
          column.tasks = column.tasks.map(t => 
            t.id === updatedTask.id ? updatedTask : t
          );
        }
        return newWeekData;
      });
      showToast('任务更新成功', 'success');
    } catch (err) {
      setWeekData(originalWeekData);
      const errorMessage = err instanceof Error ? err.message : '更新任务失败';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    }
  }, [weekData]);

  const handleTaskDelete = useCallback(async (date: string, taskId: string) => {
    const originalWeekData = weekData;
    try {
      await optimisticApi.deleteTask(
        taskId,
        () => {
          // 立即更新UI
          setWeekData(prevWeekData => {
            const newWeekData = { ...prevWeekData };
            // 从所有列中删除任务，而不仅仅是指定日期的列
            newWeekData.columns = newWeekData.columns.map(column => ({
              ...column,
              tasks: column.tasks.filter(task => task.id !== taskId)
            }));
            return newWeekData;
          });
        },
        () => {
          // 如果失败，回滚到原始状态
          setWeekData(originalWeekData);
          const errorMessage = '删除任务失败';
          setError(errorMessage);
          showToast(errorMessage, 'error');
        }
      );
      showToast('任务删除成功', 'success');
    } catch (err) {
      setWeekData(originalWeekData);
      const errorMessage = err instanceof Error ? err.message : '删除任务失败';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    }
  }, [weekData]);

  const handleTaskCreate = useCallback(async (date: string) => {
    const originalWeekData = weekData;
    try {
      console.log('Creating task for date:', dayjs(date).format('YYYY-MM-DD (dddd)'));
      
      const newTask = {
        content: '',
        date: date,
        completed: false
      };
      
      const createdTask = await optimisticApi.createTask(
        newTask,
        (optimisticTask) => {
          // 立即更新UI
          setWeekData(prevWeekData => {
            const newWeekData = { ...prevWeekData };
            const column = newWeekData.columns.find(col => col.date === date);
            if (column) {
              column.tasks = [...column.tasks, optimisticTask];
            }
            return newWeekData;
          });
        },
        () => {
          // 如果失败，回滚到原始状态
          setWeekData(originalWeekData);
          const errorMessage = '创建任务失败';
          setError(errorMessage);
          showToast(errorMessage, 'error');
        }
      );

      // 服务器请求成功后，用实际的任务ID替换临时ID
      setWeekData(prevWeekData => {
        const newWeekData = { ...prevWeekData };
        const column = newWeekData.columns.find(col => col.date === date);
        if (column) {
          column.tasks = column.tasks.map(task => 
            task.id.startsWith('temp_') ? createdTask : task
          );
        }
        return newWeekData;
      });
      showToast('任务创建成功', 'success');
    } catch (err) {
      setWeekData(originalWeekData);
      const errorMessage = err instanceof Error ? err.message : '创建任务失败';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    }
  }, [weekData]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, show: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <div className="flex-none px-4 py-2 bg-white border-b">
        <WeekNavigator
          currentDate={currentDate}
          onPrevWeek={() => setCurrentDate(currentDate.subtract(1, 'week'))}
          onNextWeek={() => setCurrentDate(currentDate.add(1, 'week'))}
          onToday={() => setCurrentDate(dayjs())}
        />
      </div>

      <div className="flex-1 grid grid-cols-7 gap-4 p-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          {weekData.columns.map((column) => (
            <Droppable droppableId={column.date} key={column.date}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex flex-col"
                >
                  <Column
                    date={column.date}
                    tasks={column.tasks}
                    onTaskUpdate={handleTaskUpdate}
                    onTaskDelete={handleTaskDelete}
                    onTaskCreate={handleTaskCreate}
                  />
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </DragDropContext>
      </div>

      {error && (
        <div className="fixed bottom-4 left-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
};

export default App;
