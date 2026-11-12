// TeamHub - 資料庫連線模組 (PostgreSQL Connection Pool)
const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

// 建立 PostgreSQL 連線池
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    // 雲端託管資料庫 (如 Neon, Supabase, Render) 通常需要 SSL 連線
    rejectUnauthorized: false
  }
});

// 監聽連線事件
pool.on('connect', () => {
  // console.log('📦 成功建立新的資料庫客戶端連線');
});

pool.on('error', (err) => {
  console.error('❌ 資料庫連線池發生非預期錯誤：', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
