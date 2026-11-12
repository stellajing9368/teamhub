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

// 前端靜態檔案目錄 (託管 public 資料夾)
app.use(express.static(path.join(__dirname, '../public')));

// 健康檢查與系統狀態 API
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
  console.log(`⚙️  運作環境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`========================================`);
});
