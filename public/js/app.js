(function () {
  'use strict';

  const state = {
    activeTab: 'students',
    students: [],
    debtors: [],
    selectedMonth: getCurrentMonthString(),
    studentToDelete: null,
    historyStudent: null
  };

  const elements = {
    tabStudentsBtn: document.getElementById('tabStudentsBtn'),
    tabDebtorsBtn: document.getElementById('tabDebtorsBtn'),
    studentsCountPill: document.getElementById('studentsCountPill'),
    debtorsCountPill: document.getElementById('debtorsCountPill'),
    studentsView: document.getElementById('studentsView'),
    debtorsView: document.getElementById('debtorsView'),

    studentSearchInput: document.getElementById('studentSearchInput'),
    groupFilterSelect: document.getElementById('groupFilterSelect'),
    refreshStudentsBtn: document.getElementById('refreshStudentsBtn'),
    studentsTableContainer: document.getElementById('studentsTableContainer'),
    studentsTableBody: document.getElementById('studentsTableBody'),
    studentsLoadingState: document.getElementById('studentsLoadingState'),
    studentsErrorState: document.getElementById('studentsErrorState'),
    studentsErrorMessage: document.getElementById('studentsErrorMessage'),
    retryStudentsBtn: document.getElementById('retryStudentsBtn'),
    studentsEmptyState: document.getElementById('studentsEmptyState'),
    emptyAddStudentBtn: document.getElementById('emptyAddStudentBtn'),

    debtorsMonthInput: document.getElementById('debtorsMonthInput'),
    prevMonthBtn: document.getElementById('prevMonthBtn'),
    nextMonthBtn: document.getElementById('nextMonthBtn'),
    currentMonthBtn: document.getElementById('currentMonthBtn'),
    metricDebtorsCount: document.getElementById('metricDebtorsCount'),
    metricTotalDebt: document.getElementById('metricTotalDebt'),
    metricTotalCollected: document.getElementById('metricTotalCollected'),
    debtorsTableContainer: document.getElementById('debtorsTableContainer'),
    debtorsTableBody: document.getElementById('debtorsTableBody'),
    debtorsLoadingState: document.getElementById('debtorsLoadingState'),
    debtorsErrorState: document.getElementById('debtorsErrorState'),
    debtorsErrorMessage: document.getElementById('debtorsErrorMessage'),
    retryDebtorsBtn: document.getElementById('retryDebtorsBtn'),
    debtorsEmptyState: document.getElementById('debtorsEmptyState'),
    debtorsEmptyMessage: document.getElementById('debtorsEmptyMessage'),

    studentModal: document.getElementById('studentModal'),
    studentModalTitle: document.getElementById('studentModalTitle'),
    studentForm: document.getElementById('studentForm'),
    studentFormId: document.getElementById('studentFormId'),
    studentFullName: document.getElementById('studentFullName'),
    studentPhone: document.getElementById('studentPhone'),
    studentGroup: document.getElementById('studentGroup'),
    studentFee: document.getElementById('studentFee'),
    openStudentModalBtn: document.getElementById('openStudentModalBtn'),
    closeStudentModalBtn: document.getElementById('closeStudentModalBtn'),
    cancelStudentModalBtn: document.getElementById('cancelStudentModalBtn'),

    paymentModal: document.getElementById('paymentModal'),
    paymentForm: document.getElementById('paymentForm'),
    paymentStudentSelect: document.getElementById('paymentStudentSelect'),
    paymentStudentMeta: document.getElementById('paymentStudentMeta'),
    paymentStudentMetaGroup: document.getElementById('paymentStudentMetaGroup'),
    paymentStudentMetaFee: document.getElementById('paymentStudentMetaFee'),
    paymentAmount: document.getElementById('paymentAmount'),
    paymentDate: document.getElementById('paymentDate'),
    openPaymentModalBtn: document.getElementById('openPaymentModalBtn'),
    closePaymentModalBtn: document.getElementById('closePaymentModalBtn'),
    cancelPaymentModalBtn: document.getElementById('cancelPaymentModalBtn'),

    historyModal: document.getElementById('historyModal'),
    historyModalTitle: document.getElementById('historyModalTitle'),
    historyModalSubtitle: document.getElementById('historyModalSubtitle'),
    historyGroup: document.getElementById('historyGroup'),
    historyMonthlyFee: document.getElementById('historyMonthlyFee'),
    historyTotalPaid: document.getElementById('historyTotalPaid'),
    historyTableContainer: document.getElementById('historyTableContainer'),
    historyTableBody: document.getElementById('historyTableBody'),
    historyLoadingState: document.getElementById('historyLoadingState'),
    historyEmptyState: document.getElementById('historyEmptyState'),
    closeHistoryModalBtn: document.getElementById('closeHistoryModalBtn'),
    closeHistoryBottomBtn: document.getElementById('closeHistoryBottomBtn'),
    historyRecordNewPaymentBtn: document.getElementById('historyRecordNewPaymentBtn'),

    deleteModal: document.getElementById('deleteModal'),
    deleteStudentName: document.getElementById('deleteStudentName'),
    closeDeleteModalBtn: document.getElementById('closeDeleteModalBtn'),
    cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),

    toastContainer: document.getElementById('toastContainer')
  };

  function getCurrentMonthString() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  function getTodayDateString() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function formatMoney(amount) {
    const num = Number(amount) || 0;
    return `$${num.toFixed(2)}`;
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 200);
    }, 3500);
  }

  function switchTab(tabName) {
    state.activeTab = tabName;
    if (tabName === 'students') {
      elements.tabStudentsBtn.classList.add('active');
      elements.tabDebtorsBtn.classList.remove('active');
      elements.studentsView.classList.remove('hidden');
      elements.debtorsView.classList.add('hidden');
      loadStudents();
    } else {
      elements.tabDebtorsBtn.classList.add('active');
      elements.tabStudentsBtn.classList.remove('active');
      elements.debtorsView.classList.remove('hidden');
      elements.studentsView.classList.add('hidden');
      loadDebtors();
    }
  }

  function changeMonth(delta) {
    const [yStr, mStr] = state.selectedMonth.split('-');
    let y = parseInt(yStr, 10);
    let m = parseInt(mStr, 10) + delta;

    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }

    state.selectedMonth = `${y}-${String(m).padStart(2, '0')}`;
    elements.debtorsMonthInput.value = state.selectedMonth;
    loadDebtors();
  }

  async function loadStudents() {
    elements.studentsLoadingState.classList.remove('hidden');
    elements.studentsErrorState.classList.add('hidden');
    elements.studentsEmptyState.classList.add('hidden');
    elements.studentsTableContainer.classList.add('hidden');

    try {
      const search = elements.studentSearchInput.value.trim();
      const group = elements.groupFilterSelect.value;
      const students = await window.api.getStudents({ search, group });

      state.students = students;
      elements.studentsCountPill.textContent = students.length;

      updateGroupFilterDropdown();
      renderStudentsTable(students);

      elements.studentsLoadingState.classList.add('hidden');
      if (students.length === 0) {
        elements.studentsEmptyState.classList.remove('hidden');
      } else {
        elements.studentsTableContainer.classList.remove('hidden');
      }

      refreshDebtorsPill();
    } catch (err) {
      elements.studentsLoadingState.classList.add('hidden');
      elements.studentsErrorState.classList.remove('hidden');
      elements.studentsErrorMessage.textContent = err.message || 'Failed to load students.';
    }
  }

  function updateGroupFilterDropdown() {
    const currentSelected = elements.groupFilterSelect.value;
    const groups = new Set();
    state.students.forEach(s => {
      if (s.group_name) groups.add(s.group_name);
    });

    elements.groupFilterSelect.innerHTML = '<option value="">All Groups</option>';
    Array.from(groups).sort().forEach(grp => {
      const opt = document.createElement('option');
      opt.value = grp;
      opt.textContent = grp;
      if (grp === currentSelected) {
        opt.selected = true;
      }
      elements.groupFilterSelect.appendChild(opt);
    });
  }

  function renderStudentsTable(students) {
    elements.studentsTableBody.innerHTML = '';

    students.forEach(student => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <strong>${escapeHtml(student.full_name)}</strong>
        </td>
        <td>${escapeHtml(student.phone_number)}</td>
        <td>
          <span class="group-tag">${escapeHtml(student.group_name)}</span>
        </td>
        <td class="text-right currency-cell">${formatMoney(student.monthly_fee)}</td>
        <td class="text-right">
          <div class="table-actions">
            <button type="button" class="btn btn-secondary btn-sm record-pay-btn" data-id="${student.id}" title="Record payment for this student">
              Pay
            </button>
            <button type="button" class="btn btn-ghost btn-sm history-btn" data-id="${student.id}" title="View payment history">
              History
            </button>
            <button type="button" class="btn btn-ghost btn-sm edit-btn" data-id="${student.id}" title="Edit student details">
              Edit
            </button>
            <button type="button" class="btn btn-ghost btn-sm delete-btn" data-id="${student.id}" title="Delete student" style="color: var(--color-danger);">
              Delete
            </button>
          </div>
        </td>
      `;

      tr.querySelector('.record-pay-btn').addEventListener('click', () => openPaymentModal(student));
      tr.querySelector('.history-btn').addEventListener('click', () => openHistoryModal(student));
      tr.querySelector('.edit-btn').addEventListener('click', () => openStudentModal(student));
      tr.querySelector('.delete-btn').addEventListener('click', () => openDeleteModal(student));

      elements.studentsTableBody.appendChild(tr);
    });
  }

  async function loadDebtors() {
    elements.debtorsLoadingState.classList.remove('hidden');
    elements.debtorsErrorState.classList.add('hidden');
    elements.debtorsEmptyState.classList.add('hidden');
    elements.debtorsTableContainer.classList.add('hidden');

    try {
      const debtors = await window.api.getDebtors(state.selectedMonth);
      state.debtors = debtors;

      elements.debtorsCountPill.textContent = debtors.length;
      elements.metricDebtorsCount.textContent = debtors.length;

      let totalDebt = 0;
      let totalCollected = 0;
      debtors.forEach(d => {
        totalDebt += d.debt;
        totalCollected += d.total_paid;
      });

      elements.metricTotalDebt.textContent = formatMoney(totalDebt);
      elements.metricTotalCollected.textContent = formatMoney(totalCollected);

      elements.debtorsLoadingState.classList.add('hidden');

      if (debtors.length === 0) {
        elements.debtorsEmptyState.classList.remove('hidden');
        elements.debtorsEmptyMessage.textContent = `All students have fully paid or overpaid their tuition for ${state.selectedMonth}.`;
      } else {
        renderDebtorsTable(debtors);
        elements.debtorsTableContainer.classList.remove('hidden');
      }
    } catch (err) {
      elements.debtorsLoadingState.classList.add('hidden');
      elements.debtorsErrorState.classList.remove('hidden');
      elements.debtorsErrorMessage.textContent = err.message || 'Failed to calculate debtors.';
    }
  }

  async function refreshDebtorsPill() {
    try {
      const debtors = await window.api.getDebtors(state.selectedMonth);
      elements.debtorsCountPill.textContent = debtors.length;
    } catch {
    }
  }

  function renderDebtorsTable(debtors) {
    elements.debtorsTableBody.innerHTML = '';

    debtors.forEach(debtor => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${escapeHtml(debtor.full_name)}</strong></td>
        <td>${escapeHtml(debtor.phone_number)}</td>
        <td><span class="group-tag">${escapeHtml(debtor.group_name)}</span></td>
        <td class="text-right currency-cell">${formatMoney(debtor.monthly_fee)}</td>
        <td class="text-right tabular-num">${formatMoney(debtor.total_paid)}</td>
        <td class="text-right">
          <span class="badge-debt">${formatMoney(debtor.debt)}</span>
        </td>
        <td class="text-right">
          <button type="button" class="btn btn-secondary btn-sm pay-debt-btn" title="Record payment toward debt">
            Pay Debt
          </button>
        </td>
      `;

      tr.querySelector('.pay-debt-btn').addEventListener('click', () => {
        openPaymentModal(debtor, debtor.debt);
      });

      elements.debtorsTableBody.appendChild(tr);
    });
  }

  function openStudentModal(student = null) {
    clearFormErrors('studentForm');

    if (student) {
      elements.studentModalTitle.textContent = 'Edit Student';
      elements.studentFormId.value = student.id;
      elements.studentFullName.value = student.full_name;
      elements.studentPhone.value = student.phone_number;
      elements.studentGroup.value = student.group_name;
      elements.studentFee.value = student.monthly_fee.toFixed(2);
    } else {
      elements.studentModalTitle.textContent = 'Add New Student';
      elements.studentFormId.value = '';
      elements.studentForm.reset();
    }

    elements.studentModal.classList.remove('hidden');
    elements.studentFullName.focus();
  }

  function closeStudentModal() {
    elements.studentModal.classList.add('hidden');
  }

  async function handleStudentSubmit(e) {
    e.preventDefault();
    clearFormErrors('studentForm');

    const id = elements.studentFormId.value;
    const isEdit = Boolean(id);

    const payload = {
      full_name: elements.studentFullName.value.trim(),
      phone_number: elements.studentPhone.value.trim(),
      group_name: elements.studentGroup.value.trim(),
      monthly_fee: parseFloat(elements.studentFee.value)
    };

    let hasError = false;
    if (!payload.full_name) {
      setFieldError('studentFullNameError', 'Full name is required.');
      hasError = true;
    }
    if (!payload.phone_number) {
      setFieldError('studentPhoneError', 'Phone number is required.');
      hasError = true;
    }
    if (!payload.group_name) {
      setFieldError('studentGroupError', 'Group name is required.');
      hasError = true;
    }
    if (isNaN(payload.monthly_fee) || payload.monthly_fee <= 0) {
      setFieldError('studentFeeError', 'Valid positive fee is required.');
      hasError = true;
    }

    if (hasError) return;

    try {
      if (isEdit) {
        await window.api.updateStudent(id, payload);
        showToast('Student updated successfully.', 'success');
      } else {
        await window.api.createStudent(payload);
        showToast('Student created successfully.', 'success');
      }

      closeStudentModal();
      loadStudents();
      if (state.activeTab === 'debtors') {
        loadDebtors();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function populatePaymentStudents(preselectedId = null) {
    elements.paymentStudentSelect.innerHTML = '<option value="">Select a student...</option>';

    if (state.students.length === 0) {
      state.students = await window.api.getStudents();
    }

    state.students.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.full_name} (${s.group_name})`;
      opt.dataset.fee = s.monthly_fee;
      opt.dataset.group = s.group_name;
      if (String(s.id) === String(preselectedId)) {
        opt.selected = true;
      }
      elements.paymentStudentSelect.appendChild(opt);
    });

    updatePaymentStudentMeta();
  }

  function updatePaymentStudentMeta() {
    const selected = elements.paymentStudentSelect.selectedOptions[0];
    if (selected && selected.value) {
      elements.paymentStudentMetaGroup.textContent = `Group: ${selected.dataset.group}`;
      elements.paymentStudentMetaFee.textContent = `Fee: ${formatMoney(selected.dataset.fee)}/mo`;
      elements.paymentStudentMeta.classList.remove('hidden');
    } else {
      elements.paymentStudentMeta.classList.add('hidden');
    }
  }

  async function openPaymentModal(preselectedStudent = null, defaultAmount = null) {
    clearFormErrors('paymentForm');
    elements.paymentForm.reset();
    elements.paymentDate.value = getTodayDateString();

    const preselectedId = preselectedStudent ? preselectedStudent.id : null;
    await populatePaymentStudents(preselectedId);

    if (defaultAmount !== null && defaultAmount !== undefined) {
      elements.paymentAmount.value = Number(defaultAmount).toFixed(2);
    } else if (preselectedStudent && preselectedStudent.monthly_fee) {
      elements.paymentAmount.value = Number(preselectedStudent.monthly_fee).toFixed(2);
    }

    elements.paymentModal.classList.remove('hidden');
    if (!preselectedId) {
      elements.paymentStudentSelect.focus();
    } else {
      elements.paymentAmount.focus();
    }
  }

  function closePaymentModal() {
    elements.paymentModal.classList.add('hidden');
  }

  async function handlePaymentSubmit(e) {
    e.preventDefault();
    clearFormErrors('paymentForm');

    const studentId = elements.paymentStudentSelect.value;
    const amount = parseFloat(elements.paymentAmount.value);
    const paymentDate = elements.paymentDate.value;

    let hasError = false;
    if (!studentId) {
      setFieldError('paymentStudentSelectError', 'Please select a student.');
      hasError = true;
    }
    if (isNaN(amount) || amount <= 0) {
      setFieldError('paymentAmountError', 'Please enter a positive amount.');
      hasError = true;
    }
    if (!paymentDate) {
      setFieldError('paymentDateError', 'Valid payment date is required.');
      hasError = true;
    }

    if (hasError) return;

    try {
      await window.api.createPayment({
        student_id: Number(studentId),
        amount,
        payment_date: paymentDate
      });

      showToast(`Payment of ${formatMoney(amount)} recorded successfully!`, 'success');
      closePaymentModal();

      if (state.activeTab === 'debtors') {
        loadDebtors();
      } else {
        loadStudents();
      }

      if (state.historyStudent && String(state.historyStudent.id) === String(studentId)) {
        openHistoryModal(state.historyStudent);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function openHistoryModal(student) {
    state.historyStudent = student;
    elements.historyModalTitle.textContent = `Payment History: ${student.full_name}`;
    elements.historyGroup.textContent = student.group_name;
    elements.historyMonthlyFee.textContent = formatMoney(student.monthly_fee);

    elements.historyLoadingState.classList.remove('hidden');
    elements.historyEmptyState.classList.add('hidden');
    elements.historyTableContainer.classList.add('hidden');
    elements.historyModal.classList.remove('hidden');

    try {
      const payments = await window.api.getStudentPayments(student.id);

      elements.historyLoadingState.classList.add('hidden');

      let totalPaidAllTime = 0;
      payments.forEach(p => { totalPaidAllTime += p.amount; });
      elements.historyTotalPaid.textContent = formatMoney(totalPaidAllTime);

      if (payments.length === 0) {
        elements.historyEmptyState.classList.remove('hidden');
      } else {
        elements.historyTableBody.innerHTML = '';
        payments.forEach(p => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>#${p.id}</td>
            <td><strong>${p.payment_date}</strong></td>
            <td class="text-right currency-cell">${formatMoney(p.amount)}</td>
            <td class="text-right text-muted tabular-num">${p.created_at || '—'}</td>
          `;
          elements.historyTableBody.appendChild(tr);
        });
        elements.historyTableContainer.classList.remove('hidden');
      }
    } catch (err) {
      elements.historyLoadingState.classList.add('hidden');
      showToast(err.message || 'Failed to load payment history', 'error');
    }
  }

  function closeHistoryModal() {
    elements.historyModal.classList.add('hidden');
    state.historyStudent = null;
  }

  function openDeleteModal(student) {
    state.studentToDelete = student;
    elements.deleteStudentName.textContent = student.full_name;
    elements.deleteModal.classList.remove('hidden');
  }

  function closeDeleteModal() {
    elements.deleteModal.classList.add('hidden');
    state.studentToDelete = null;
  }

  async function handleConfirmDelete() {
    if (!state.studentToDelete) return;
    try {
      await window.api.deleteStudent(state.studentToDelete.id);
      showToast(`Student ${state.studentToDelete.full_name} and associated payments deleted.`, 'success');
      closeDeleteModal();
      loadStudents();
      if (state.activeTab === 'debtors') {
        loadDebtors();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete student.', 'error');
    }
  }

  function setFieldError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) el.textContent = message;
  }

  function clearFormErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.querySelectorAll('.field-error').forEach(el => {
      el.textContent = '';
    });
  }

  function initEventListeners() {
    elements.tabStudentsBtn.addEventListener('click', () => switchTab('students'));
    elements.tabDebtorsBtn.addEventListener('click', () => switchTab('debtors'));

    let searchDebounceTimeout = null;
    elements.studentSearchInput.addEventListener('input', () => {
      clearTimeout(searchDebounceTimeout);
      searchDebounceTimeout = setTimeout(() => {
        loadStudents();
      }, 250);
    });

    elements.groupFilterSelect.addEventListener('change', () => loadStudents());
    elements.refreshStudentsBtn.addEventListener('click', () => loadStudents());
    elements.retryStudentsBtn.addEventListener('click', () => loadStudents());
    elements.emptyAddStudentBtn.addEventListener('click', () => openStudentModal());

    elements.debtorsMonthInput.value = state.selectedMonth;
    elements.debtorsMonthInput.addEventListener('change', (e) => {
      if (e.target.value) {
        state.selectedMonth = e.target.value;
        loadDebtors();
      }
    });
    elements.prevMonthBtn.addEventListener('click', () => changeMonth(-1));
    elements.nextMonthBtn.addEventListener('click', () => changeMonth(1));
    elements.currentMonthBtn.addEventListener('click', () => {
      state.selectedMonth = getCurrentMonthString();
      elements.debtorsMonthInput.value = state.selectedMonth;
      loadDebtors();
    });
    elements.retryDebtorsBtn.addEventListener('click', () => loadDebtors());

    elements.openStudentModalBtn.addEventListener('click', () => openStudentModal());
    elements.closeStudentModalBtn.addEventListener('click', closeStudentModal);
    elements.cancelStudentModalBtn.addEventListener('click', closeStudentModal);
    elements.studentForm.addEventListener('submit', handleStudentSubmit);

    elements.openPaymentModalBtn.addEventListener('click', () => openPaymentModal());
    elements.closePaymentModalBtn.addEventListener('click', closePaymentModal);
    elements.cancelPaymentModalBtn.addEventListener('click', closePaymentModal);
    elements.paymentStudentSelect.addEventListener('change', updatePaymentStudentMeta);
    elements.paymentForm.addEventListener('submit', handlePaymentSubmit);

    elements.closeHistoryModalBtn.addEventListener('click', closeHistoryModal);
    elements.closeHistoryBottomBtn.addEventListener('click', closeHistoryModal);
    elements.historyRecordNewPaymentBtn.addEventListener('click', () => {
      const student = state.historyStudent;
      closeHistoryModal();
      if (student) openPaymentModal(student);
    });

    elements.closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
    elements.cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    elements.confirmDeleteBtn.addEventListener('click', handleConfirmDelete);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeStudentModal();
        closePaymentModal();
        closeHistoryModal();
        closeDeleteModal();
      }
    });

    [elements.studentModal, elements.paymentModal, elements.historyModal, elements.deleteModal].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.add('hidden');
        }
      });
    });
  }

  function init() {
    initEventListeners();
    loadStudents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
