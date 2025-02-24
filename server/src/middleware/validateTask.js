// 任务验证中间件
export const validateTask = (req, res, next) => {
  const { content, date } = req.body;

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: 'Content is required and must be a non-empty string' });
  }

  if (!date || isNaN(new Date(date).getTime())) {
    return res.status(400).json({ error: 'Valid date is required' });
  }

  next();
};

// 验证日期范围中间件
export const validateDateRange = (req, res, next) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'Both startDate and endDate are required' });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ error: 'Invalid date format' });
  }

  if (start > end) {
    return res.status(400).json({ error: 'startDate must be before or equal to endDate' });
  }

  next();
};
