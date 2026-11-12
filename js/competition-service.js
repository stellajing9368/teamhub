/**
 * TeamHub 球隊雲端整合管理平台 - 比賽報名服務層 (competition-service.js)
 * 職責：
 * 1. 統一管理比賽活動 (Competitions) 與報名名冊 (Registrations) 的 localStorage 持久化儲存
 * 2. 自動拉出全隊檢錄名單大表，自動匯入：學號、身分證字號、出生年月日、生活照、學生證、在學證明
 * 3. 支援隊員線上「一鍵報名參賽」與球經勾選核准
 * 4. 匯出符合大專排球聯賽 (UVL) 規範的相容 Excel UTF-8 BOM CSV 報名清冊
 */

const STORAGE_KEY_COMPETITIONS = 'teamhub_competitions_v1';
const STORAGE_KEY_REGISTRATIONS = 'teamhub_registrations_v1';

const CompetitionService = {
  /**
   * 初始化比賽資料庫
   */
  init() {
    // 1. 初始化比賽活動清單
    if (!localStorage.getItem(STORAGE_KEY_COMPETITIONS)) {
      const initialComps = mockData && mockData.competitions ? mockData.competitions : [];
      localStorage.setItem(STORAGE_KEY_COMPETITIONS, JSON.stringify(initialComps));
    }

    // 2. 初始化預設已報名隊員 (UVL 預賽預設報名前 4 位隊員)
    if (!localStorage.getItem(STORAGE_KEY_REGISTRATIONS)) {
      const defaultRegistrations = [
        { competitionId: "COMP-2026-001", memberName: "陳冠廷", registeredAt: "2026-11-10 14:00" },
        { competitionId: "COMP-2026-001", memberName: "林欣妤", registeredAt: "2026-11-10 14:05" },
        { competitionId: "COMP-2026-001", memberName: "王大明", registeredAt: "2026-11-11 09:30" },
        { competitionId: "COMP-2026-001", memberName: "李小華", registeredAt: "2026-11-11 11:20" }
      ];
      localStorage.setItem(STORAGE_KEY_REGISTRATIONS, JSON.stringify(defaultRegistrations));
    }
  },

  getCompetitions() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_COMPETITIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  getRegistrations() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_REGISTRATIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveRegistrations(regs) {
    localStorage.setItem(STORAGE_KEY_REGISTRATIONS, JSON.stringify(regs));
  },

  /**
   * 拉出某場比賽的全隊檢錄報名大表
   * 自動匯入：學號、身分證字號、出生年月日、生活照、學生證正面、在學證明
   * @param {string} competitionId 比賽活動 ID
   * @param {Array} members 既有隊員資料庫
   */
  getRegistrationRoster(competitionId, members = []) {
    const registrations = this.getRegistrations();
    const compRegs = registrations.filter(r => r.competitionId === competitionId);
    const registeredNames = new Set(compRegs.map(r => r.memberName));

    return members.map(m => {
      const isRegistered = registeredNames.has(m.name);
      const regRecord = compRegs.find(r => r.memberName === m.name);

      // 檢查檢錄必備資料齊全度 (學號、身分證、生活照、在學證明)
      const hasStudentId = Boolean(m.studentId);
      const hasIdNumber = Boolean(m.idNumber);
      const hasAvatar = Boolean(m.avatar);
      const hasStudentCard = Boolean(m.studentCard);
      const hasEnrollmentCert = Boolean(m.enrollmentCert);

      const readyCount = (hasStudentId ? 1 : 0) + (hasIdNumber ? 1 : 0) + (hasAvatar ? 1 : 0) + (hasStudentCard ? 1 : 0) + (hasEnrollmentCert ? 1 : 0);
      const isProfileComplete = readyCount === 5;

      return {
        memberId: m.id,
        name: m.name,
        role: m.role,
        jerseyNumber: m.jerseyNumber,
        position: m.position,
        phone: m.phone,
        email: m.email,
        studentId: m.studentId || "未填寫",
        idNumber: m.idNumber || "未填寫",
        birthDate: m.birthDate || "未填寫",
        avatar: m.avatar,
        studentCard: m.studentCard,
        enrollmentCert: m.enrollmentCert,
        isRegistered,
        registeredAt: regRecord ? regRecord.registeredAt : null,
        isProfileComplete,
        readyCount
      };
    });
  },

  /**
   * 切換特定隊員的比賽報名狀態 (一鍵報名 / 取消報名)
   */
  toggleRegistration(competitionId, memberName) {
    let regs = this.getRegistrations();
    const existingIndex = regs.findIndex(r => r.competitionId === competitionId && r.memberName === memberName);

    let isNowRegistered = false;
    if (existingIndex !== -1) {
      // 已報名 -> 取消報名
      regs.splice(existingIndex, 1);
      isNowRegistered = false;
    } else {
      // 未報名 -> 報名
      regs.push({
        competitionId,
        memberName,
        registeredAt: new Date().toLocaleString('zh-TW', { hour12: false })
      });
      isNowRegistered = true;
    }

    this.saveRegistrations(regs);
    return isNowRegistered;
  },

  /**
   * 取得某場比賽目前報名人數與上限
   */
  getCompetitionStats(competitionId) {
    const competitions = this.getCompetitions();
    const comp = competitions.find(c => c.id === competitionId);
    const regs = this.getRegistrations().filter(r => r.competitionId === competitionId);

    return {
      registeredCount: regs.length,
      maxMembers: comp ? comp.maxMembers : 18,
      competitionName: comp ? comp.name : ''
    };
  },

  /**
   * 匯出符合大專排球聯賽 (UVL) 規範的 CSV 報名檢錄大表
   */
  exportRosterCSV(competitionId, members = []) {
    const roster = this.getRegistrationRoster(competitionId, members);
    const competitions = this.getCompetitions();
    const comp = competitions.find(c => c.id === competitionId);
    const compTitle = comp ? comp.name : '大專排球聯賽';

    let csv = "\uFEFF"; // UTF-8 BOM
    csv += `賽事名稱,"${compTitle}"\n`;
    csv += `匯出日期,"${new Date().toLocaleDateString('zh-TW')}"\n\n`;
    csv += "背號,姓名,球隊身分,守備位置,學號,身分證字號,出生年月日,聯絡電話,生活照狀態,學生證檢核,在學證明檢核,報名狀態,報名時間\n";

    roster.forEach(r => {
      const row = [
        r.jerseyNumber,
        `"${r.name}"`,
        r.role,
        r.position,
        r.studentId,
        r.idNumber, // 匯出時包含完整身分證供大會檢錄
        r.birthDate,
        r.phone,
        r.avatar ? '已上傳' : '未上傳',
        r.studentCard ? '已檢核' : '待補件',
        r.enrollmentCert ? '已檢核' : '待補件',
        r.isRegistered ? '已報名參賽' : '未報名',
        r.registeredAt || '-'
      ];
      csv += row.join(",") + "\n";
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `TeamHub_${compTitle.slice(0, 15)}_正式報名清冊_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// 立即初始化
CompetitionService.init();

// 相容 Node.js 測試
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CompetitionService;
}
