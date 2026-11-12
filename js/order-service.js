/**
 * TeamHub 球隊雲端整合管理平台 - 球衣訂購服務層 (order-service.js)
 * 職責：
 * 1. 統一管理球衣訂單的 localStorage 本地資料庫持久化儲存
 * 2. 提供標準 CRUD 操作 (新增、讀取、修改、取消訂單、切換付款)
 * 3. 提供球經統計彙整計算 (總件數、總金額、各尺寸統計、已付款/未付款金額)
 * 4. 搜尋與多條件篩選
 * 5. 匯出相容 Excel 的 CSV 檔案
 */

const STORAGE_KEY = 'teamhub_orders_v1';

const OrderService = {
  /**
   * 初始化訂單資料庫：若 localStorage 無資料，載入 mockData 預設假資料
   */
  init() {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (!existing) {
      // 首次載入：寫入初始假資料
      const initialOrders = mockData && mockData.orders ? mockData.orders : [];
      this.save(initialOrders);
    }
  },

  /**
   * 取得所有訂單陣列
   */
  getRawOrders() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('讀取 localStorage 失敗，重置為預設資料', e);
      return [];
    }
  },

  /**
   * 儲存訂單陣列至 localStorage
   */
  save(orders) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  },

  /**
   * 取得訂單 (支援關鍵字搜尋與狀態篩選)
   * @param {Object} filters { search: '', paymentStatus: 'all', productType: 'all' }
   */
  getAll(filters = {}) {
    let orders = this.getRawOrders();

    // 關鍵字搜尋 (隊員姓名、訂單編號、客製燙印)
    if (filters.search && filters.search.trim()) {
      const keyword = filters.search.trim().toLowerCase();
      orders = orders.filter(o => 
        (o.memberName && o.memberName.toLowerCase().includes(keyword)) ||
        (o.id && o.id.toLowerCase().includes(keyword)) ||
        (o.customName && o.customName.toLowerCase().includes(keyword)) ||
        (String(o.customNumber).includes(keyword))
      );
    }

    // 付款狀態篩選 (paid / unpaid)
    if (filters.paymentStatus && filters.paymentStatus !== 'all') {
      orders = orders.filter(o => o.paymentStatus === filters.paymentStatus);
    }

    // 商品分類篩選 (practice / competition)
    if (filters.productType && filters.productType !== 'all') {
      orders = orders.filter(o => {
        if (filters.productType === 'practice') return o.product.includes('練習服');
        if (filters.productType === 'competition') return o.product.includes('比賽');
        return true;
      });
    }

    return orders;
  },

  /**
   * 根據 ID 取得單筆訂單
   */
  getById(id) {
    const orders = this.getRawOrders();
    return orders.find(o => o.id === id) || null;
  },

  /**
   * 新增訂單
   */
  create(orderData) {
    const orders = this.getRawOrders();
    const count = orders.length + 1;
    const newId = `ORD-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count).padStart(3, '0')}`;

    const newOrder = {
      id: newId,
      memberName: orderData.memberName,
      product: orderData.product,
      size: orderData.size,
      customNumber: orderData.customNumber !== undefined && orderData.customNumber !== '' ? orderData.customNumber : '-',
      customName: orderData.customName ? orderData.customName.trim().toUpperCase() : '-',
      unitPrice: Number(orderData.unitPrice),
      quantity: Number(orderData.quantity),
      amount: Number(orderData.unitPrice) * Number(orderData.quantity),
      paymentStatus: 'unpaid', // 預設未付款
      orderDate: new Date().toISOString().split('T')[0],
      isLocked: false // 尚未截止
    };

    orders.unshift(newOrder);
    this.save(orders);
    return newOrder;
  },

  /**
   * 修改既有訂單 (截止前允許修改)
   */
  update(id, updateData) {
    const orders = this.getRawOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) return null;

    const current = orders[index];
    const unitPrice = updateData.unitPrice !== undefined ? Number(updateData.unitPrice) : current.unitPrice;
    const quantity = updateData.quantity !== undefined ? Number(updateData.quantity) : current.quantity;

    orders[index] = {
      ...current,
      ...updateData,
      unitPrice,
      quantity,
      amount: unitPrice * quantity,
      customName: updateData.customName ? updateData.customName.trim().toUpperCase() : current.customName,
      updatedAt: new Date().toISOString()
    };

    this.save(orders);
    return orders[index];
  },

  /**
   * 取消 / 刪除訂單
   */
  delete(id) {
    let orders = this.getRawOrders();
    const beforeCount = orders.length;
    orders = orders.filter(o => o.id !== id);
    if (orders.length !== beforeCount) {
      this.save(orders);
      return true;
    }
    return false;
  },

  /**
   * 切換付款狀態
   */
  togglePayment(id) {
    const orders = this.getRawOrders();
    const target = orders.find(o => o.id === id);
    if (target) {
      target.paymentStatus = target.paymentStatus === 'paid' ? 'unpaid' : 'paid';
      this.save(orders);
      return target;
    }
    return null;
  },

  /**
   * 取得球經管理統計摘要 (總件數、總金額、各尺寸統計、收費進度)
   */
  getSummary() {
    const orders = this.getRawOrders();

    let totalQuantity = 0;
    let totalAmount = 0;
    let paidAmount = 0;
    let unpaidAmount = 0;
    let paidOrdersCount = 0;
    let unpaidOrdersCount = 0;

    // 各尺寸計數器
    const sizeCounts = {
      'XS': 0,
      'S': 0,
      'M': 0,
      'L': 0,
      'XL': 0,
      '2XL': 0
    };

    orders.forEach(o => {
      const qty = Number(o.quantity) || 1;
      const amt = Number(o.amount) || 0;

      totalQuantity += qty;
      totalAmount += amt;

      if (o.paymentStatus === 'paid') {
        paidAmount += amt;
        paidOrdersCount += 1;
      } else {
        unpaidAmount += amt;
        unpaidOrdersCount += 1;
      }

      if (sizeCounts[o.size] !== undefined) {
        sizeCounts[o.size] += qty;
      } else {
        sizeCounts[o.size] = qty;
      }
    });

    return {
      totalOrders: orders.length,
      totalQuantity,
      totalAmount,
      paidAmount,
      unpaidAmount,
      paidOrdersCount,
      unpaidOrdersCount,
      sizeCounts
    };
  },

  /**
   * 匯出相容 Excel 的 CSV (含 UTF-8 BOM)
   */
  exportCSV(filters = {}) {
    const orders = this.getAll(filters);
    let csv = "\uFEFF"; // UTF-8 BOM 避免 Excel 亂碼
    csv += "訂單編號,訂購人,球衣品項,尺寸,背號,客製燙印姓名,數量,單價,總金額,付款狀態,下單日期\n";

    orders.forEach(o => {
      const row = [
        o.id,
        `"${o.memberName}"`,
        `"${o.product}"`,
        o.size,
        o.customNumber,
        `"${o.customName || '-'}"`,
        o.quantity,
        o.unitPrice,
        o.amount,
        o.paymentStatus === 'paid' ? '已付款' : '未付款',
        o.orderDate || ''
      ];
      csv += row.join(",") + "\n";
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `TeamHub_球衣廠商訂購名單_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// 立即初始化
OrderService.init();

// 相容 Node.js 測試環境
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OrderService;
}
