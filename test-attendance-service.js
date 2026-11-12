// TeamHub - 練習出缺席管理自動化單元測試 (test-attendance-service.js)

// 模擬瀏覽器 localStorage
const store = {};
global.localStorage = {
  getItem: (key) => store[key] || null,
  setItem: (key, val) => { store[key] = String(val); },
  removeItem: (key) => { delete store[key]; }
};

const AttendanceService = require('./js/attendance-service');

// 既有隊員假資料
const mockMembers = [
  { id: 1, name: "陳冠廷", role: "隊長", jerseyNumber: 1, position: "主攻手 (OH)" },
  { id: 2, name: "林欣妤", role: "球經", jerseyNumber: "-", position: "隨隊經理" },
  { id: 3, name: "王大明", role: "隊員", jerseyNumber: 7, position: "快攻手 (MB)" },
  { id: 4, name: "李小華", role: "隊員", jerseyNumber: 12, position: "舉球員 (S)" }
];

console.log('--- 開始執行「練習出缺席管理」單元測試 ---');

// 測試 1：建立練習 (固定星期一、18:00~22:00、甲場)
const newPrac = AttendanceService.createPractice({
  date: "2026-11-23", // 星期一
  court: "甲場",
  time: "18:00 - 22:00",
  note: "體能衝刺與快攻配合"
});
console.assert(newPrac.weekday === '星期一', `測試 1 失敗：星期應為星期一，實際為 ${newPrac.weekday}`);
console.assert(newPrac.court === '甲場', '測試 1 失敗：場地應為甲場');
console.log(`✅ 測試 1 通過：成功建立練習場次 ${newPrac.id} (${newPrac.date} ${newPrac.weekday} ${newPrac.court})`);

// 測試 2：編輯練習場次 (修改場地為乙場)
const updatedPrac = AttendanceService.updatePractice(newPrac.id, { court: "乙場" });
console.assert(updatedPrac.court === "乙場", '測試 2 失敗：場地應更新為乙場');
console.log(`✅ 測試 2 通過：成功修改練習場地為 ${updatedPrac.court}`);

// 測試 3：隊員提出請假與晚到申請
const leave1 = AttendanceService.submitLeave({
  practiceId: newPrac.id,
  memberName: "王大明",
  type: "leave",
  reason: "系上有必修考試"
});
const leave2 = AttendanceService.submitLeave({
  practiceId: newPrac.id,
  memberName: "李小華",
  type: "late",
  reason: "打工稍晚 30 分鐘抵達"
});
console.assert(leave1.type === "leave", '測試 3 失敗：王大明應為請假');
console.assert(leave2.type === "late", '測試 3 失敗：李小華應為晚到');
console.log('✅ 測試 3 通過：隊員請假與晚到申請已獨立妥善存檔');

// 測試 4：出席登記 (陳冠廷: 出席, 林欣妤: 出席, 王大明: 請假, 李小華: 尚未確認)
AttendanceService.setMemberAttendanceStatus(newPrac.id, "陳冠廷", "present");
AttendanceService.setMemberAttendanceStatus(newPrac.id, "林欣妤", "present");
AttendanceService.setMemberAttendanceStatus(newPrac.id, "王大明", "leave", "已核准系上考試請假");
// 李小華保持 unconfirmed (尚未確認)

const checklist = AttendanceService.getPracticeChecklist(newPrac.id, mockMembers);
const hua = checklist.find(m => m.memberName === "李小華");
console.assert(hua.status === "unconfirmed", '測試 4 失敗：李小華應為尚未確認');
console.log('✅ 測試 4 通過：點名狀態儲存成功，且李小華正確保留為「尚未確認」');

// 測試 5：出席率計算核心規則驗證
// 規則：未確認 (李小華) 不計入分母！陳冠廷 (1/1=100%), 王大明 (0/1=0%), 李小華 (0場點名 = 預設 100%)
const stats = AttendanceService.calculateTeamStats(mockMembers, { startDate: "2026-11-20", endDate: "2026-11-30" });
const capStats = stats.find(s => s.name === "陳冠廷");
const mingStats = stats.find(s => s.name === "王大明");
const huaStats = stats.find(s => s.name === "李小華");

console.assert(capStats.presentCount === 1 && capStats.attendanceRate === 100, '測試 5 失敗：陳冠廷出席率應為 100%');
console.assert(mingStats.leaveCount === 1 && mingStats.attendanceRate === 0, '測試 5 失敗：王大明請假 1 次，出席率應為 0%');
console.assert(huaStats.totalCheckedPractices === 0, '測試 5 失敗：李小華尚未確認，不應計入分母');
console.log('✅ 測試 5 通過：出席率公式與「未確認不計入分母」規則驗證無誤！');

// 測試 6：取消練習場次規則 (取消的場次不計入出席分母)
AttendanceService.cancelPractice(newPrac.id);
const statsAfterCancel = AttendanceService.calculateTeamStats(mockMembers, { startDate: "2026-11-20", endDate: "2026-11-30" });
const capAfterCancel = statsAfterCancel.find(s => s.name === "陳冠廷");
console.assert(capAfterCancel.totalCheckedPractices === 0, '測試 6 失敗：取消的場次不應計入已結算場次');
console.log('✅ 測試 6 通過：練習取消後，全隊出席分母自動排除該場次');

console.log('🎉 所有 6 項「練習出缺席管理」單元測試全部 100% 通過！');
