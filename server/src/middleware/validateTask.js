// 日期处理工具函数
const parseAndValidateDate = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};

// 任务验证中间件
export const validateTask = (req, res, next) => {
  const { content, date, completed } = req.body;

  // 构建更新对象
  const updateData = {
    ...req.body
  };

  // 设置内容（如果提供）
  if (content !== undefined) {
    updateData.content = content || '';
  }

  // 设置完成状态（如果提供）
  if (completed !== undefined) {
    updateData.completed = completed === true;
  }

  // 验证并设置日期（如果提供）
  if (date !== undefined) {
    const taskDate = parseAndValidateDate(date);
    if (!taskDate) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    updateData.date = taskDate;
  }

  req.body = updateData;
  next();
};

// 验证日期范围中间件
export const validateDateRange = (req, res, next) => {
  const { start, end } = req.query;

  if (!start || !end) {
    return res.status(400).json({ error: 'Start and end dates are required' });
  }

  const startDate = parseAndValidateDate(start);
  const endDate = parseAndValidateDate(end);

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'Invalid date format' });
  }

  // 设置时间范围
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  req.query.startDate = startDate;
  req.query.endDate = endDate;

  next();
};
