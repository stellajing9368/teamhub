/**
 * TeamHub 球隊雲端整合管理平台 - 展示用假資料 (Mock Data)
 * 供前端頁面展示使用，未來將替換為後端 PostgreSQL 資料庫查詢結果。
 */

const mockData = {
  // 1. 儀表板總覽指標
  stats: {
    totalMembers: 6,         // 隊員總數
    paidMembers: 4,          // 已繳隊費正式隊員數
    monthlyAttendance: 88,    // 本月團隊出席率 (%)
    pendingOrdersCount: 3,   // 待確認/待收款球衣訂單數
    nextPracticeDays: 2      // 距下次練習剩餘天數
  },

  // 2. 指定球衣商品列表 (練習服、比賽服與定價)
  products: [
    { id: 1, name: "練習服 (酒紅)", price: 350, type: "practice", desc: "透氣排汗布料、經典酒紅色" },
    { id: 2, name: "練習服 (富邦綠)", price: 350, type: "practice", desc: "高彈性排汗材質、活力富邦綠" },
    { id: 3, name: "比賽服 (一套含衣褲)", price: 700, type: "competition", desc: "官方正式聯賽指定款、整套含上衣與短褲" },
    { id: 4, name: "比賽服 (單件上衣)", price: 500, type: "competition", desc: "官方比賽單件上衣、含背號燙印" },
    { id: 5, name: "比賽褲 (單件短褲)", price: 300, type: "competition", desc: "排球專用高延展性運動短褲" }
  ],

  // 3. 隊員名單資料 (包含比賽檢錄必備之學號、身分證字號、出生年月日、隊費狀態、證件照片)
  teamFeeAmount: 300, // 隊費金額 300 元
  members: [
    { 
      id: 1, 
      name: "陳冠廷", 
      role: "隊長", 
      jerseyNumber: 1, 
      position: "主攻手 (OH)", 
      phone: "0912-345-678", 
      email: "captain@teamhub.edu", 
      studentId: "B11209045",
      idNumber: "A129876543",
      birthDate: "2003-05-18",
      attendanceRate: 95,
      teamFeePaid: true, // 已繳隊費
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      studentCard: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=300&auto=format&fit=crop&q=80",
      enrollmentCert: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=300&auto=format&fit=crop&q=80"
    },
    { 
      id: 2, 
      name: "林欣妤", 
      role: "球經", 
      jerseyNumber: "-", 
      position: "隨隊經理", 
      phone: "0922-123-456", 
      email: "manager@teamhub.edu", 
      studentId: "B11209012",
      idNumber: "F228765432",
      birthDate: "2004-02-14",
      attendanceRate: 100,
      teamFeePaid: true, // 已繳隊費
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      studentCard: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=300&auto=format&fit=crop&q=80",
      enrollmentCert: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=300&auto=format&fit=crop&q=80"
    },
    { 
      id: 3, 
      name: "王大明", 
      role: "隊員", 
      jerseyNumber: 7, 
      position: "快攻手 (MB)", 
      phone: "0933-789-012", 
      email: "daming@teamhub.edu", 
      studentId: "B11105023",
      idNumber: "B127654321",
      birthDate: "2002-11-09",
      attendanceRate: 88,
      teamFeePaid: true, // 已繳隊費
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      studentCard: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=300&auto=format&fit=crop&q=80",
      enrollmentCert: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=300&auto=format&fit=crop&q=80"
    },
    { 
      id: 4, 
      name: "李小華", 
      role: "隊員", 
      jerseyNumber: 12, 
      position: "舉球員 (S)", 
      phone: "0955-456-789", 
      email: "huahua@teamhub.edu", 
      studentId: "B11308077",
      idNumber: "H126543210",
      birthDate: "2005-08-25",
      attendanceRate: 92,
      teamFeePaid: true, // 已繳隊費
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      studentCard: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=300&auto=format&fit=crop&q=80",
      enrollmentCert: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=300&auto=format&fit=crop&q=80"
    },
    { 
      id: 5, 
      name: "張俊傑", 
      role: "隊員", 
      jerseyNumber: 3, 
      position: "副攻手 (OP)", 
      phone: "0966-111-222", 
      email: "jj_chang@teamhub.edu", 
      studentId: "B11105088",
      idNumber: "A125432109",
      birthDate: "2003-01-30",
      attendanceRate: 80,
      teamFeePaid: false, // 未繳隊費 (尚未入隊)
      avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
      studentCard: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=300&auto=format&fit=crop&q=80",
      enrollmentCert: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=300&auto=format&fit=crop&q=80"
    },
    { 
      id: 6, 
      name: "黃柏凱", 
      role: "隊員", 
      jerseyNumber: 18, 
      position: "自由球員 (L)", 
      phone: "0977-333-444", 
      email: "kai_libero@teamhub.edu", 
      studentId: "B11209099",
      idNumber: "E124321098",
      birthDate: "2004-10-12",
      attendanceRate: 85,
      teamFeePaid: false, // 未繳隊費 (尚未入隊)
      avatar: null, // 尚未上傳生活照
      studentCard: null,
      enrollmentCert: null
    }
  ],

  // 4. 球衣訂單假資料
  orders: [
    { id: "ORD-202611-001", memberName: "王大明", product: "練習服 (酒紅)", size: "XL", customNumber: 7, customName: "DA MING", unitPrice: 350, quantity: 1, amount: 350, paymentStatus: "paid", orderDate: "2026-11-10" },
    { id: "ORD-202611-002", memberName: "李小華", product: "比賽服 (一套含衣褲)", size: "M", customNumber: 12, customName: "HUA", unitPrice: 700, quantity: 1, amount: 700, paymentStatus: "unpaid", orderDate: "2026-11-11" },
    { id: "ORD-202611-003", memberName: "黃柏凱", product: "練習服 (富邦綠)", size: "L", customNumber: 18, customName: "KAI", unitPrice: 350, quantity: 2, amount: 700, paymentStatus: "paid", orderDate: "2026-11-11" }
  ],

  // 5. 官方比賽活動假資料
  competitions: [
    {
      id: "COMP-2026-001",
      name: "115 學年度全國大專校院排球聯賽 (UVL) 一般組分區預賽",
      organizer: "大專體育總會排球委員會",
      date: "2026-12-05 ~ 12-07",
      location: "國立台灣大學 綜合體育館",
      deadline: "2026-11-25 23:59",
      maxMembers: 18,
      status: "報名中",
      description: "本學年度正式賽事，出賽隊員需備妥身分證、學生證正面及在學證明文件以供大會檢錄。"
    },
    {
      id: "COMP-2026-002",
      name: "第十二屆北區大專校院排球友誼邀請賽",
      organizer: "北區大專排球聯盟",
      date: "2026-12-19 ~ 12-20",
      location: "國立臺灣師範大學 體育館",
      deadline: "2026-12-10 18:00",
      maxMembers: 16,
      status: "即將截止",
      description: "交流邀請賽，強化實戰配合，賽後提供交流午餐。"
    }
  ]
};
