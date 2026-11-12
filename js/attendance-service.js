/**
 * TeamHub 球隊雲端整合管理平台 - 練習出缺席服務層 (attendance-service.js)
 * 職責：
 * 1. 統一管理練習場次 (Practices)、請假申請 (Leave Requests)、出席紀錄 (Attendance Records) 的 localStorage 持久化儲存
 * 2. 支援固定每週一、二練習排程，時間 18:00~22:00，甲/乙/丙/丁場地設定
 * 3. 隊員請假/晚到申請提交與獨立保存
 * 4. 出席登記：出席、缺席、請假、尚未確認 (尚未確認不計入出席)
 * 5. 全隊出席率精準統計與日期區間篩選
 * 6. 匯出相容 Excel 的 UTF-8 BOM CSV 報表
 */

const STORAGE_KEY_PRACTICES = 'teamhub_practices_v1';
const STORAGE_KEY_LEAVES = 'teamhub_leaves_v1';
const STORAGE_KEY_ATTENDANCE = 'teamhub_attendance_v1';

const AttendanceService = {
  /**
   * 初始化出缺席資料庫：若 localStorage 無資料，寫入預設假資料
   */
  init() {
    // 1. 初始化練習活動
    if (!localStorage.getItem(STORAGE_KEY_PRACTICES)) {
      const defaultPractices = [
        {
          id: "PRAC-202611-001",
          date: "2026-11-10",
          weekday: "星期二",
          time: "18:00 - 22:00",
          court: "甲場",
          status: "completed", // completed (已點名結算), scheduled (排定中), cancelled (已取消)
          note: "重點：六人站位輪轉與發球穩定度"
        },
        {
          id: "PRAC-202611-002",
          date: "2026-11-16",
          weekday: "星期一",
          time: "18:00 - 22:00",
          court: "乙場",
          status: "scheduled",
          note: "重點：快攻走位搭配與防守補位"
        },
        {
          id: "PRAC-202611-003",
          date: "2026-11-17",
          weekday: "星期二",
          time: "18:00 - 22:00",
          court: "甲場",
          status: "scheduled",
          note: "重點：模擬比賽實戰對抗，請準時熱身"
        }
      ];
      localStorage.setItem(STORAGE_KEY_PRACTICES, JSON.stringify(defaultPractices));
    }

    // 2. 初始化請假申請紀錄
    if (!localStorage.getItem(STORAGE_KEY_LEAVES)) {
      const defaultLeaves = [
        {
          id: "LEAVE-001",
          practiceId: "PRAC-202611-001",
          practiceDate: "2026-11-10",
          practiceInfo: "2026-11-10 (二) 18:00~22:00 甲場",
          memberName: "王大明",
          type: "leave", // leave (請假) / late (晚到)
          reason: "系上有期中實驗課至晚上八點",
          submittedAt: "2026-11-09 15:20"
        },
        {
          id: "LEAVE-002",
          practiceId: "PRAC-202611-002",
          practiceDate: "2026-11-16",
          practiceInfo: "2026-11-16 (一) 18:00~22:00 乙場",
          memberName: "張俊傑",
          type: "late",
          reason: "校外工讀預計 19:00 抵達球場",
          submittedAt: "2026-11-12 10:15"
        }
      ];
      localStorage.setItem(STORAGE_KEY_LEAVES, JSON.stringify(defaultLeaves));
    }

    // 3. 初始化歷史出席紀錄 (PRAC-202611-001 已完成點名)
    if (!localStorage.getItem(STORAGE_KEY_ATTENDANCE)) {
      const defaultAttendance = [
        { practiceId: "PRAC-202611-001", memberName: "陳冠廷", status: "present", note: "" },
        { practiceId: "PRAC-202611-001", memberName: "林欣妤", status: "present", note: "" },
        { practiceId: "PRAC-202611-001", memberName: "王大明", status: "leave", note: "有提出請假申請" },
        { practiceId: "PRAC-202611-001", memberName: "李小華", status: "present", note: "" },
        { practiceId: "PRAC-202611-001", memberName: "張俊傑", status: "present", note: "" },
        { practiceId: "PRAC-202611-001", memberName: "黃柏凱", status: "absent", note: "無故缺席" }
      ];
      localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(defaultAttendance));
    }
  },

  /* ========================================================================
     一、管理者建立與管理練習場次 (Practices)
     ======================================================================== */

  getPractices() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PRACTICES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  savePractices(practices) {
    localStorage.setItem(STORAGE_KEY_PRACTICES, JSON.stringify(practices));
  },

  /**
   * 根據日期計算星期幾中文名稱
   */
  getWeekdayName(dateString) {
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const d = new Date(dateString);
    return isNaN(d.getDay()) ? '' : weekdays[d.getDay()];
  },

  /**
   * 建立新練習活動
   */
  createPractice({ date, court, time, note }) {
    const practices = this.getPractices();
    const count = practices.length + 1;
    const newId = `PRAC-${date.replace(/-/g, '').slice(0, 6)}-${String(count).padStart(3, '0')}`;

    const newPractice = {
      id: newId,
      date: date,
      weekday: this.getWeekdayName(date),
      time: time || "18:00 - 22:00",
      court: court || "甲場",
      status: "scheduled", // scheduled (排定中)
      note: note || ""
    };

    practices.push(newPractice);
    // 按日期由近到遠排序
    practices.sort((a, b) => new Date(a.date) - new Date(b.date));
    this.savePractices(practices);
    return newPractice;
  },

  /**
   * 修改練習場次
   */
  updatePractice(id, updateData) {
    const practices = this.getPractices();
    const index = practices.findIndex(p => p.id === id);
    if (index === -1) return null;

    if (updateData.date) {
      updateData.weekday = this.getWeekdayName(updateData.date);
    }

    practices[index] = { ...practices[index], ...updateData };
    this.savePractices(practices);
    return practices[index];
  },

  /**
   * 取消練習場次 (取消的練習不計入出席率分母)
   */
  cancelPractice(id) {
    const practices = this.getPractices();
    const target = practices.find(p => p.id === id);
    if (target) {
      target.status = target.status === 'cancelled' ? 'scheduled' : 'cancelled';
      this.savePractices(practices);
      return target;
    }
    return null;
  },

  /* ========================================================================
     二、隊員請假 / 晚到管理 (Leaves)
     ======================================================================== */

  getLeaves() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_LEAVES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveLeaves(leaves) {
    localStorage.setItem(STORAGE_KEY_LEAVES, JSON.stringify(leaves));
  },

  /**
   * 送出隊員請假 / 晚到申請
   */
  submitLeave({ practiceId, memberName, type, reason }) {
    const practices = this.getPractices();
    const practice = practices.find(p => p.id === practiceId);
    const practiceInfo = practice 
      ? `${practice.date} (${practice.weekday}) ${practice.time} ${practice.court}`
      : "排定練習";

    const leaves = this.getLeaves();
    const newLeave = {
      id: `LEAVE-${String(leaves.length + 1).padStart(3, '0')}`,
      practiceId,
      practiceDate: practice ? practice.date : '',
      practiceInfo,
      memberName,
      type: type || 'leave', // 'leave' (請假) 或 'late' (晚到)
      reason: reason ? reason.trim() : '事假',
      submittedAt: new Date().toLocaleString('zh-TW', { hour12: false })
    };

    leaves.unshift(newLeave);
    this.saveLeaves(leaves);
    return newLeave;
  },

  /**
   * 查詢某位隊員在特定練習是否已有提出請假/晚到申請
   */
  findLeaveForMember(practiceId, memberName) {
    const leaves = this.getLeaves();
    return leaves.find(l => l.practiceId === practiceId && l.memberName === memberName) || null;
  },

  /* ========================================================================
     三、出席登記 (Attendance Records)
     ======================================================================== */

  getAttendanceRecords() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_ATTENDANCE);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveAttendanceRecords(records) {
    localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(records));
  },

  /**
   * 取得特定練習場次的全隊點名狀態 (整合既有隊員名單)
   * @param {string} practiceId 練習 ID
   * @param {Array} members 既有隊員名冊陣列
   */
  getPracticeChecklist(practiceId, members = []) {
    const allRecords = this.getAttendanceRecords();
    const practiceRecords = allRecords.filter(r => r.practiceId === practiceId);

    // 以既有隊員名冊為主，若尚未登記過，狀態預設為 'unconfirmed' (尚未確認)
    return members.map(m => {
      const existing = practiceRecords.find(r => r.memberName === m.name);
      const leaveApp = this.findLeaveForMember(practiceId, m.name);

      return {
        memberId: m.id,
        memberName: m.name,
        role: m.role,
        jerseyNumber: m.jerseyNumber,
        position: m.position,
        // 狀態: 'present' (出席), 'absent' (缺席), 'leave' (請假), 'unconfirmed' (尚未確認)
        status: existing ? existing.status : 'unconfirmed',
        note: existing ? existing.note : '',
        leaveApp: leaveApp // 若有事先送假單，附上假單資訊以供球經核對
      };
    });
  },

  /**
   * 球經/管理者更新特定隊員在某場練習的出席狀態
   */
  setMemberAttendanceStatus(practiceId, memberName, newStatus, note = '') {
    const allRecords = this.getAttendanceRecords();
    const index = allRecords.findIndex(r => r.practiceId === practiceId && r.memberName === memberName);

    if (index !== -1) {
      allRecords[index].status = newStatus;
      if (note) allRecords[index].note = note;
    } else {
      allRecords.push({
        practiceId,
        memberName,
        status: newStatus,
        note: note || ''
      });
    }

    this.saveAttendanceRecords(allRecords);

    // 同步檢查練習場次狀態：若有任何一人已點名確認，將練習場次標記為 'completed' (已點名)
    const practices = this.getPractices();
    const practice = practices.find(p => p.id === practiceId);
    if (practice && practice.status === 'scheduled') {
      practice.status = 'completed';
      this.savePractices(practices);
    }

    return true;
  },

  /* ========================================================================
     四、全隊出席統計與出席率計算 (Statistics)
     ======================================================================== */

  /**
   * 計算每位隊員的出席統計 (支援日期區間篩選)
   * 
   * 【出席率計算規則定義】：
   * 1. 取消的練習 (status === 'cancelled')：不舉行，絕不計入應到場次 (不計入分母)。
   * 2. 尚未確認的紀錄 (status === 'unconfirmed')：尚未點名，不計入分母，且不能自動視為出席。
   * 3. 應出席總場次 (有效分母)：該隊員在已點名場次中的紀錄總數 (出席 + 缺席 + 請假)。
   * 4. 出席率公式：
   *    出席率 = (實際出席次數 / (出席次數 + 缺席次數 + 請假次數)) * 100%
   *    (若分母為 0，出席率顯示為 100% 或 '--')
   * 
   * @param {Array} members 既有隊員名冊陣列
   * @param {Object} dateRange { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }
   */
  calculateTeamStats(members = [], dateRange = {}) {
    const practices = this.getPractices();
    const allRecords = this.getAttendanceRecords();
    const allLeaves = this.getLeaves();

    // 依日期區間過濾練習場次 (排除取消的場次)
    const validPractices = practices.filter(p => {
      if (p.status === 'cancelled') return false; // 取消場次不計入
      if (dateRange.startDate && p.date < dateRange.startDate) return false;
      if (dateRange.endDate && p.date > dateRange.endDate) return false;
      return true;
    });

    const validPracticeIds = new Set(validPractices.map(p => p.id));

    // 計算每位隊員的指標
    return members.map(m => {
      const memberRecords = allRecords.filter(r => 
        validPracticeIds.has(r.practiceId) && r.memberName === m.name
      );

      let presentCount = 0;
      let absentCount = 0;
      let leaveCount = 0;
      let unconfirmedCount = 0;

      memberRecords.forEach(r => {
        if (r.status === 'present') presentCount++;
        else if (r.status === 'absent') absentCount++;
        else if (r.status === 'leave') leaveCount++;
        else if (r.status === 'unconfirmed') unconfirmedCount++;
      });

      // 累計隊員填寫的晚到/請假申請次數
      const memberLeaves = allLeaves.filter(l => 
        validPracticeIds.has(l.practiceId) && l.memberName === m.name
      );
      const lateAppCount = memberLeaves.filter(l => l.type === 'late').length;

      // 有效分母 = 出席 + 缺席 + 請假 (尚未確認與取消練習不計入分母)
      const totalCheckedPractices = presentCount + absentCount + leaveCount;

      let attendanceRate = 0;
      if (totalCheckedPractices > 0) {
        attendanceRate = Math.round((presentCount / totalCheckedPractices) * 100);
      } else {
        attendanceRate = 100; // 尚無點名場次時預設 100%
      }

      return {
        memberId: m.id,
        name: m.name,
        role: m.role,
        jerseyNumber: m.jerseyNumber,
        position: m.position,
        totalCheckedPractices, // 總應到場次 (有效分母)
        presentCount,          // 出席次數
        absentCount,           // 缺席次數
        leaveCount,            // 請假次數
        lateAppCount,          // 晚到申請次數
        unconfirmedCount,      // 尚未點名確認次數
        attendanceRate         // 計算之出席率 (%)
      };
    });
  },

  /**
   * 匯出全隊出席統計 CSV (相容 Excel UTF-8 BOM)
   */
  exportAttendanceCSV(members = [], dateRange = {}) {
    const stats = this.calculateTeamStats(members, dateRange);
    let csv = "\uFEFF"; // UTF-8 BOM 避免 Excel 亂碼
    csv += "背號,姓名,球隊身分,守備位置,已結算應到場次,實際出席次數,缺席次數,請假次數,晚到次數,出席率(%)\n";

    stats.forEach(s => {
      const row = [
        s.jerseyNumber,
        `"${s.name}"`,
        s.role,
        s.position,
        s.totalCheckedPractices,
        s.presentCount,
        s.absentCount,
        s.leaveCount,
        s.lateAppCount,
        `${s.attendanceRate}%`
      ];
      csv += row.join(",") + "\n";
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `TeamHub_全隊練習出缺席統計_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// 立即初始化資料庫
AttendanceService.init();

// 相容 Node.js 單元測試
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AttendanceService;
}
