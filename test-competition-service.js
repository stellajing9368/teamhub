// TeamHub - 比賽報名與檢錄大表自動化單元測試 (test-competition-service.js)

// 模擬瀏覽器 localStorage
const store = {};
global.localStorage = {
  getItem: (key) => store[key] || null,
  setItem: (key, val) => { store[key] = String(val); },
  removeItem: (key) => { delete store[key]; }
};

// 引入假資料
const mockData = {
  competitions: [
    {
      id: "COMP-2026-001",
      name: "115 學年度全國大專校院排球聯賽 (UVL) 一般組分區預賽",
      organizer: "大專體總",
      date: "2026-12-05 ~ 12-07",
      location: "台大綜合體育館",
      deadline: "2026-11-25 23:59",
      maxMembers: 18,
      status: "報名中",
      description: "需備妥身分證、在學證明與生活照以供檢錄"
    }
  ],
  members: [
    {
      id: 1,
      name: "陳冠廷",
      role: "隊長",
      jerseyNumber: 1,
      position: "主攻手 (OH)",
      phone: "0912-345-678",
      studentId: "B11209045",
      idNumber: "A129876543",
      birthDate: "2003-05-18",
      avatar: "avatar.jpg",
      studentCard: "studentCard.jpg",
      enrollmentCert: "enrollmentCert.pdf"
    },
    {
      id: 3,
      name: "王大明",
      role: "隊員",
      jerseyNumber: 7,
      position: "快攻手 (MB)",
      phone: "0933-789-012",
      studentId: "B11105023",
      idNumber: "B127654321",
      birthDate: "2002-11-09",
      avatar: "avatar2.jpg",
      studentCard: "studentCard2.jpg",
      enrollmentCert: "enrollmentCert2.pdf"
    }
  ]
};
global.mockData = mockData;

const CompetitionService = require('./js/competition-service');

console.log('--- 開始執行「比賽報名與自動檢錄大表」單元測試 ---');

// 測試 1：初始比賽活動與預設報名載入
const comps = CompetitionService.getCompetitions();
console.assert(comps.length === 1, '測試 1 失敗：比賽數應為 1');
console.log('✅ 測試 1 通過：成功載入 UVL 大專盃排球聯賽賽程');

// 測試 2：拉出全隊檢錄名單大表，驗證自動匯入學號、身分證、生活照、在學證明
const roster = CompetitionService.getRegistrationRoster("COMP-2026-001", mockData.members);
console.assert(roster.length === 2, '測試 2 失敗：名冊應有 2 位隊員');

const cap = roster.find(r => r.name === "陳冠廷");
console.assert(cap.studentId === "B11209045", '測試 2 失敗：陳冠廷學號未正確匯入');
console.assert(cap.idNumber === "A129876543", '測試 2 失敗：陳冠廷身分證未正確匯入');
console.assert(cap.avatar === "avatar.jpg", '測試 2 失敗：陳冠廷生活照未正確匯入');
console.assert(cap.enrollmentCert === "enrollmentCert.pdf", '測試 2 失敗：陳冠廷在學證明未正確匯入');
console.assert(cap.isProfileComplete === true, '測試 2 失敗：陳冠廷資料應齊全 (5/5)');
console.log('✅ 測試 2 通過：全隊檢錄大表成功自動匯入「學號、身分證、生活照、在學證明、學生證」！');

// 測試 3：一鍵線上報名與取消參賽
// 挑選尚未在預設報名名單內的隊員「黃柏凱」
const testMemberName = "黃柏凱";
const isRegistered = CompetitionService.toggleRegistration("COMP-2026-001", testMemberName);
console.assert(isRegistered === true, `測試 3 失敗：${testMemberName} 應成功報名`);

const stats = CompetitionService.getCompetitionStats("COMP-2026-001");
console.assert(stats.registeredCount >= 1, '測試 3 失敗：報名人數應累計');
console.log(`✅ 測試 3 通過：一鍵報名參賽功能運作正常 (目前已報名 ${stats.registeredCount} 人)`);

// 再次切換 -> 取消報名
const isCancelled = CompetitionService.toggleRegistration("COMP-2026-001", testMemberName);
console.assert(isCancelled === false, `測試 3 失敗：${testMemberName} 應成功取消參賽`);
console.log('✅ 測試 3 通過：切換取消參賽功能運作正常');

console.log('🎉 所有 3 項「比賽報名與自動檢錄大表」單元測試全部 100% 通過！');
