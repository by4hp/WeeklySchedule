import React, { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onUpdate: (task: Task) => void;
  onDelete: () => void;
  autoFocus?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onUpdate,
  onDelete,
  autoFocus = false
}) => {
  const [isEditing, setIsEditing] = useState(task.content === '');
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState(task.content);
  const [showExpandButton, setShowExpandButton] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // 检查内容是否超过三行
  const checkContentHeight = () => {
    if (contentRef.current) {
      const lineHeight = parseInt(window.getComputedStyle(contentRef.current).lineHeight);
      const height = contentRef.current.scrollHeight;
      const isOverThreeLines = height > lineHeight * 3;
      setShowExpandButton(isOverThreeLines);
      // 如果不是编辑状态且内容不超过三行，自动收起
      if (!isEditing && !isOverThreeLines) {
        setIsExpanded(false);
      }
    }
  };

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
      setIsEditing(true);
      setIsExpanded(true);
    }
  }, [autoFocus]);

  useEffect(() => {
    setContent(task.content);
    checkContentHeight();
  }, [task.content]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
  };

  const handleBlur = () => {
    if (content !== task.content) {
      onUpdate({
        ...task,
        content: content
      });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
  };

  const handleComplete = () => {
    setIsCompleting(true);
    onUpdate({ ...task, completed: !task.completed });
    // 动画结束后重置状态
    setTimeout(() => {
      setIsCompleting(false);
    }, 1000);
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
    setIsExpanded(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleDelete = () => {
    setIsDeleting(true);
    // 等待动画完成后再删除
    setTimeout(() => {
      onDelete();
    }, 500); // 动画持续时间为 500ms
  };

  return (
    <div 
      className={`
        group relative bg-white p-3 rounded-lg shadow-sm
        transition-all duration-500 ease-in-out transform
        ${isDeleting ? 'scale-0 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'}
        ${isCompleting ? 'task-complete' : ''}
        ${task.completed ? 'opacity-75' : ''}
      `}
    >
      <div className="flex items-start gap-2">
        {/* 完成状态复选框 */}
        <input
          type="checkbox"
          checked={task.completed}
          onChange={handleComplete}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />

        {/* 任务内容 */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-full p-0 text-gray-900 border-0 focus:ring-0 resize-none bg-transparent"
              rows={Math.min(content.split('\n').length, 5)}
              style={{ minHeight: '1.5rem' }}
            />
          ) : (
            <div
              ref={contentRef}
              onDoubleClick={handleDoubleClick}
              className={`whitespace-pre-wrap text-gray-900 ${
                !isExpanded && showExpandButton ? 'line-clamp-3' : ''
              }`}
            >
              {content}
            </div>
          )}

          {/* 展开/收起按钮 */}
          {showExpandButton && !isEditing && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-1 text-sm text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? '收起' : '展开'}
            </button>
          )}
        </div>

        {/* 删除按钮 */}
        <button
          onClick={handleDelete}
          className="text-gray-400 hover:text-red-500 focus:outline-none"
          title="删除任务"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      {/* 创建时间 */}
      {task.createdAt && (
        <div className="mt-2 text-xs text-gray-500">
          创建于 {dayjs(task.createdAt).format('YYYY-MM-DD HH:mm')}
        </div>
      )}
    </div>
  );
};

export default TaskCard;
