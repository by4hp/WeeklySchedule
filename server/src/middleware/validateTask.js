// 任务验证中间件
export const validateTask = (req, res, next) => {
  const { content, date, completed } = req.body;

  // 验证日期
  const taskDate = new Date(date);
  if (isNaN(taskDate.getTime())) {
    return res.status(400).json({ error: 'Invalid date format' });
  }

  req.body = {
    ...req.body,
    content: content || '',
    completed: completed === true,
    date: taskDate
  };

  next();
};

// 验证日期范围中间件
export const validateDateRange = (req, res, next) => {
  const { start, end } = req.query;

  if (!start || !end) {
    return res.status(400).json({ error: 'Start and end dates are required' });
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return res.status(400).json({ error: 'Invalid date format' });
  }

  // 设置时间范围
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  req.query.startDate = startDate;
  req.query.endDate = endDate;

  next();
};
