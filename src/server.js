// TeamHub - 伺服器主入口程式
// 負責設定 Express、載入中介軟體、提供前端靜態檔案與 API 路由

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中介軟體設定
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. 安全託管前端靜態資源目錄 (僅開放 css 與 js 資料夾，絕不公開整個根目錄，確保安全)
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/js', express.static(path.join(__dirname, '../js')));

// 2. 託管 public 資料夾 (供登入頁面與其靜態檔案使用)
app.use('/public', express.static(path.join(__dirname, '../public')));

// 3. 頁面路由：首頁與 /dashboard 皆提供 TeamHub 完整 Dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// 4. 頁面路由：保留登入頁面 (可透過 /login 存取)
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 5. 健康檢查與系統狀態 API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'TeamHub API Server',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`🏐 TeamHub 伺服器已啟動！`);
  console.log(`📡 本機網址: http://localhost:${PORT}`);
  console.log(`📊 儀表板頁面: http://localhost:${PORT}/dashboard`);
  console.log(`🔐 登入頁面: http://localhost:${PORT}/login`);
  console.log(`⚙️  運作環境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`========================================`);
});
