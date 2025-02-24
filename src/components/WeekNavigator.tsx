import React from 'react';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import 'dayjs/locale/zh-cn';

// 扩展 dayjs 以支持周数计算
dayjs.extend(weekOfYear);
// 设置语言为中文
dayjs.locale('zh-cn');

interface WeekNavigatorProps {
  currentDate: dayjs.Dayjs;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
}

const WeekNavigator: React.FC<WeekNavigatorProps> = ({
  currentDate,
  onPrevWeek,
  onNextWeek,
  onToday
}) => {
  const weekNumber = currentDate.week();
  const year = currentDate.year();

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b">
      {/* 左侧：年份和周数信息 */}
      <div className="text-lg font-semibold text-gray-800">
        {year}年 第{weekNumber}周
      </div>

      {/* 右侧：导航控制 */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToday}
          className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded"
        >
          今天
        </button>
        
        <div className="flex items-center rounded-md bg-gray-100 p-1">
          <button
            onClick={onPrevWeek}
            className="p-1.5 text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded"
            aria-label="上一周"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          
          <button
            onClick={onNextWeek}
            className="p-1.5 text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded"
            aria-label="下一周"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeekNavigator;
