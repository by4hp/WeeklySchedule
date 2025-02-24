// 任务验证中间件
export const validateTask = (req, res, next) => {
  const { content, date, completed } = req.body;

  // 只进行基本的类型转换，不做验证
  req.body = {
    ...req.body,
    content: content || '',
    completed: completed === true,
    // 使用传入的日期，不设置默认值
    date: date
  };

  next();
};

// 验证日期范围中间件
export const validateDateRange = (req, res, next) => {
  const { start, end } = req.query;

  // 确保日期是有效的，如果无效则使用默认值
  const startDate = new Date(start);
  const endDate = new Date(end);

  req.query.start = isNaN(startDate.getTime()) ? start : start;
  req.query.end = isNaN(endDate.getTime()) ? end : end;

  next();
};
