// TeamHub - 測試種子資料腳本 (匯入展示用假資料)
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seedDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ 錯誤：找不到 DATABASE_URL 環境變數！請在 .env 檔案中設定。');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 正在產生安全加密密碼並寫入測試資料...');
    const defaultPassword = 'password123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    // 1. 建立測試使用者 (隊長、球經、一般隊員)
    const userQuery = `
      INSERT INTO users (email, password_hash, role, name, phone, jersey_number, position)
      VALUES 
        ('captain@teamhub.edu', $1, 'captain', '陳冠廷 (隊長)', '0912-345-678', 1, '主攻手 (OH)'),
        ('manager@teamhub.edu', $1, 'manager', '林欣妤 (球經)', '0922-123-456', NULL, '球隊經理'),
        ('member1@teamhub.edu', $1, 'member', '王大明 (隊員)', '0933-789-012', 7, '快攻手 (MB)'),
        ('member2@teamhub.edu', $1, 'member', '李小華 (隊員)', '0955-456-789', 12, '舉球員 (S)')
      ON CONFLICT (email) DO NOTHING;
    `;
    await pool.query(userQuery, [passwordHash]);

    // 2. 建立預設球衣商品
    const productQuery = `
      INSERT INTO products (name, description, price, sizes)
      VALUES 
        ('2026 隊呼紀念比賽主場球衣', '高透氣排汗布料、經典深藍配亮綠線條、免費燙印背號', 650, 'S,M,L,XL,2XL'),
        ('2026 客場自由球員專用球衣', '吸濕速乾輕量設計、螢光配色防撞設計', 680, 'S,M,L,XL'),
        ('TeamHub 專屬保暖排球帽T', '內刷毛厚磅棉、胸前立體球隊 Logo 刺繡', 850, 'M,L,XL,2XL')
      ON CONFLICT DO NOTHING;
    `;
    await pool.query(productQuery);

    // 3. 建立範例練習場次
    const practiceQuery = `
      INSERT INTO practices (title, practice_date, start_time, end_time, location, notes)
      VALUES 
        ('週二例行戰術練習', CURRENT_DATE + INTERVAL '2 day', '18:30:00', '21:30:00', '校本部體育館 排球場A', '重點：六人輪轉防守與快攻配合，請準時熱身。'),
        ('週四體能與接發球特訓', CURRENT_DATE + INTERVAL '4 day', '19:00:00', '21:00:00', '室外排球場 2號場', '重點：強發球接球穩定度與體能衝刺。')
      ON CONFLICT DO NOTHING;
    `;
    await pool.query(practiceQuery);

    console.log('✅ 測試種子資料匯入成功！');
    console.log('--------------------------------------------------');
    console.log('📋 預設測試帳號 (密碼皆為: password123)');
    console.log('1. 隊長: captain@teamhub.edu');
    console.log('2. 球經: manager@teamhub.edu');
    console.log('3. 隊員: member1@teamhub.edu / member2@teamhub.edu');
    console.log('--------------------------------------------------');
  } catch (err) {
    console.error('❌ 匯入種子資料失敗：', err.message);
  } finally {
    await pool.end();
  }
}

seedDatabase();
