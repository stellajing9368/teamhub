/**
 * TeamHub 球隊雲端整合管理平台 - 核心互動邏輯 (app.js)
 * 包含：
 * 1. 導覽與 SPA 視圖切換、手機版漢堡選單
 * 2. 球衣訂購管理 (OrderService)：隊員訂購、球經管理、即時算錢、修改取消、各尺寸速查、CSV 匯出
 * 3. 練習出缺席管理 (AttendanceService)：排程、隊員請假晚到、現場點名、全隊出席率公式計算、CSV 匯出
 * 4. 比賽報名與檢錄管理 (CompetitionService)：自動拉出檢錄大表、自動匯入學號/身分證/生活照/在學證明、一鍵報名與 CSV 匯出
 * 5. 隊員名冊管理：隊費 300 元審核 (正式入隊)、證件與生活照上傳即時預覽 (FileReader)
 * 6. 首頁總覽儀表板 (Dashboard) 即時動態連動
 */

// 目前正在管理證件的隊員 ID
let currentSelectedMemberId = 1;

// 目前點名中的練習 ID
let currentCheckinPracticeId = null;

// 目前正在檢視檢錄大表的比賽 ID
let currentCompetitionId = "COMP-2026-001";

// 目前球衣訂單篩選條件
let currentOrderFilters = {
  search: '',
  paymentStatus: 'all',
  productType: 'all'
};

document.addEventListener('DOMContentLoaded', () => {
  // 1. 初始化導覽切換與手機漢堡選單
  initNavigation();
  initMobileMenu();

  // 2. 初始化球衣訂購模組 (OrderService)
  initOrderModule();

  // 3. 初始化練習出缺席模組 (AttendanceService)
  initAttendanceModule();

  // 4. 初始化比賽報名檢錄模組 (CompetitionService)
  initCompetitionsModule();

  // 5. 渲染總覽與隊員名冊
  renderDashboard();
  renderMembers();
});

/* ==========================================================================
   1. 導覽切換與響應式選單
   ========================================================================== */

function initNavigation() {
  const menuLinks = document.querySelectorAll('.menu-link');
  const pageTitle = document.getElementById('current-page-title');

  menuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetViewId = link.getAttribute('data-view');
      const targetTitle = link.getAttribute('data-title');

      menuLinks.forEach(item => item.classList.remove('active'));
      link.classList.add('active');

      document.querySelectorAll('.view-section').forEach(view => {
        view.classList.remove('active');
      });

      const activeView = document.getElementById(targetViewId);
      if (activeView) {
        activeView.classList.add('active');
      }

      if (pageTitle && targetTitle) {
        pageTitle.textContent = targetTitle;
      }

      // 切換模組時重新刷新資料
      if (targetViewId === 'view-orders') {
        renderOrderModule();
      } else if (targetViewId === 'view-attendance') {
        renderAttendanceModule();
      } else if (targetViewId === 'view-competitions') {
        renderCompetitions();
      }

      closeMobileSidebar();
    });
  });
}

function initMobileMenu() {
  const mobileBtn = document.getElementById('mobile-menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');

  if (mobileBtn && sidebar && backdrop) {
    mobileBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      backdrop.classList.toggle('active');
    });

    backdrop.addEventListener('click', () => {
      closeMobileSidebar();
    });
  }
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (sidebar && backdrop) {
    sidebar.classList.remove('open');
    backdrop.classList.remove('active');
  }
}

/* ==========================================================================
   2. 球衣訂購管理模組 (OrderService 連動)
   ========================================================================== */

function initOrderModule() {
  const memberSelect = document.getElementById('order-member-name');
  const productSelect = document.getElementById('order-product-select');

  if (memberSelect) {
    memberSelect.innerHTML = mockData.members.map(m => `
      <option value="${m.name}" ${m.id === 1 ? 'selected' : ''}>
        #${m.jerseyNumber} ${m.name} (${m.role} - ${m.position})
      </option>
    `).join('');
  }

  if (productSelect) {
    productSelect.innerHTML = mockData.products.map(p => `
      <option value="${p.id}" data-price="${p.price}" data-name="${p.name}">
        ${p.name} - NT$ ${p.price}
      </option>
    `).join('');
  }

  calculateOrderTotal();
  renderOrderModule();
}

function renderOrderModule() {
  renderOrderSummaryAndSizes();
  renderOrdersTable();
}

function calculateOrderTotal() {
  const productSelect = document.getElementById('order-product-select');
  const quantityInput = document.getElementById('order-quantity');
  const totalDisplay = document.getElementById('order-total-amount');
  const detailDisplay = document.getElementById('price-calculation-detail');

  if (!productSelect || !quantityInput) return;

  const selectedOption = productSelect.options[productSelect.selectedIndex];
  if (!selectedOption) return;

  const unitPrice = parseInt(selectedOption.getAttribute('data-price'), 10) || 0;
  const quantity = Math.max(1, parseInt(quantityInput.value, 10) || 1);
  const total = unitPrice * quantity;

  if (totalDisplay) totalDisplay.textContent = `NT$ ${total.toLocaleString()}`;
  if (detailDisplay) detailDisplay.textContent = `單價 NT$ ${unitPrice.toLocaleString()} × ${quantity} 件 = 總計 NT$ ${total.toLocaleString()}`;
}

function handleOrderFormSubmit(event) {
  event.preventDefault();

  const editId = document.getElementById('edit-order-id').value;
  const memberSelect = document.getElementById('order-member-name');
  const productSelect = document.getElementById('order-product-select');
  const sizeSelect = document.getElementById('order-size-select');
  const quantityInput = document.getElementById('order-quantity');
  const customNumberInput = document.getElementById('order-custom-number');
  const customNameInput = document.getElementById('order-custom-name');

  const selectedOption = productSelect.options[productSelect.selectedIndex];
  const unitPrice = parseInt(selectedOption.getAttribute('data-price'), 10);
  const productName = selectedOption.getAttribute('data-name');
  const quantity = parseInt(quantityInput.value, 10);

  const payload = {
    memberName: memberSelect.value,
    product: productName,
    size: sizeSelect.value,
    customNumber: customNumberInput.value !== '' ? parseInt(customNumberInput.value, 10) : '-',
    customName: customNameInput.value.trim() ? customNameInput.value.trim().toUpperCase() : '-',
    unitPrice: unitPrice,
    quantity: quantity
  };

  if (editId) {
    const updated = OrderService.update(editId, payload);
    if (updated) {
      showToast(`✏️ 訂單 ${editId} 修改成功！總額已重新計算為 NT$ ${updated.amount.toLocaleString()}。`);
      cancelEditOrder();
    }
  } else {
    const created = OrderService.create(payload);
    showToast(`🎉 成功建立球衣訂單 ${created.id}！總額 NT$ ${created.amount.toLocaleString()}，待球經核對。`);

    customNumberInput.value = '';
    customNameInput.value = '';
    quantityInput.value = '1';
    calculateOrderTotal();
  }

  renderOrderModule();
  renderDashboard();
}

function startEditOrder(orderId) {
  const order = OrderService.getById(orderId);
  if (!order) return;

  document.getElementById('edit-order-id').value = order.id;

  const memberSelect = document.getElementById('order-member-name');
  if (memberSelect) {
    for (let i = 0; i < memberSelect.options.length; i++) {
      if (memberSelect.options[i].value === order.memberName) {
        memberSelect.selectedIndex = i;
        break;
      }
    }
  }

  const productSelect = document.getElementById('order-product-select');
  if (productSelect) {
    for (let i = 0; i < productSelect.options.length; i++) {
      if (productSelect.options[i].getAttribute('data-name') === order.product) {
        productSelect.selectedIndex = i;
        break;
      }
    }
  }

  const sizeSelect = document.getElementById('order-size-select');
  if (sizeSelect) sizeSelect.value = order.size;

  document.getElementById('order-quantity').value = order.quantity;
  document.getElementById('order-custom-number').value = order.customNumber !== '-' ? order.customNumber : '';
  document.getElementById('order-custom-name').value = order.customName !== '-' ? order.customName : '';

  calculateOrderTotal();

  document.getElementById('order-form-title').textContent = `✏️ 修改訂單 (${order.id})`;
  document.getElementById('order-form-mode-badge').textContent = '修改中';
  document.getElementById('order-form-mode-badge').className = 'badge badge-warning';
  document.getElementById('submit-order-btn').textContent = '💾 儲存修改內容';
  document.getElementById('cancel-edit-btn').style.display = 'inline-flex';

  document.getElementById('order-form-card').scrollIntoView({ behavior: 'smooth' });
}

function cancelEditOrder() {
  document.getElementById('edit-order-id').value = '';
  document.getElementById('order-form-title').textContent = '🛒 隊員線上訂購球衣';
  document.getElementById('order-form-mode-badge').textContent = '新增模式';
  document.getElementById('order-form-mode-badge').className = 'badge badge-success';
  document.getElementById('submit-order-btn').textContent = '確認送出訂單';
  document.getElementById('cancel-edit-btn').style.display = 'none';

  document.getElementById('order-custom-number').value = '';
  document.getElementById('order-custom-name').value = '';
  document.getElementById('order-quantity').value = '1';
  calculateOrderTotal();
}

function deleteOrder(orderId) {
  if (confirm(`⚠️ 確定要取消訂單 ${orderId} 嗎？\n取消後該筆訂單將自訂單清冊中永久移除。`)) {
    const success = OrderService.delete(orderId);
    if (success) {
      showToast(`🗑️ 訂單 ${orderId} 已成功取消並移除。`);
      renderOrderModule();
      renderDashboard();
    }
  }
}

function toggleOrderStatusPayment(orderId) {
  const updated = OrderService.togglePayment(orderId);
  if (updated) {
    const statusText = updated.paymentStatus === 'paid' ? '✅ 已付款' : '⏳ 未付款';
    showToast(`訂單 ${orderId} 付款狀態已切換為：${statusText}`);
    renderOrderModule();
    renderDashboard();
  }
}

function renderOrderSummaryAndSizes() {
  const summary = OrderService.getSummary();

  const statQty = document.getElementById('order-stat-total-qty');
  const statTotal = document.getElementById('order-stat-total-amt');
  const statPaid = document.getElementById('order-stat-paid-amt');
  const statUnpaid = document.getElementById('order-stat-unpaid-amt');

  if (statQty) statQty.textContent = `${summary.totalQuantity} 件`;
  if (statTotal) statTotal.textContent = `NT$ ${summary.totalAmount.toLocaleString()}`;
  if (statPaid) statPaid.textContent = `NT$ ${summary.paidAmount.toLocaleString()} (${summary.paidOrdersCount}筆)`;
  if (statUnpaid) statUnpaid.textContent = `NT$ ${summary.unpaidAmount.toLocaleString()} (${summary.unpaidOrdersCount}筆)`;

  const sizeGrid = document.getElementById('size-breakdown-grid');
  if (sizeGrid) {
    const sizes = ['XS', 'S', 'M', 'L', 'XL', '2XL'];
    sizeGrid.innerHTML = sizes.map(sz => `
      <div class="size-pill">
        <div class="size-pill-label">尺寸 ${sz}</div>
        <div class="size-pill-count">${summary.sizeCounts[sz] || 0} <span style="font-size:0.75rem; font-weight:normal;">件</span></div>
      </div>
    `).join('');
  }
}

function applyOrderFilters() {
  const searchInput = document.getElementById('filter-search-input');
  const paymentSelect = document.getElementById('filter-payment-status');
  const productSelect = document.getElementById('filter-product-type');

  currentOrderFilters.search = searchInput ? searchInput.value : '';
  currentOrderFilters.paymentStatus = paymentSelect ? paymentSelect.value : 'all';
  currentOrderFilters.productType = productSelect ? productSelect.value : 'all';

  renderOrdersTable();
}

function renderOrdersTable() {
  const tableBody = document.getElementById('orders-table-body');
  const countBadge = document.getElementById('filtered-count-badge');
  const emptyState = document.getElementById('orders-empty-state');
  if (!tableBody) return;

  const orders = OrderService.getAll(currentOrderFilters);
  const totalCount = OrderService.getRawOrders().length;

  if (countBadge) countBadge.textContent = `顯示 ${orders.length} / ${totalCount} 筆訂單`;

  if (orders.length === 0) {
    tableBody.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  tableBody.innerHTML = orders.map(o => `
    <tr>
      <td>
        <code style="font-size: 0.8rem; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: 700;">
          ${o.id}
        </code>
      </td>
      <td style="font-weight: 600; color: var(--primary-navy);">${o.memberName}</td>
      <td>
        <div style="font-weight: 600;">${o.product}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">下單日: ${o.orderDate}</div>
      </td>
      <td><span class="badge" style="background:#e0f2fe; color:#0369a1; font-size:0.85rem;">${o.size}</span></td>
      <td>
        <span style="font-size: 0.85rem;">
          #${o.customNumber} ${o.customName !== '-' ? `(${o.customName})` : ''}
        </span>
      </td>
      <td><strong>${o.quantity}</strong></td>
      <td style="color: var(--text-muted); font-size: 0.85rem;">NT$ ${o.unitPrice}</td>
      <td style="font-weight: 700; color: #15803d;">NT$ ${o.amount.toLocaleString()}</td>
      <td>
        <span class="badge ${o.paymentStatus === 'paid' ? 'badge-paid' : 'badge-unpaid'}">
          ${o.paymentStatus === 'paid' ? '已付款' : '未付款'}
        </span>
      </td>
      <td>
        <div style="display: flex; gap: 0.35rem; align-items: center; flex-wrap: wrap;">
          <button class="btn btn-outline btn-sm" title="切換付款狀態" onclick="toggleOrderStatusPayment('${o.id}')">
            ${o.paymentStatus === 'paid' ? '標記未付' : '標記已付'}
          </button>
          <button class="btn btn-outline btn-sm" title="修改訂單規格" onclick="startEditOrder('${o.id}')">
            ✏️ 修改
          </button>
          <button class="btn btn-danger-outline btn-sm" title="截止前取消訂單" onclick="deleteOrder('${o.id}')">
            🗑️ 取消
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function handleExportCSV() {
  OrderService.exportCSV(currentOrderFilters);
  showToast('📥 球衣訂購清單 (CSV) 匯出中，支援 Excel 正常開啟不亂碼！');
}

/* ==========================================================================
   3. 練習出缺席管理模組 (AttendanceService 連動)
   ========================================================================== */

function initAttendanceModule() {
  const memberSelect = document.getElementById('leave-member-select');
  if (memberSelect) {
    memberSelect.innerHTML = mockData.members.map(m => `
      <option value="${m.name}" ${m.id === 3 ? 'selected' : ''}>
        #${m.jerseyNumber} ${m.name} (${m.role})
      </option>
    `).join('');
  }

  const dateInput = document.getElementById('practice-date-input');
  if (dateInput && !dateInput.value) {
    const today = new Date();
    const day = today.getDay();
    const diff = (8 - day) % 7 || 7;
    const nextMonday = new Date(today.getTime() + diff * 24 * 60 * 60 * 1000);
    dateInput.value = nextMonday.toISOString().split('T')[0];
    handleDateChange();
  }

  renderAttendanceModule();
}

function renderAttendanceModule() {
  renderPracticesList();
  updateLeavePracticeDropdown();
  renderLeavesTable();
  renderAttendanceStatsTable();
}

function handleDateChange() {
  const dateInput = document.getElementById('practice-date-input');
  const tip = document.getElementById('practice-weekday-tip');
  if (!dateInput || !tip) return;

  const weekday = AttendanceService.getWeekdayName(dateInput.value);
  if (weekday === '星期一' || weekday === '星期二') {
    tip.innerHTML = `✅ ${weekday} (符合球隊固定練習日)`;
    tip.style.color = '#15803d';
  } else if (weekday) {
    tip.innerHTML = `⚠️ ${weekday} (非固定練習日，加練請提早通知)`;
    tip.style.color = '#b45309';
  } else {
    tip.innerHTML = '';
  }
}

function handlePracticeFormSubmit(event) {
  event.preventDefault();

  const editId = document.getElementById('edit-practice-id').value;
  const dateInput = document.getElementById('practice-date-input');
  const timeInput = document.getElementById('practice-time-input');
  const courtSelect = document.getElementById('practice-court-select');
  const noteInput = document.getElementById('practice-note-input');

  const payload = {
    date: dateInput.value,
    time: timeInput.value,
    court: courtSelect.value,
    note: noteInput.value.trim()
  };

  if (editId) {
    const updated = AttendanceService.updatePractice(editId, payload);
    if (updated) {
      showToast(`✏️ 練習場次 ${editId} 已成功更新！`);
      cancelEditPractice();
    }
  } else {
    const created = AttendanceService.createPractice(payload);
    showToast(`🏐 成功發布練習日程：${created.date} (${created.weekday}) ${created.court}！`);
    noteInput.value = '';
  }

  renderAttendanceModule();
  renderDashboard();
}

function startEditPractice(practiceId) {
  const practices = AttendanceService.getPractices();
  const p = practices.find(item => item.id === practiceId);
  if (!p) return;

  document.getElementById('edit-practice-id').value = p.id;
  document.getElementById('practice-date-input').value = p.date;
  document.getElementById('practice-time-input').value = p.time;
  document.getElementById('practice-court-select').value = p.court;
  document.getElementById('practice-note-input').value = p.note || '';
  handleDateChange();

  document.getElementById('practice-form-title').textContent = `✏️ 修改練習日程 (${p.date})`;
  document.getElementById('practice-form-badge').textContent = '修改中';
  document.getElementById('practice-form-badge').className = 'badge badge-warning';
  document.getElementById('submit-practice-btn').textContent = '💾 儲存修改';
  document.getElementById('cancel-edit-practice-btn').style.display = 'inline-flex';

  document.getElementById('practice-form-card').scrollIntoView({ behavior: 'smooth' });
}

function cancelEditPractice() {
  document.getElementById('edit-practice-id').value = '';
  document.getElementById('practice-form-title').textContent = '🏐 新增排球隊練習日程';
  document.getElementById('practice-form-badge').textContent = '建立模式';
  document.getElementById('practice-form-badge').className = 'badge badge-success';
  document.getElementById('submit-practice-btn').textContent = '發布練習日程';
  document.getElementById('cancel-edit-practice-btn').style.display = 'none';
  document.getElementById('practice-note-input').value = '';
}

function toggleCancelPractice(practiceId) {
  const practices = AttendanceService.getPractices();
  const p = practices.find(item => item.id === practiceId);
  if (!p) return;

  const isCancelling = p.status !== 'cancelled';
  const msg = isCancelling
    ? `⚠️ 確定要取消 ${p.date} (${p.weekday}) 的練習嗎？\n取消後該場次將不計入全隊出席率分母。`
    : `確定要恢復 ${p.date} (${p.weekday}) 的練習排程嗎？`;

  if (confirm(msg)) {
    const updated = AttendanceService.cancelPractice(practiceId);
    if (updated) {
      showToast(updated.status === 'cancelled' ? `🚫 練習已標記取消 (不計入出席分母)` : `✅ 練習已恢復排定狀態！`);
      renderAttendanceModule();
      renderDashboard();
    }
  }
}

function renderPracticesList() {
  const container = document.getElementById('practices-list-container');
  if (!container) return;

  const practices = AttendanceService.getPractices();

  if (practices.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 2rem; color:var(--text-muted);">尚未排定任何練習場次</div>`;
    return;
  }

  container.innerHTML = practices.map(p => {
    let statusBadge = '<span class="badge badge-success practice-card-badge">排定中</span>';
    if (p.status === 'cancelled') {
      statusBadge = '<span class="badge badge-danger practice-card-badge">已取消</span>';
    } else if (p.status === 'completed') {
      statusBadge = '<span class="badge badge-paid practice-card-badge">已完成點名</span>';
    }

    const isCancelled = p.status === 'cancelled';

    return `
      <div class="practice-card ${isCancelled ? 'cancelled' : ''}">
        <div>
          <div class="practice-card-header">
            <span class="practice-card-date">${p.date} (${p.weekday})</span>
            ${statusBadge}
          </div>
          <div class="practice-card-details">
            <div>📍 <strong>場地</strong>：${p.court}</div>
            <div>⏰ <strong>時間</strong>：${p.time}</div>
            <div>📝 <strong>重點</strong>：${p.note || '常規戰術配合'}</div>
          </div>
        </div>

        <div class="practice-card-actions">
          ${!isCancelled ? `
            <button class="btn btn-primary btn-sm" onclick="openCheckinPanel('${p.id}')">
              📋 展開點名
            </button>
            <button class="btn btn-outline btn-sm" onclick="startEditPractice('${p.id}')">
              ✏️ 編輯
            </button>
          ` : `
            <span style="font-size:0.8rem; color:var(--text-muted);">練習已停辦</span>
          `}
          <button class="btn ${isCancelled ? 'btn-outline' : 'btn-danger-outline'} btn-sm" style="margin-left: auto;" onclick="toggleCancelPractice('${p.id}')">
            ${isCancelled ? '恢復練習' : '取消場次'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function updateLeavePracticeDropdown() {
  const select = document.getElementById('leave-practice-select');
  if (!select) return;

  const practices = AttendanceService.getPractices().filter(p => p.status !== 'cancelled');

  select.innerHTML = practices.map(p => `
    <option value="${p.id}">
      ${p.date} (${p.weekday}) ${p.court} ${p.time}
    </option>
  `).join('');
}

function handleLeaveFormSubmit(event) {
  event.preventDefault();

  const practiceSelect = document.getElementById('leave-practice-select');
  const memberSelect = document.getElementById('leave-member-select');
  const typeSelect = document.getElementById('leave-type-select');
  const reasonInput = document.getElementById('leave-reason-input');

  if (!practiceSelect.value) {
    alert('目前沒有可供請假的排定練習場次！');
    return;
  }

  const newLeave = AttendanceService.submitLeave({
    practiceId: practiceSelect.value,
    memberName: memberSelect.value,
    type: typeSelect.value,
    reason: reasonInput.value
  });

  showToast(`✅ ${newLeave.memberName} 的${newLeave.type === 'late' ? '晚到' : '請假'}申請已成功記錄！已存入請假清冊。`);
  reasonInput.value = '';

  renderLeavesTable();
  if (currentCheckinPracticeId === newLeave.practiceId) {
    renderCheckinTable(currentCheckinPracticeId);
  }
}

function renderLeavesTable() {
  const tableBody = document.getElementById('leaves-table-body');
  if (!tableBody) return;

  const leaves = AttendanceService.getLeaves();

  if (leaves.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:1.5rem;">目前尚無任何請假或晚到通報紀錄</td></tr>`;
    return;
  }

  tableBody.innerHTML = leaves.map(l => {
    const isLate = l.type === 'late';
    const typeBadge = isLate
      ? `<span class="badge badge-late">⏰ 晚到通報</span>`
      : `<span class="badge badge-leave">❌ 請假</span>`;

    return `
      <tr>
        <td><code style="font-size:0.8rem; background:#f1f5f9; padding:2px 6px; border-radius:4px;">${l.id}</code></td>
        <td style="font-weight:600; color:var(--primary-navy);">${l.memberName}</td>
        <td style="font-size:0.85rem;">${l.practiceInfo}</td>
        <td>${typeBadge}</td>
        <td style="color:#0f172a; font-size:0.85rem;">${l.reason}</td>
        <td style="font-size:0.75rem; color:var(--text-muted);">${l.submittedAt}</td>
      </tr>
    `;
  }).join('');
}

function openCheckinPanel(practiceId) {
  currentCheckinPracticeId = practiceId;
  const panel = document.getElementById('checkin-panel-card');
  const title = document.getElementById('checkin-panel-title');
  const subtitle = document.getElementById('checkin-panel-subtitle');

  const practices = AttendanceService.getPractices();
  const practice = practices.find(p => p.id === practiceId);
  if (!practice) return;

  if (title) title.textContent = `📋 練習現場出席登記 - ${practice.date} (${practice.weekday}) ${practice.court}`;
  if (subtitle) subtitle.textContent = `時間：${practice.time} ｜ 訓練重點：${practice.note || '常規配合'}`;

  renderCheckinTable(practiceId);

  if (panel) {
    panel.style.display = 'block';
    panel.scrollIntoView({ behavior: 'smooth' });
  }
}

function closeCheckinPanel() {
  const panel = document.getElementById('checkin-panel-card');
  if (panel) panel.style.display = 'none';
  currentCheckinPracticeId = null;
}

function renderCheckinTable(practiceId) {
  const tableBody = document.getElementById('checkin-table-body');
  if (!tableBody) return;

  const checklist = AttendanceService.getPracticeChecklist(practiceId, mockData.members);

  tableBody.innerHTML = checklist.map(item => {
    let leaveTip = `<span style="color:#94a3b8; font-size:0.8rem;">無請假紀錄</span>`;
    if (item.leaveApp) {
      if (item.leaveApp.type === 'late') {
        leaveTip = `<span style="color:#0369a1; font-size:0.8rem; font-weight:600;">⏰ 晚到申請：${item.leaveApp.reason}</span>`;
      } else {
        leaveTip = `<span style="color:#e11d48; font-size:0.8rem; font-weight:600;">⚠️ 已提請假：${item.leaveApp.reason}</span>`;
      }
    }

    let statusBadge = '<span class="badge badge-unconfirmed">⏳ 尚未確認</span>';
    if (item.status === 'present') statusBadge = '<span class="badge badge-present">✅ 出席</span>';
    else if (item.status === 'absent') statusBadge = '<span class="badge badge-danger">❌ 缺席</span>';
    else if (item.status === 'leave') statusBadge = '<span class="badge badge-leave">📝 請假</span>';

    return `
      <tr>
        <td><strong>#${item.jerseyNumber}</strong></td>
        <td>
          <div style="font-weight:600; color:var(--primary-navy);">${item.memberName}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${item.role}</div>
        </td>
        <td>${item.position}</td>
        <td>${leaveTip}</td>
        <td>${statusBadge}</td>
        <td>
          <div class="checkin-btn-group">
            <button class="btn-status-toggle ${item.status === 'present' ? 'active-present' : ''}" 
              onclick="updateMemberAttendance('${practiceId}', '${item.memberName}', 'present')">
              出席
            </button>
            <button class="btn-status-toggle ${item.status === 'absent' ? 'active-absent' : ''}" 
              onclick="updateMemberAttendance('${practiceId}', '${item.memberName}', 'absent')">
              缺席
            </button>
            <button class="btn-status-toggle ${item.status === 'leave' ? 'active-leave' : ''}" 
              onclick="updateMemberAttendance('${practiceId}', '${item.memberName}', 'leave')">
              請假
            </button>
            <button class="btn-status-toggle ${item.status === 'unconfirmed' ? 'active-unconfirmed' : ''}" 
              onclick="updateMemberAttendance('${practiceId}', '${item.memberName}', 'unconfirmed')">
              未確認
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function updateMemberAttendance(practiceId, memberName, status) {
  AttendanceService.setMemberAttendanceStatus(practiceId, memberName, status);
  renderCheckinTable(practiceId);
  renderAttendanceStatsTable();
  renderPracticesList();
  renderDashboard();
}

function finishCheckin() {
  showToast('✅ 點名紀錄已完整儲存至本地資料庫！全隊出席率已重新計算。');
  closeCheckinPanel();
}

function renderAttendanceStatsTable() {
  const tableBody = document.getElementById('attendance-stats-table-body');
  if (!tableBody) return;

  const startDate = document.getElementById('stats-start-date') ? document.getElementById('stats-start-date').value : '';
  const endDate = document.getElementById('stats-end-date') ? document.getElementById('stats-end-date').value : '';

  const stats = AttendanceService.calculateTeamStats(mockData.members, { startDate, endDate });

  tableBody.innerHTML = stats.map(s => {
    let fillColor = '#10b981';
    if (s.attendanceRate < 70) fillColor = '#ef4444';
    else if (s.attendanceRate < 85) fillColor = '#f59e0b';

    return `
      <tr>
        <td><strong>#${s.jerseyNumber}</strong></td>
        <td style="font-weight:600; color:var(--primary-navy);">${s.name}</td>
        <td><span class="badge badge-late">${s.role}</span></td>
        <td>${s.position}</td>
        <td><strong>${s.totalCheckedPractices}</strong> 場</td>
        <td style="color:#15803d; font-weight:700;">${s.presentCount} 次</td>
        <td style="color:#b91c1c; font-weight:700;">${s.absentCount} 次</td>
        <td style="color:#b45309;">${s.leaveCount} 次</td>
        <td style="color:#0369a1;">${s.lateAppCount} 次</td>
        <td>
          <div style="display:flex; align-items:center;">
            <div class="rate-progress-bar">
              <div class="rate-progress-fill" style="width: ${s.attendanceRate}%; background: ${fillColor};"></div>
            </div>
            <strong style="color:var(--primary-navy); font-size:0.9rem;">${s.attendanceRate}%</strong>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function clearDateFilter() {
  if (document.getElementById('stats-start-date')) document.getElementById('stats-start-date').value = '';
  if (document.getElementById('stats-end-date')) document.getElementById('stats-end-date').value = '';
  renderAttendanceStatsTable();
  showToast('🔄 已清除日期篩選，顯示全學期出席累計。');
}

function handleExportAttendanceCSV() {
  const startDate = document.getElementById('stats-start-date') ? document.getElementById('stats-start-date').value : '';
  const endDate = document.getElementById('stats-end-date') ? document.getElementById('stats-end-date').value : '';
  AttendanceService.exportAttendanceCSV(mockData.members, { startDate, endDate });
  showToast('📥 全隊練習出缺席統計 (CSV) 匯出中，支援 Excel 正常開啟不亂碼！');
}

/* ==========================================================================
   4. 比賽報名與檢錄管理 (CompetitionService 連動) - 全新升級
   ========================================================================== */

function initCompetitionsModule() {
  renderCompetitions();
}

/**
 * 渲染賽事卡片列表
 */
function renderCompetitions() {
  const container = document.getElementById('competitions-list-container');
  if (!container) return;

  const competitions = CompetitionService.getCompetitions();

  container.innerHTML = competitions.map(c => {
    const stats = CompetitionService.getCompetitionStats(c.id);
    const progressPercent = Math.min(100, Math.round((stats.registeredCount / stats.maxMembers) * 100));

    return `
      <div class="card" style="margin-bottom: 1.25rem; border: 1px solid var(--border-light);">
        <div class="card-header" style="background:#f8fafc;">
          <div>
            <h4 style="font-size: 1.1rem; color: var(--primary-navy); font-weight:700;">${c.name}</h4>
            <span style="font-size: 0.8rem; color: var(--text-muted);">主辦單位：${c.organizer}</span>
          </div>
          <span class="badge ${c.status === '報名中' ? 'badge-success' : 'badge-warning'}">${c.status}</span>
        </div>
        <div class="card-body">
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem; margin-bottom: 1rem; font-size: 0.9rem;">
            <div>📅 <strong>競賽日程</strong>：${c.date}</div>
            <div>📍 <strong>比賽場地</strong>：${c.location}</div>
            <div>⏰ <strong>報名截止</strong>：<span style="color:#e11d48; font-weight:700;">${c.deadline}</span></div>
            <div>
              👥 <strong>報名進度</strong>：${stats.registeredCount} / ${stats.maxMembers} 人 (${progressPercent}%)
              <div style="height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden; margin-top: 4px;">
                <div style="width: ${progressPercent}%; height: 100%; background: var(--accent-green);"></div>
              </div>
            </div>
          </div>
          
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem; background:#f1f5f9; padding: 8px 12px; border-radius:6px;">
            📝 <strong>大會檢錄須知</strong>：${c.description}
          </p>

          <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
            <button class="btn btn-primary btn-sm" onclick="openCompetitionRoster('${c.id}')">
              📋 展開全隊正式報名檢錄表
            </button>
            <button class="btn btn-outline btn-sm" onclick="toggleMemberDirectRegistration('${c.id}', '陳冠廷')">
              ⚡ 隊長一鍵線上報名
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * 展開特定比賽的全隊報名檢錄大表
 */
function openCompetitionRoster(competitionId) {
  currentCompetitionId = competitionId;
  const panel = document.getElementById('competition-roster-panel');
  const title = document.getElementById('roster-panel-title');
  const subtitle = document.getElementById('roster-panel-subtitle');

  const competitions = CompetitionService.getCompetitions();
  const comp = competitions.find(c => c.id === competitionId);
  if (!comp) return;

  if (title) title.textContent = `📋 ${comp.name} - 正式檢錄大表`;
  if (subtitle) subtitle.textContent = `自動匯入全隊隊員之學號、身分證字號、出生年月日、生活照與在學證明 ｜ 日程：${comp.date}`;

  renderCompetitionRosterTable(competitionId);

  if (panel) {
    panel.style.display = 'block';
    panel.scrollIntoView({ behavior: 'smooth' });
  }
}

function closeRosterPanel() {
  const panel = document.getElementById('competition-roster-panel');
  if (panel) panel.style.display = 'none';
}

/**
 * 渲染全隊報名檢錄大表 (自動匯入學號、身分證、生活照、在學證明)
 */
function renderCompetitionRosterTable(competitionId) {
  const tableBody = document.getElementById('competition-roster-tbody');
  if (!tableBody) return;

  // 從 CompetitionService 讀取自動匯入之檢錄陣列
  const roster = CompetitionService.getRegistrationRoster(competitionId, mockData.members);

  tableBody.innerHTML = roster.map(r => {
    // 縮圖
    const avatarImg = r.avatar
      ? `<img src="${r.avatar}" class="table-member-avatar" alt="${r.name}">`
      : `<span class="table-avatar-placeholder">${r.name[0]}</span>`;

    // 身分證字號遮蔽中間碼 (例如 A129***543)，保護個資
    let maskedId = r.idNumber;
    if (r.idNumber && r.idNumber.length === 10) {
      maskedId = `${r.idNumber.slice(0, 4)}***${r.idNumber.slice(7)}`;
    }

    // 證件齊全度 Badge
    const docBadge = r.isProfileComplete
      ? `<span class="badge badge-paid" title="學號、身分證、生活照、學生證、在學證明皆齊全">✅ 5/5 齊全</span>`
      : `<span class="badge badge-warning" title="尚缺部分檢錄檔案">${r.readyCount}/5 待補件</span>`;

    // 報名狀態 Badge
    const regBadge = r.isRegistered
      ? `<span class="badge badge-present">✅ 已報名參賽</span>`
      : `<span class="badge" style="background:#f1f5f9; color:#64748b;">未報名</span>`;

    return `
      <tr>
        <td>${avatarImg}</td>
        <td><strong>#${r.jerseyNumber}</strong></td>
        <td>
          <div style="font-weight:600; color:var(--primary-navy);">${r.name}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${r.role}</div>
        </td>
        <td>${r.position}</td>
        <td><code style="font-size:0.85rem; background:#f1f5f9; padding:2px 6px; border-radius:4px; font-weight:700;">${r.studentId}</code></td>
        <td>
          <span style="font-family:monospace; font-weight:600;" title="完整身分證: ${r.idNumber}">${maskedId}</span>
        </td>
        <td style="font-size:0.85rem;">${r.birthDate}</td>
        <td style="font-size:0.85rem;">${r.phone}</td>
        <td>${docBadge}</td>
        <td>${regBadge}</td>
        <td>
          <button class="btn ${r.isRegistered ? 'btn-danger-outline' : 'btn-primary'} btn-sm" 
            onclick="toggleMemberDirectRegistration('${competitionId}', '${r.name}')">
            ${r.isRegistered ? '取消參賽' : '確認報名'}
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * 切換特定隊員的參賽報名狀態
 */
function toggleMemberDirectRegistration(competitionId, memberName) {
  const isRegistered = CompetitionService.toggleRegistration(competitionId, memberName);
  showToast(isRegistered ? `🎉 隊員 ${memberName} 已成功加入參賽名單！` : `隊員 ${memberName} 已取消參賽。`);

  renderCompetitions();
  if (currentCompetitionId === competitionId) {
    renderCompetitionRosterTable(competitionId);
  }
}

/**
 * 匯出大專聯賽正式報名清冊 CSV
 */
function handleExportRosterCSV() {
  CompetitionService.exportRosterCSV(currentCompetitionId, mockData.members);
  showToast('📥 大專盃正式檢錄報名清冊 (CSV) 匯出中，支援 Excel 正常開啟不亂碼！');
}

/* ==========================================================================
   5. 隊員名冊模組 (Members) - 隊費 300 元審核 & 證件生活照管理
   ========================================================================== */

function renderMembers() {
  const tableBody = document.getElementById('members-table-body');
  const paidRatioDisplay = document.getElementById('members-paid-ratio');
  if (!tableBody) return;

  const paidCount = mockData.members.filter(m => m.teamFeePaid).length;
  const totalCount = mockData.members.length;

  if (paidRatioDisplay) {
    paidRatioDisplay.textContent = `${paidCount} / ${totalCount} 人已繳費 (${Math.round((paidCount / totalCount) * 100)}%)`;
  }

  tableBody.innerHTML = mockData.members.map(m => {
    const avatarImg = m.avatar 
      ? `<img src="${m.avatar}" class="table-member-avatar" alt="${m.name}">`
      : `<span class="table-avatar-placeholder">${m.name[0]}</span>`;

    const feeBadge = m.teamFeePaid
      ? `<span class="badge badge-paid">✅ 已繳隊費 (正式入隊)</span>`
      : `<span class="badge badge-unpaid">⏳ 未繳費 (尚未入隊)</span>`;

    const docsCount = (m.avatar ? 1 : 0) + (m.studentCard ? 1 : 0) + (m.enrollmentCert ? 1 : 0);
    const docsBadge = docsCount === 3
      ? `<span style="font-size: 0.8rem; color: #166534; font-weight:600;">3/3 齊全</span>`
      : `<span style="font-size: 0.8rem; color: #b45309; font-weight:600;">${docsCount}/3 待補件</span>`;

    return `
      <tr>
        <td>${avatarImg}</td>
        <td><strong>#${m.jerseyNumber}</strong></td>
        <td>
          <div style="font-weight: 600; color: var(--primary-navy);">${m.name}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${m.email}</div>
        </td>
        <td><span class="badge badge-late">${m.role}</span></td>
        <td>${m.position}</td>
        <td>${feeBadge}</td>
        <td>
          <div>${docsBadge}</div>
          <button class="btn btn-outline btn-sm" style="margin-top: 4px;" onclick="openDocsModal(${m.id})">
            檢視/上傳證件
          </button>
        </td>
        <td>
          <button class="btn ${m.teamFeePaid ? 'btn-outline' : 'btn-primary'} btn-sm" onclick="toggleTeamFee(${m.id})">
            ${m.teamFeePaid ? '標記未繳' : '確認繳費'}
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function toggleTeamFee(memberId) {
  const member = mockData.members.find(m => m.id === memberId);
  if (member) {
    member.teamFeePaid = !member.teamFeePaid;
    renderMembers();
    renderDashboard();
    showToast(`隊員 ${member.name} 隊費狀態已更新為：${member.teamFeePaid ? '✅ 已繳清 NT$ 300 (正式入隊)' : '⏳ 未繳費 (尚未入隊)'}`);
  }
}

function openDocsModal(memberId) {
  currentSelectedMemberId = memberId;
  const member = mockData.members.find(m => m.id === memberId);
  if (!member) return;

  const modal = document.getElementById('docs-modal-overlay');
  const title = document.getElementById('modal-member-title');

  if (title) title.textContent = `身分證明與生活照 - #${member.jerseyNumber} ${member.name} (${member.role})`;

  renderDocPreview('avatar', member.avatar, '生活照');
  renderDocPreview('studentCard', member.studentCard, '學生證正面');
  renderDocPreview('enrollmentCert', member.enrollmentCert, '在學證明文件');

  if (modal) modal.classList.add('active');
}

function renderDocPreview(docKey, imgUrl, docName) {
  const box = document.getElementById(`preview-box-${docKey}`);
  if (!box) return;

  if (imgUrl) {
    box.innerHTML = `<img src="${imgUrl}" class="doc-preview-img" alt="${docName}">`;
  } else {
    box.innerHTML = `<div class="doc-placeholder">尚未上傳<br><span style="font-size:0.7rem; color:#94a3b8;">(比賽需檢核)</span></div>`;
  }
}

function closeDocsModal() {
  const modal = document.getElementById('docs-modal-overlay');
  if (modal) modal.classList.remove('active');
}

function handleImageUpload(event, docType) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    const member = mockData.members.find(m => m.id === currentSelectedMemberId);

    if (member) {
      member[docType] = dataUrl;
      renderDocPreview(docType, dataUrl, docType);
      renderMembers();

      if (docType === 'avatar' && member.id === 1) {
        const sidebarAvatar = document.getElementById('sidebar-user-avatar');
        if (sidebarAvatar) {
          sidebarAvatar.innerHTML = `<img src="${dataUrl}" alt="隊長">`;
        }
      }

      showToast('📸 圖片上傳成功！已即時於瀏覽器完成預覽保存。');
    }
  };
  reader.readAsDataURL(file);
}

/* ==========================================================================
   6. 總覽儀表板 (Dashboard) 渲染 (即時連動各模組)
   ========================================================================== */

function renderDashboard() {
  const paidMembersCount = mockData.members.filter(m => m.teamFeePaid).length;
  const orderSummary = OrderService.getSummary();

  const teamStats = AttendanceService.calculateTeamStats(mockData.members);
  let totalRate = 0;
  teamStats.forEach(s => totalRate += s.attendanceRate);
  const avgAttendance = teamStats.length > 0 ? Math.round(totalRate / teamStats.length) : 100;

  const statPaid = document.getElementById('stat-paid-members');
  const statAttendance = document.getElementById('stat-attendance-rate');
  const statOrders = document.getElementById('stat-pending-orders');
  const statPractice = document.getElementById('stat-next-practice');

  if (statPaid) statPaid.textContent = `${paidMembersCount} 人`;
  if (statAttendance) statAttendance.textContent = `${avgAttendance}%`;
  if (statOrders) statOrders.textContent = `${orderSummary.unpaidOrdersCount} 筆`;

  const practices = AttendanceService.getPractices().filter(p => p.status !== 'cancelled');
  if (statPractice) {
    statPractice.textContent = practices.length > 0 ? `${practices[0].date.slice(5)} (${practices[0].weekday.slice(2)})` : '未排定';
  }

  const practiceContainer = document.getElementById('dashboard-practice-list');
  if (practiceContainer) {
    practiceContainer.innerHTML = practices.slice(0, 3).map(p => `
      <div style="padding: 1rem 0; border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-weight: 700; color: var(--primary-navy); margin-bottom: 0.25rem;">
            ${p.date} (${p.weekday}) - ${p.court}
          </div>
          <div style="font-size: 0.85rem; color: var(--text-muted);">
            ⏰ ${p.time} ｜ 📝 ${p.note || '常規戰術訓練'}
          </div>
        </div>
        <span class="badge ${p.status === 'completed' ? 'badge-paid' : 'badge-success'}">
          ${p.status === 'completed' ? '已點名' : '排定中'}
        </span>
      </div>
    `).join('');
  }

  const orderContainer = document.getElementById('dashboard-order-list');
  if (orderContainer) {
    const latestOrders = OrderService.getRawOrders().slice(0, 3);
    orderContainer.innerHTML = latestOrders.map(o => `
      <div style="padding: 0.85rem 0; border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-weight: 600; font-size: 0.9rem;">${o.memberName} - ${o.product}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">尺寸: ${o.size} | 數量: ${o.quantity} | NT$ ${o.amount.toLocaleString()}</div>
        </div>
        <span class="badge ${o.paymentStatus === 'paid' ? 'badge-paid' : 'badge-unpaid'}">
          ${o.paymentStatus === 'paid' ? '已付款' : '未付款'}
        </span>
      </div>
    `).join('');
  }
}

/**
 * 輕量提示小訊息 (Toast 通知)
 */
function showToast(message) {
  let toast = document.getElementById('teamhub-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'teamhub-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 10px 15px rgba(0,0,0,0.2);
      font-size: 0.9rem;
      z-index: 9999;
      border-left: 4px solid #10b981;
      transition: all 0.3s ease;
      transform: translateY(20px);
      opacity: 0;
    `;
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.transform = 'translateY(0)';
  toast.style.opacity = '1';

  setTimeout(() => {
    toast.style.transform = 'translateY(20px)';
    toast.style.opacity = '0';
  }, 2800);
}
