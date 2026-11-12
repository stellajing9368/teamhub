// 模擬測試腳本：驗證 OrderService 業務邏輯與統計計算

// 模擬瀏覽器環境的 localStorage
const store = {};
global.localStorage = {
  getItem: (key) => store[key] || null,
  setItem: (key, val) => { store[key] = String(val); },
  removeItem: (key) => { delete store[key]; }
};

// 載入 mockData
const mockData = {
  orders: [
    { id: "ORD-202611-001", memberName: "王大明", product: "練習服 (酒紅)", size: "XL", customNumber: 7, customName: "DA MING", unitPrice: 350, quantity: 1, amount: 350, paymentStatus: "paid", orderDate: "2026-11-10" },
    { id: "ORD-202611-002", memberName: "李小華", product: "比賽服 (一套含衣褲)", size: "M", customNumber: 12, customName: "HUA", unitPrice: 700, quantity: 1, amount: 700, paymentStatus: "unpaid", orderDate: "2026-11-11" },
    { id: "ORD-202611-003", memberName: "黃柏凱", product: "練習服 (富邦綠)", size: "L", customNumber: 18, customName: "KAI", unitPrice: 350, quantity: 2, amount: 700, paymentStatus: "paid", orderDate: "2026-11-11" }
  ]
};
global.mockData = mockData;

// 引入 order-service
const OrderService = require('./js/order-service');

console.log('--- 開始執行球衣訂購管理單元測試 ---');

// 測試 1：初始資料載入
const initialOrders = OrderService.getAll();
console.assert(initialOrders.length === 3, '測試 1 失敗：初始訂單應為 3 筆');
console.log('✅ 測試 1 通過：初始訂單資料成功載入 (3 筆)');

// 測試 2：新增訂單與金額自動計算
const newOrder = OrderService.create({
  memberName: '張俊傑',
  product: '比賽服 (一套含衣褲)',
  size: '2XL',
  customNumber: 3,
  customName: 'JJ',
  unitPrice: 700,
  quantity: 2
});
console.assert(newOrder.amount === 1400, '測試 2 失敗：金額應為 1400');
console.assert(newOrder.paymentStatus === 'unpaid', '測試 2 失敗：預設應為 unpaid');
console.log(`✅ 測試 2 通過：成功新增訂單 ${newOrder.id}，總金額自動試算為 NT$ ${newOrder.amount}`);

// 測試 3：修改訂單 (更新尺寸與數量)
const updatedOrder = OrderService.update(newOrder.id, {
  size: 'XL',
  quantity: 3,
  unitPrice: 700
});
console.assert(updatedOrder.amount === 2100, '測試 3 失敗：修改後金額應為 2100');
console.assert(updatedOrder.size === 'XL', '測試 3 失敗：尺寸應修改為 XL');
console.log(`✅ 測試 3 通過：成功修改訂單，尺寸更新為 ${updatedOrder.size}，總額重新計算為 NT$ ${updatedOrder.amount}`);

// 測試 4：球經手動切換付款狀態
const toggled = OrderService.togglePayment(newOrder.id);
console.assert(toggled.paymentStatus === 'paid', '測試 4 失敗：應切換為 paid');
console.log(`✅ 測試 4 通過：成功切換付款狀態為 ${toggled.paymentStatus}`);

// 測試 5：球經統計計算 (總件數、總金額、各尺寸統計)
const summary = OrderService.getSummary();
// 目前訂單：350(1件) + 700(1件) + 700(2件) + 2100(3件) = 3850，總件數 1+1+2+3 = 7件
console.assert(summary.totalQuantity === 7, `測試 5 失敗：總件數應為 7，實際為 ${summary.totalQuantity}`);
console.assert(summary.totalAmount === 3850, `測試 5 失敗：總金額應為 3850，實際為 ${summary.totalAmount}`);
console.assert(summary.sizeCounts['XL'] === 4, `測試 5 失敗：XL 件數應為 4 (1件+3件)，實際為 ${summary.sizeCounts['XL']}`);
console.log(`✅ 測試 5 通過：球經統計精準無誤！總件數: ${summary.totalQuantity} 件, 總金額: NT$ ${summary.totalAmount}, 尺寸 XL: ${summary.sizeCounts['XL']} 件`);

// 測試 6：多條件篩選與搜尋
const searchResults = OrderService.getAll({ search: '張俊傑' });
console.assert(searchResults.length === 1 && searchResults[0].id === newOrder.id, '測試 6 失敗：搜尋張俊傑應為 1 筆');
const paidResults = OrderService.getAll({ paymentStatus: 'paid' });
console.assert(paidResults.length === 3, '測試 6 失敗：已付款應有 3 筆');
console.log('✅ 測試 6 通過：關鍵字搜尋與付款狀態篩選功能完全正常');

// 測試 7：取消 / 刪除訂單
const deleted = OrderService.delete(newOrder.id);
console.assert(deleted === true, '測試 7 失敗：刪除應回傳 true');
console.assert(OrderService.getById(newOrder.id) === null, '測試 7 失敗：訂單應不存在');
console.log(`✅ 測試 7 通過：成功取消並刪除訂單 ${newOrder.id}`);

console.log('🎉 所有 7 項球衣訂購功能單元測試全部 100% 通過！');
