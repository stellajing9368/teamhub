// TeamHub - 資料庫初始化腳本 (建立所有資料表)
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

async function initDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ 錯誤：找不到 DATABASE_URL 環境變數！請在 .env 檔案中設定您的雲端 PostgreSQL 連線字串。');
    process.exit(1);
  }

  console.log('🔄 正在連線至雲端 PostgreSQL 並建立資料表結構...');
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    await pool.query(schemaSql);
    console.log('✅ 資料庫資料表建立完成！');
  } catch (err) {
    console.error('❌ 初始化資料表失敗：', err.message);
  } finally {
    await pool.end();
  }
}

initDatabase();
