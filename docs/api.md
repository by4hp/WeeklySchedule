# Weekly Schedule API 文档

## 基础信息
- 开发环境 API 地址：`http://localhost:3001`
- 生产环境 API 地址：通过 Railway 部署

## 接口列表

### 1. 健康检查
```http
GET /health
```
返回示例：
```json
{
  "status": "ok",
  "timestamp": "2025-02-25T02:14:41.000Z"
}
```

### 2. 获取任务列表
```http
GET /api/tasks?startDate={startDate}&endDate={endDate}
```
参数：
- `startDate`: 开始日期（ISO 格式）
- `endDate`: 结束日期（ISO 格式）

返回：任务列表数组

### 3. 创建任务
```http
POST /api/tasks
```
请求体：
```json
{
  "content": "任务内容",
  "date": "2025-02-25T00:00:00.000Z",
  "completed": false
}
```

### 4. 更新任务
```http
PUT /api/tasks/:id
```
参数：
- `id`: 任务ID

请求体：
```json
{
  "content": "更新的任务内容",
  "date": "2025-02-25T00:00:00.000Z",
  "completed": true
}
```

### 5. 删除任务
```http
DELETE /api/tasks/:id
```
参数：
- `id`: 任务ID

## CORS 配置
允许的域名：
- `http://localhost:3000`
- `https://weekly-schedule-client.vercel.app`
- `https://weekly-schedule-client-by4hp.vercel.app`

允许的方法：
- GET
- POST
- PUT
- DELETE
- OPTIONS

## 错误处理
所有接口在发生错误时会返回相应的 HTTP 状态码和错误信息：
- 400: 请求参数错误
- 404: 资源不存在
- 500: 服务器内部错误

错误响应格式：
```json
{
  "error": "错误信息"
}
```
