# 实时在线多人棋类平台 —— API 接口文档

## 1. 基础信息

- 基础路径：`http://localhost:3000/api`
- 认证方式：JWT Bearer Token（Header: `Authorization: Bearer <token>`）
- 响应格式：`{ code: 0, data: ... }` 或 `{ code: 1, message: "..." }`

## 2. REST API

### 2.1 认证

#### POST /api/auth/register — 用户注册
```
请求体：
{
  "username": "testuser",     // 3-20字符，必填
  "password": "123456",       // 6-50字符，必填
  "nickname": "测试用户"       // 可选，默认用 username
}

响应：
{
  "code": 0,
  "data": {
    "token": "eyJhbGci...",
    "user": {
      "id": "664a1b2c...",
      "username": "testuser",
      "nickname": "测试用户",
      "stats": { "totalGames": 0, "wins": 0, "losses": 0, "draws": 0, "rating": 1000 }
    }
  }
}
```

#### POST /api/auth/login — 用户登录
```
请求体：
{
  "username": "testuser",
  "password": "123456"
}

响应：同上
```

#### GET /api/auth/me — 获取当前用户（需认证）
```
响应：
{
  "code": 0,
  "data": {
    "_id": "664a1b2c...",
    "username": "testuser",
    "nickname": "测试用户",
    "stats": { ... }
  }
}
```

### 2.2 用户

#### GET /api/user/profile — 获取个人信息（需认证）

#### GET /api/user/records — 获取对局记录（需认证）
```
响应：
{
  "code": 0,
  "data": [
    {
      "_id": "...",
      "roomId": "AB12CD",
      "gameType": "chinese-chess",
      "players": [
        { "userId": { "_id": "...", "nickname": "张三" }, "color": "red" },
        { "userId": { "_id": "...", "nickname": "李四" }, "color": "black" }
      ],
      "moves": [...],
      "result": { "winner": "...", "reason": "checkmate" },
      "startedAt": "...",
      "endedAt": "..."
    }
  ]
}
```

### 2.3 房间

#### GET /api/rooms — 获取等待中的房间列表（需认证）
```
查询参数：?gameType=chinese-chess（可选筛选）
```

#### POST /api/rooms — 创建房间（需认证）
```
请求体：
{
  "gameType": "chinese-chess"   // 'chinese-chess' | 'gomoku'
}

响应：
{
  "code": 0,
  "data": {
    "roomId": "K3M8X2",
    "gameType": "chinese-chess",
    "hostId": "...",
    "status": "waiting"
  }
}
```

#### POST /api/rooms/:id/join — 加入房间（需认证）

#### GET /api/rooms/:id — 获取房间详情（需认证）

## 3. WebSocket 事件

连接地址：`http://localhost:3000`  
命名空间：`/`（默认）  
认证：连接时传 `auth: { token: "..." }`

### 3.1 客户端 → 服务端

| 事件 | 参数 | 说明 |
|------|------|------|
| join_room | `{ roomId }` | 进入房间 |
| leave_room | `{ roomId }` | 离开房间 |
| ready | `{ roomId }` | 准备（双方ready后开始） |
| make_move | `{ roomId, from: {x,y}, to: {x,y} }` | 走棋 |
| resign | `{ roomId }` | 认输 |
| request_draw | `{ roomId }` | 请求和棋 |
| respond_draw | `{ roomId, accept }` | 回应和棋 |
| chat_message | `{ roomId, message }` | 发送消息 |

### 3.2 服务端 → 客户端

| 事件 | 内容 | 说明 |
|------|------|------|
| game_start | `{ gameState, yourColor, gameType }` | 游戏开始 |
| move_made | `{ from, to, piece, captured, currentTurn }` | 落子通知 |
| game_over | `{ result, gameState }` | 游戏结束 |
| room_update | `{ room }` | 房间状态更新 |
| timer_update | `{ red, black }` | 计时器（秒） |
| chat_message | `{ userId, message, timestamp }` | 聊天消息 |
| draw_requested | `{ fromUser }` | 求和请求 |
| draw_response | `{ accepted }` | 求和响应 |
| opponent_disconnect | `{ userId, timestamp }` | 对手断线 |
| error | `{ message }` | 错误信息 |
