-- TeamHub 球隊雲端整合管理平台 - 資料庫綱要 (PostgreSQL Schema)

-- 1. 使用者與隊員基本資料表 (users)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'manager', 'captain', 'admin')),
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(30),
    jersey_number INT,
    position VARCHAR(30) DEFAULT '未定', -- 主攻手(OH), 快攻手(MB), 舉球員(S), 舉球對角(OP), 自由球員(L)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 球衣商品表 (products)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price INT NOT NULL CHECK (price >= 0),
    sizes VARCHAR(100) DEFAULT 'XS,S,M,L,XL,2XL',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. 球衣訂單主表 (orders)
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_amount INT NOT NULL DEFAULT 0,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
    payment_note VARCHAR(255),
    order_status VARCHAR(20) NOT NULL DEFAULT 'submitted' CHECK (order_status IN ('submitted', 'confirmed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. 訂單細項表 (order_items)
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id),
    size VARCHAR(10) NOT NULL,
    custom_name VARCHAR(50),
    custom_number INT,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price INT NOT NULL CHECK (unit_price >= 0),
    subtotal INT NOT NULL CHECK (subtotal >= 0)
);

-- 5. 練習活動表 (practices)
CREATE TABLE IF NOT EXISTS practices (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    practice_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(100) NOT NULL,
    notes TEXT,
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. 出席與請假紀錄表 (attendance_records)
CREATE TABLE IF NOT EXISTS attendance_records (
    id SERIAL PRIMARY KEY,
    practice_id INT NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent_leave', 'absent_unexcused', 'late')),
    leave_reason TEXT,
    leave_submitted_at TIMESTAMP WITH TIME ZONE,
    updated_by INT REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(practice_id, user_id)
);

-- 7. 比賽活動表 (competitions)
CREATE TABLE IF NOT EXISTS competitions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    competition_date DATE NOT NULL,
    location VARCHAR(100) NOT NULL,
    registration_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT,
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. 比賽報名紀錄表 (competition_registrations)
CREATE TABLE IF NOT EXISTS competition_registrations (
    id SERIAL PRIMARY KEY,
    competition_id INT NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notes VARCHAR(255),
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(competition_id, user_id)
);

-- 9. 排球陣型戰術表 (lineups)
CREATE TABLE IF NOT EXISTS lineups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    rotation_number INT DEFAULT 1 CHECK (rotation_number BETWEEN 1 AND 6),
    positions_json JSONB NOT NULL,
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
