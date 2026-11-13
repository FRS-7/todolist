// ============================================================
//  APP.JS — CATATAN AKTIVITAS HARIAN
//  Logika utama aplikasi
// ============================================================

// ─── State ────────────────────────────────────────────────
let categories = [];
let todayActivities = [];
let recapActivities = [];
let recapYear  = new Date().getFullYear();
let recapMonth = new Date().getMonth(); // 0-indexed

let editingId   = null;
let selectedEmoji = '📌';
let selectedColor = '#7C3AED';
let manualTimeEnabled = false;

// ─── Locale ───────────────────────────────────────────────
const LOCALE = 'id-ID';
const HARI   = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const BULAN  = ['Januari','Februari','Maret','April','Mei','Juni',
                'Juli','Agustus','September','Oktober','November','Desember'];

// ─── Emoji & Color palettes ───────────────────────────────
const EMOJIS = [
  '📌','💼','🏃','🍽️','📚','💤','🏋️','🎵','🎮','💊','🛁','🚗',
  '✍️','🧠','📞','🛒','🌿','🐾','💻','🎯','🧘','🍳','🤝','🌙'
];
const COLORS = [
  '#7C3AED','#A855F7','#3B82F6','#0EA5E9','#22C55E',
  '#F59E0B','#EF4444','#EC4899','#14B8A6','#F97316',
  '#6366F1','#84CC16','#E879F9','#FB923C','#38BDF8'
];

// ─── DOM Refs ──────────────────────────────────────────────
const clockEl       = document.getElementById('clock');
const clockDayEl    = document.getElementById('clock-day');
const clockDateEl   = document.getElementById('clock-date');
const timeBadgeEl   = document.getElementById('time-badge');
const manualInputEl = document.getElementById('manual-time-inputs');
const manualDateEl  = document.getElementById('manual-date');
const manualTimeHEl = document.getElementById('manual-time-h');
const descInputEl   = document.getElementById('activity-desc');
const catSelectEl   = document.getElementById('activity-cat');
const addFormEl     = document.getElementById('add-form');
const todayListEl   = document.getElementById('today-list');
const recapListEl   = document.getElementById('recap-list');
const monthLabelEl  = document.getElementById('month-label');
const statTotalEl   = document.getElementById('stat-total');
const statDaysEl    = document.getElementById('stat-days');
const statTopCatEl  = document.getElementById('stat-top-cat');
const catGridEl     = document.getElementById('cat-grid');
const emojiPickerEl = document.getElementById('emoji-picker');
const colorPickerEl = document.getElementById('color-picker');
const newCatNameEl  = document.getElementById('new-cat-name');
const modalOverlay  = document.getElementById('modal-overlay');
const editDescEl    = document.getElementById('edit-desc');
const editCatEl     = document.getElementById('edit-cat');
const editDateEl    = document.getElementById('edit-date');
const editTimeEl    = document.getElementById('edit-time');
const toastContainerEl = document.getElementById('toast-container');
const submitBtnEl   = document.getElementById('submit-btn');

// ─── CLOCK ────────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  const h   = String(now.getHours()).padStart(2,'0');
  const m   = String(now.getMinutes()).padStart(2,'0');
  const s   = String(now.getSeconds()).padStart(2,'0');
  clockEl.innerHTML = `${h}<span class="colon">:</span>${m}<span class="colon">:</span>${s}`;

  const day  = HARI[now.getDay()];
  const date = now.getDate();
  const mon  = BULAN[now.getMonth()];
  const yr   = now.getFullYear();
  clockDayEl.textContent  = day;
  clockDateEl.textContent = `${date} ${mon} ${yr}`;

  // Update time badge (auto mode)
  if (!manualTimeEnabled) {
    timeBadgeEl.textContent = `${h}:${m}`;
  }
}

setInterval(updateClock, 1000);
updateClock();

// ─── TABS ─────────────────────────────────────────────────
const pages    = document.querySelectorAll('.page');
const navItems = document.querySelectorAll('.nav-item');

function switchTab(tabId) {
  pages.forEach(p => p.classList.remove('active'));
  navItems.forEach(n => n.classList.remove('active'));
  const targetPage = document.getElementById(`page-${tabId}`);
  const targetNav  = document.querySelector(`[data-tab="${tabId}"]`);
  if (targetPage) targetPage.classList.add('active');
  if (targetNav) targetNav.classList.add('active');

  if (tabId === 'reading') loadReadingPage();
  if (tabId === 'recap') loadRecap();
  if (tabId === 'categories') renderCatGrid();
}

navItems.forEach(n => {
  n.addEventListener('click', () => switchTab(n.dataset.tab));
});

// ─── TIME TOGGLE ──────────────────────────────────────────
document.getElementById('btn-toggle-time').addEventListener('click', () => {
  manualTimeEnabled = !manualTimeEnabled;
  manualInputEl.classList.toggle('visible', manualTimeEnabled);
  document.getElementById('btn-toggle-time').textContent = manualTimeEnabled ? '⏱ Otomatis' : '✏️ Edit Waktu';

  if (manualTimeEnabled) {
    const now = new Date();
    manualDateEl.value = toLocalDateString(now);
    manualTimeHEl.value = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    timeBadgeEl.textContent = manualTimeHEl.value;
  }
});

manualTimeHEl && manualTimeHEl.addEventListener('input', () => {
  timeBadgeEl.textContent = manualTimeHEl.value || '--:--';
});

function toLocalDateString(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function getSelectedTime() {
  if (manualTimeEnabled && manualDateEl.value && manualTimeHEl.value) {
    return new Date(`${manualDateEl.value}T${manualTimeHEl.value}:00`);
  }
  return new Date();
}

// ─── LOAD CATEGORIES ──────────────────────────────────────
async function loadCategories() {
  try {
    categories = await getCategories();
    populateCatSelect(catSelectEl);
    populateCatSelect(editCatEl);
    renderCatGrid();
  } catch (e) {
    showToast('Gagal memuat kategori: ' + e.message, 'error');
  }
}

function populateCatSelect(selectEl) {
  if (!selectEl) return;
  const current = selectEl.value;
  selectEl.innerHTML = '<option value="">— Tanpa Kategori —</option>';
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = `${cat.icon} ${cat.name}`;
    selectEl.appendChild(opt);
  });
  if (current) selectEl.value = current;
}

// ─── LOAD TODAY ───────────────────────────────────────────
async function loadToday() {
  try {
    todayActivities = await getActivitiesForDate(new Date());
    renderTodayList();
  } catch (e) {
    showToast('Gagal memuat aktivitas: ' + e.message, 'error');
  }
}

function renderTodayList() {
  if (todayActivities.length === 0) {
    todayListEl.innerHTML = `
      <div class="empty-state fade-in">
        <span class="empty-icon">📝</span>
        <div class="empty-text">Belum ada aktivitas hari ini</div>
        <div class="empty-sub">Catat aktivitas pertamamu sekarang!</div>
      </div>`;
    return;
  }

  todayListEl.innerHTML = '';
  todayActivities.forEach(act => {
    todayListEl.appendChild(buildActivityEl(act));
  });
}

function buildActivityEl(act) {
  const date = new Date(act.logged_at);
  const h    = String(date.getHours()).padStart(2,'0');
  const m    = String(date.getMinutes()).padStart(2,'0');
  const cat  = act.categories;

  const el = document.createElement('div');
  el.className = 'activity-item';
  el.dataset.id = act.id;
  el.innerHTML = `
    <div class="activity-time-block">
      <div class="activity-time">${h}:${m}</div>
      <div class="activity-ampm">${date.getHours() < 12 ? 'AM' : 'PM'}</div>
      ${cat ? `<div class="activity-category-dot" style="background:${cat.color}"></div>` : ''}
    </div>
    <div class="activity-body">
      <div class="activity-desc">${escHtml(act.description)}</div>
      ${cat ? `<span class="activity-cat-tag" style="color:${cat.color}">${cat.icon} ${cat.name}</span>` : ''}
    </div>
    <div class="activity-actions">
      <button class="btn-icon edit" title="Edit" onclick="openEditModal('${act.id}')">✏️</button>
      <button class="btn-icon delete" title="Hapus" onclick="confirmDelete('${act.id}')">🗑️</button>
    </div>`;
  return el;
}

// ─── ADD ACTIVITY ─────────────────────────────────────────
addFormEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  const desc = descInputEl.value.trim();
  if (!desc) { showToast('Tulis deskripsi aktivitas dulu!', 'error'); return; }

  const catId    = catSelectEl.value || null;
  const loggedAt = getSelectedTime();

  submitBtnEl.disabled = true;
  submitBtnEl.innerHTML = '<span class="spinner"></span> Menyimpan...';

  try {
    const newAct = await addActivity(desc, catId, loggedAt);

    // Reset form
    descInputEl.value = '';
    catSelectEl.value = '';
    manualTimeEnabled = false;
    manualInputEl.classList.remove('visible');
    document.getElementById('btn-toggle-time').textContent = '✏️ Edit Waktu';

    // Jika aktivitas adalah hari ini, tambah ke list
    const today = new Date();
    const actDate = new Date(newAct.logged_at);
    if (actDate.toDateString() === today.toDateString()) {
      todayActivities.unshift(newAct);
      renderTodayList();
    }

    showToast('✅ Aktivitas berhasil dicatat!', 'success');
  } catch (err) {
    showToast('Gagal menyimpan: ' + err.message, 'error');
  } finally {
    submitBtnEl.disabled = false;
    submitBtnEl.innerHTML = '+ Catat Aktivitas';
  }
});

// ─── DELETE ───────────────────────────────────────────────
async function confirmDelete(id) {
  if (!confirm('Hapus aktivitas ini?')) return;
  try {
    const el = document.querySelector(`.activity-item[data-id="${id}"]`);
    if (el) { el.classList.add('removing'); await sleep(280); }

    await deleteActivity(id);
    todayActivities = todayActivities.filter(a => a.id !== id);
    renderTodayList();
    showToast('🗑️ Aktivitas dihapus', 'success');
  } catch (err) {
    showToast('Gagal menghapus: ' + err.message, 'error');
  }
}

// ─── EDIT MODAL ───────────────────────────────────────────
function openEditModal(id) {
  const act = todayActivities.find(a => a.id === id);
  if (!act) return;

  editingId = id;
  editDescEl.value = act.description;
  editCatEl.value  = act.categories?.id || '';
  const d = new Date(act.logged_at);
  editDateEl.value = toLocalDateString(d);
  editTimeEl.value = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  modalOverlay.classList.add('visible');
  editDescEl.focus();
}

function closeModal() {
  modalOverlay.classList.remove('visible');
  editingId = null;
}

document.getElementById('btn-modal-close').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });

document.getElementById('edit-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!editingId) return;

  const desc    = editDescEl.value.trim();
  const catId   = editCatEl.value || null;
  const logTime = new Date(`${editDateEl.value}T${editTimeEl.value}:00`);

  const btn = document.getElementById('btn-save-edit');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    const updated = await updateActivity(editingId, desc, catId, logTime);

    // Update in today list if still today
    const today = new Date();
    const actDate = new Date(updated.logged_at);
    if (actDate.toDateString() === today.toDateString()) {
      const idx = todayActivities.findIndex(a => a.id === editingId);
      if (idx !== -1) todayActivities[idx] = updated;
    } else {
      todayActivities = todayActivities.filter(a => a.id !== editingId);
    }
    renderTodayList();
    closeModal();
    showToast('✅ Aktivitas diperbarui!', 'success');
  } catch (err) {
    showToast('Gagal menyimpan: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Simpan';
  }
});

// ─── RECAP ────────────────────────────────────────────────
async function loadRecap() {
  try {
    recapActivities = await getActivitiesForMonth(recapYear, recapMonth);
    renderRecap();
  } catch (e) {
    showToast('Gagal memuat rekap: ' + e.message, 'error');
    recapListEl.innerHTML = `<div class="empty-state"><span class="empty-icon">⚠️</span><div class="empty-text">Gagal memuat data</div></div>`;
  }
}

function renderRecap() {
  monthLabelEl.textContent = `${BULAN[recapMonth]} ${recapYear}`;

  // Stats
  statTotalEl.textContent = recapActivities.length;

  const daySet = new Set(recapActivities.map(a => new Date(a.logged_at).toDateString()));
  statDaysEl.textContent = daySet.size;

  // Top category
  const catCount = {};
  recapActivities.forEach(a => {
    const name = a.categories?.name || 'Lainnya';
    catCount[name] = (catCount[name] || 0) + 1;
  });
  const topCat = Object.entries(catCount).sort((a,b) => b[1]-a[1])[0];
  statTopCatEl.textContent = topCat ? topCat[0] : '—';

  // Group by day
  if (recapActivities.length === 0) {
    recapListEl.innerHTML = `
      <div class="empty-state fade-in">
        <span class="empty-icon">📅</span>
        <div class="empty-text">Tidak ada aktivitas di bulan ini</div>
        <div class="empty-sub">Mulai catat aktivitasmu!</div>
      </div>`;
    return;
  }

  const grouped = {};
  recapActivities.forEach(act => {
    const d    = new Date(act.logged_at);
    const key  = toLocalDateString(d);
    if (!grouped[key]) grouped[key] = { label: formatDayLabel(d), items: [] };
    grouped[key].items.push(act);
  });

  recapListEl.innerHTML = '';
  // sort days descending
  const sortedKeys = Object.keys(grouped).sort((a,b) => b.localeCompare(a));
  sortedKeys.forEach((key, idx) => {
    const group = grouped[key];
    const el = document.createElement('div');
    el.className = 'day-group' + (idx === 0 ? ' open' : '');
    el.innerHTML = `
      <div class="day-group-header" onclick="this.parentElement.classList.toggle('open')">
        <span class="day-group-title">${group.label}</span>
        <div style="display:flex;align-items:center;gap:8px">
          <span class="day-group-count">${group.items.length} aktivitas</span>
          <span class="day-group-chevron">▾</span>
        </div>
      </div>
      <div class="day-group-body">
        ${group.items.map(act => buildRecapItem(act)).join('')}
      </div>`;
    recapListEl.appendChild(el);
  });
}

function buildRecapItem(act) {
  const d   = new Date(act.logged_at);
  const h   = String(d.getHours()).padStart(2,'0');
  const m   = String(d.getMinutes()).padStart(2,'0');
  const cat = act.categories;
  const catTag = cat
    ? `<span class="recap-item-cat" style="background:${cat.color}22;color:${cat.color}">${cat.icon} ${cat.name}</span>`
    : '';
  return `
    <div class="recap-item">
      <span class="recap-item-time">${h}:${m}</span>
      <span class="recap-item-desc">${escHtml(act.description)}</span>
      ${catTag}
    </div>`;
}

function formatDayLabel(date) {
  const today = new Date();
  const yest  = new Date(); yest.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return `Hari Ini — ${date.getDate()} ${BULAN[date.getMonth()]}`;
  if (date.toDateString() === yest.toDateString())  return `Kemarin — ${date.getDate()} ${BULAN[date.getMonth()]}`;
  return `${HARI[date.getDay()]}, ${date.getDate()} ${BULAN[date.getMonth()]} ${date.getFullYear()}`;
}

// Month navigation
document.getElementById('btn-prev-month').addEventListener('click', () => {
  recapMonth--;
  if (recapMonth < 0) { recapMonth = 11; recapYear--; }
  loadRecap();
});

document.getElementById('btn-next-month').addEventListener('click', () => {
  recapMonth++;
  if (recapMonth > 11) { recapMonth = 0; recapYear++; }
  loadRecap();
});

// ─── EXPORT PDF ───────────────────────────────────────────
document.getElementById('btn-export-pdf').addEventListener('click', exportPDF);

async function exportPDF() {
  const btn = document.getElementById('btn-export-pdf');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Membuat PDF...';

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

    const pageW  = doc.internal.pageSize.getWidth();
    const pageH  = doc.internal.pageSize.getHeight();
    const margin = 18;
    const contentW = pageW - margin * 2;
    let y = margin;

    // ── Helper ──
    const newPageIfNeeded = (needed = 10) => {
      if (y + needed > pageH - margin) {
        doc.addPage();
        y = margin;
        drawPageFooter(doc, pageW, pageH, margin);
      }
    };

    // ── Header ──
    doc.setFillColor(25, 10, 50);
    doc.rect(0, 0, pageW, 42, 'F');

    doc.setFontSize(8);
    doc.setTextColor(168, 85, 247);
    doc.text('LAPORAN AKTIVITAS HARIAN', margin, 14);

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(241, 240, 255);
    doc.text(`${BULAN[recapMonth]} ${recapYear}`, margin, 26);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(139, 139, 167);
    const generated = `Dibuat: ${formatFullDate(new Date())}`;
    doc.text(generated, margin, 35);

    y = 52;

    // ── Stats ──
    const statBoxW = (contentW - 12) / 3;

    const stats = [
      { label: 'Total Aktivitas', value: String(recapActivities.length), color: [124, 58, 237] },
      { label: 'Hari Aktif',      value: String(new Set(recapActivities.map(a => new Date(a.logged_at).toDateString())).size), color: [34, 197, 94] },
      { label: 'Kategori Teratas', value: (() => {
          const cc = {};
          recapActivities.forEach(a => { const n = a.categories?.name || '—'; cc[n]=(cc[n]||0)+1; });
          const t = Object.entries(cc).sort((a,b)=>b[1]-a[1])[0];
          return t ? t[0] : '—';
        })(), color: [245, 158, 11] }
    ];

    stats.forEach((s, i) => {
      const x = margin + i * (statBoxW + 6);
      doc.setFillColor(...s.color, 0.12);
      doc.setDrawColor(...s.color);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, y, statBoxW, 22, 3, 3, 'FD');

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...s.color);
      doc.text(s.value, x + statBoxW/2, y + 11, { align: 'center' });

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(139, 139, 167);
      doc.text(s.label.toUpperCase(), x + statBoxW/2, y + 18, { align: 'center' });
    });

    y += 32;

    // ── Category Summary ──
    const catCount = {};
    recapActivities.forEach(a => {
      const cat = a.categories;
      const key = cat ? cat.name : 'Tanpa Kategori';
      catCount[key] = (catCount[key] || 0) + 1;
    });

    if (Object.keys(catCount).length > 0) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(241, 240, 255);
      doc.text('RINGKASAN PER KATEGORI', margin, y);
      y += 6;

      const sortedCats = Object.entries(catCount).sort((a,b) => b[1]-a[1]);
      const total = recapActivities.length;
      const barH  = 7;
      const barMaxW = contentW - 60;

      sortedCats.forEach(([name, count]) => {
        newPageIfNeeded(barH + 4);
        const pct = count / total;
        const barW = barMaxW * pct;

        // Cat name
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(200, 200, 220);
        doc.text(name, margin, y + 5);

        // Bar background
        doc.setFillColor(40, 40, 60);
        doc.roundedRect(margin + 50, y, barMaxW, barH, 2, 2, 'F');

        // Bar fill
        const catObj = categories.find(c => c.name === name);
        const hex = catObj?.color || '#7C3AED';
        const rgb = hexToRgb(hex);
        doc.setFillColor(rgb.r, rgb.g, rgb.b);
        if (barW > 0.5) doc.roundedRect(margin + 50, y, barW, barH, 2, 2, 'F');

        // Count
        doc.setFontSize(8);
        doc.setTextColor(200, 200, 220);
        doc.text(`${count}x (${Math.round(pct*100)}%)`, margin + 50 + barMaxW + 4, y + 5);

        y += barH + 4;
      });

      y += 6;
    }

    // ── Divider ──
    doc.setDrawColor(42, 42, 62);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageW - margin, y);
    y += 8;

    // ── Activities by day ──
    const grouped = {};
    recapActivities.forEach(act => {
      const d   = new Date(act.logged_at);
      const key = toLocalDateString(d);
      if (!grouped[key]) grouped[key] = { date: d, items: [] };
      grouped[key].items.push(act);
    });

    const sortedKeys = Object.keys(grouped).sort((a,b) => a.localeCompare(b));

    sortedKeys.forEach(key => {
      const group = grouped[key];
      const d     = group.date;
      const label = `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;

      newPageIfNeeded(14);

      // Day header
      doc.setFillColor(28, 28, 40);
      doc.rect(margin - 2, y - 4, contentW + 4, 12, 'F');
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(168, 85, 247);
      doc.text(label, margin, y + 4);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(139, 139, 167);
      doc.text(`${group.items.length} aktivitas`, pageW - margin, y + 4, { align: 'right' });

      y += 12;

      // Items
      group.items.forEach((act, idx) => {
        const isEven = idx % 2 === 1;
        newPageIfNeeded(9);

        if (isEven) {
          doc.setFillColor(19, 19, 26);
          doc.rect(margin - 2, y - 3, contentW + 4, 9, 'F');
        }

        // Time
        const ad = new Date(act.logged_at);
        const hh = String(ad.getHours()).padStart(2,'0');
        const mm = String(ad.getMinutes()).padStart(2,'0');
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(168, 85, 247);
        doc.text(`${hh}:${mm}`, margin, y + 3);

        // Category dot
        if (act.categories) {
          const rgb = hexToRgb(act.categories.color || '#7C3AED');
          doc.setFillColor(rgb.r, rgb.g, rgb.b);
          doc.circle(margin + 22, y + 2, 1.5, 'F');
        }

        // Description
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(220, 220, 240);
        const maxDescW = contentW - 75;
        const lines = doc.splitTextToSize(act.description, maxDescW);
        doc.text(lines[0], margin + 27, y + 3); // only first line in row

        // Category tag
        if (act.categories) {
          const catName = `${act.categories.icon || ''} ${act.categories.name}`.trim();
          doc.setFontSize(7.5);
          doc.setTextColor(139, 139, 167);
          doc.text(catName, pageW - margin, y + 3, { align: 'right' });
        }

        y += 9;

        // If description had multiple lines
        if (lines.length > 1) {
          for (let l = 1; l < lines.length; l++) {
            newPageIfNeeded(6);
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(220, 220, 240);
            doc.text(lines[l], margin + 27, y + 2);
            y += 6;
          }
        }
      });

      y += 6;
    });

    // ── Footer on last page ──
    drawPageFooter(doc, pageW, pageH, margin);

    // ── Save ──
    const filename = `Aktivitas_${BULAN[recapMonth]}_${recapYear}.pdf`;
    doc.save(filename);
    showToast('📄 PDF berhasil diunduh!', 'success');

  } catch (err) {
    console.error(err);
    showToast('Gagal membuat PDF: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '📄 Unduh PDF';
  }
}

function drawPageFooter(doc, pageW, pageH, margin) {
  const pageCount = doc.internal.getNumberOfPages();
  doc.setPage(pageCount);
  doc.setDrawColor(42, 42, 62);
  doc.setLineWidth(0.3);
  doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 100);
  doc.text('Catatan Aktivitas Harian', margin, pageH - 7);
  doc.text(`Halaman ${pageCount}`, pageW - margin, pageH - 7, { align: 'right' });
}

function formatFullDate(d) {
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? { r: parseInt(result[1],16), g: parseInt(result[2],16), b: parseInt(result[3],16) } : {r:124,g:58,b:237};
}

// ─── CATEGORIES PAGE ─────────────────────────────────────
function renderCatGrid() {
  catGridEl.innerHTML = '';
  categories.forEach(cat => {
    const el = document.createElement('div');
    el.className = 'cat-card fade-in';
    el.innerHTML = `
      <div class="cat-icon">${cat.icon}</div>
      <div class="cat-name">${escHtml(cat.name)}</div>
      ${cat.is_default ? '<span class="cat-badge-default">Default</span>' : ''}
      ${!cat.is_default ? `<button class="cat-delete" onclick="removeCategory('${cat.id}')" title="Hapus">✕</button>` : ''}`;
    el.style.borderTop = `3px solid ${cat.color}`;
    catGridEl.appendChild(el);
  });
}

async function removeCategory(id) {
  if (!confirm('Hapus kategori ini? Aktivitas dengan kategori ini tidak akan terhapus.')) return;
  try {
    await deleteCategory(id);
    categories = categories.filter(c => c.id !== id);
    renderCatGrid();
    populateCatSelect(catSelectEl);
    populateCatSelect(editCatEl);
    showToast('Kategori dihapus', 'success');
  } catch (e) {
    showToast('Gagal menghapus kategori: ' + e.message, 'error');
  }
}

// Emoji picker
emojiPickerEl.innerHTML = EMOJIS.map(e =>
  `<button type="button" class="emoji-btn${e===selectedEmoji?' selected':''}" data-emoji="${e}" onclick="selectEmoji(this,'${e}')">${e}</button>`
).join('');

function selectEmoji(el, emoji) {
  selectedEmoji = emoji;
  emojiPickerEl.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
}

// Color picker
colorPickerEl.innerHTML = COLORS.map(c =>
  `<button type="button" class="color-btn${c===selectedColor?' selected':''}" style="background:${c}" onclick="selectColor(this,'${c}')" title="${c}"></button>`
).join('');

function selectColor(el, color) {
  selectedColor = color;
  colorPickerEl.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
}

document.getElementById('btn-add-cat').addEventListener('click', async () => {
  const name = newCatNameEl.value.trim();
  if (!name) { showToast('Isi nama kategori!', 'error'); return; }
  if (categories.find(c => c.name.toLowerCase() === name.toLowerCase())) {
    showToast('Kategori sudah ada!', 'error'); return;
  }

  const btn = document.getElementById('btn-add-cat');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    const newCat = await addCategory(name, selectedColor, selectedEmoji);
    categories.push(newCat);
    newCatNameEl.value = '';
    renderCatGrid();
    populateCatSelect(catSelectEl);
    populateCatSelect(editCatEl);
    showToast(`${selectedEmoji} Kategori "${name}" ditambahkan!`, 'success');
  } catch (e) {
    showToast('Gagal tambah kategori: ' + e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '+ Tambah Kategori';
  }
});

// ─── TOAST ────────────────────────────────────────────────
function showToast(msg, type = '') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  toastContainerEl.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ─── UTILS ────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ════════════════════════════════════════════════════════════
//  AUDIO CHIME SYNTHESIZER (WEB AUDIO API)
// ════════════════════════════════════════════════════════════
function playAudioChime(type = 'bell') {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    if (type === 'bell') {
      [659.25, 830.61, 987.77].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.12, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.85);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.9);
      });
    } else if (type === 'complete') {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.14);
        gain.gain.setValueAtTime(0.15, now + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.14 + 0.7);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.14);
        osc.stop(now + idx * 0.14 + 0.75);
      });
    }
  } catch (err) {
    console.warn('Web Audio chime error:', err);
  }
}

// ════════════════════════════════════════════════════════════
//  READING MOTIVATION & STREAK
// ════════════════════════════════════════════════════════════
const READING_QUOTES = [
  { quote: "Aku rela dipenjara asalkan bersama buku, karena dengan buku aku bebas.", author: "Mohammad Hatta" },
  { quote: "Cuma perlu satu buku untuk jatuh cinta pada membaca. Cari buku itu. Mari jatuh cinta.", author: "Najwa Shihab" },
  { quote: "Makin banyak membaca, makin banyak tahu. Makin banyak tempat yang kau tuju.", author: "Dr. Seuss" },
  { quote: "Tahu kau mengapa aku sayangi kau? Karena kau membaca dan kau menulis.", author: "Pramoedya Ananta Toer" },
  { quote: "Membaca adalah bagi pikiran apa artinya olahraga bagi tubuh.", author: "Joseph Addison" },
  { quote: "Buku adalah sahabat paling tenang dan setia, penasihat paling bijak dan guru paling sabar.", author: "Charles W. Eliot" },
  { quote: "Satu jam yang dihabiskan untuk membaca adalah satu jam yang dicuri dari surga.", author: "Thomas Wharton" }
];

function displayRandomReadingQuote() {
  const quoteEl = document.getElementById('reading-quote-text');
  const authorEl = document.getElementById('reading-quote-author');
  if (!quoteEl || !authorEl) return;
  const item = READING_QUOTES[Math.floor(Math.random() * READING_QUOTES.length)];
  quoteEl.textContent = `"${item.quote}"`;
  authorEl.textContent = `— ${item.author}`;
}

function updateReadingStreak() {
  const streakCountEl = document.getElementById('reading-streak-count');
  const todayStatusEl = document.getElementById('today-read-status');
  const todayTextEl = document.getElementById('today-read-text');
  if (!streakCountEl) return;

  const hasReadToday = todayActivities.some(act => {
    const catName = act.categories?.name?.toLowerCase() || '';
    const desc = act.description?.toLowerCase() || '';
    return catName.includes('baca') || catName.includes('buku') || desc.includes('membaca') || desc.includes('baca buku');
  });

  if (hasReadToday) {
    todayStatusEl.classList.add('done');
    todayTextEl.textContent = '✅ Sudah membaca hari ini!';
  } else {
    todayStatusEl.classList.remove('done');
    todayTextEl.textContent = 'Belum membaca hari ini';
  }

  let streak = hasReadToday ? 1 : 0;
  if (recapActivities && recapActivities.length > 0) {
    const readDays = new Set();
    recapActivities.forEach(a => {
      const catName = a.categories?.name?.toLowerCase() || '';
      const desc = a.description?.toLowerCase() || '';
      if (catName.includes('baca') || catName.includes('buku') || desc.includes('membaca')) {
        readDays.add(new Date(a.logged_at).toDateString());
      }
    });

    let checkDate = new Date();
    if (!hasReadToday) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    let count = 0;
    while (readDays.has(checkDate.toDateString())) {
      count++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    streak = count;
  }

  streakCountEl.textContent = `${streak} Hari`;
}

// ════════════════════════════════════════════════════════════
//  READING REMINDER MODULE
// ════════════════════════════════════════════════════════════
const REMINDER_KEY_ENABLED = 'aktivitas_reading_reminder_enabled';
const REMINDER_KEY_TIME = 'aktivitas_reading_reminder_time';
const REMINDER_KEY_LAST_NOTIFIED = 'aktivitas_reading_reminder_last';

let reminderEnabled = localStorage.getItem(REMINDER_KEY_ENABLED) === 'true';
let reminderTime = localStorage.getItem(REMINDER_KEY_TIME) || '20:00';

function initReminderModule() {
  const toggleEl = document.getElementById('reminder-toggle');
  const timeInputEl = document.getElementById('reminder-time');
  const saveBtn = document.getElementById('btn-save-reminder');
  const testBtn = document.getElementById('btn-test-notification');

  if (toggleEl) toggleEl.checked = reminderEnabled;
  if (timeInputEl) timeInputEl.value = reminderTime;

  updateReminderStatusText();

  toggleEl && toggleEl.addEventListener('change', async () => {
    reminderEnabled = toggleEl.checked;
    localStorage.setItem(REMINDER_KEY_ENABLED, reminderEnabled);

    if (reminderEnabled) {
      if ('Notification' in window && Notification.permission !== 'granted') {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          showToast('🔔 Izin notifikasi diaktifkan!', 'success');
        } else {
          showToast('⚠️ Izin notifikasi ditolak oleh browser.', 'error');
        }
      }
    }
    updateReminderStatusText();
    showToast(reminderEnabled ? '✅ Pengingat membaca aktif' : 'Pengingat membaca dinonaktifkan');
  });

  saveBtn && saveBtn.addEventListener('click', () => {
    reminderTime = timeInputEl.value || '20:00';
    localStorage.setItem(REMINDER_KEY_TIME, reminderTime);
    showToast(`💾 Jam pengingat disimpan: pukul ${reminderTime}`, 'success');
    updateReminderStatusText();
  });

  testBtn && testBtn.addEventListener('click', async () => {
    await testReadingNotification();
  });

  if (window.reminderInterval) clearInterval(window.reminderInterval);
  window.reminderInterval = setInterval(checkReadingReminderSchedule, 30000);
}

function updateReminderStatusText() {
  const statusText = document.getElementById('reminder-status-text');
  if (!statusText) return;

  if (!('Notification' in window)) {
    statusText.textContent = 'Browser ini tidak mendukung Web Notifications, tetapi nada & toast pengingat tetap aktif.';
    return;
  }

  if (Notification.permission === 'denied') {
    statusText.textContent = '⚠️ Izin notifikasi browser diblokir. Aktifkan izin di setelan browser untuk menerima pemberitahuan.';
    return;
  }

  if (!reminderEnabled) {
    statusText.textContent = 'Pengingat membaca saat ini MATI. Geser tombol switch di atas untuk mengaktifkan pengingat harian.';
  } else {
    statusText.textContent = `🔔 Pengingat AKTIF setiap hari pukul ${reminderTime}. Notifikasi dan nada akan berbunyi saat waktunya tiba.`;
  }
}

async function testReadingNotification() {
  if ('Notification' in window && Notification.permission !== 'granted') {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') {
      showToast('⚠️ Izin notifikasi belum diizinkan oleh browser.', 'error');
      updateReminderStatusText();
      return;
    }
  }

  playAudioChime('bell');
  showToast('🔔 Tes Notifikasi: Saatnya membaca buku!', 'success');

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        const reg = await navigator.serviceWorker.ready;
        reg.showNotification('Waktunya Membaca Buku! 📚', {
          body: 'Ini adalah contoh pengingat membaca harian. Luangkan waktu sejenak untuk membaca buku favoritmu hari ini!',
          icon: './icons/icon-192.png',
          badge: './icons/icon-192.png'
        });
      } else {
        new Notification('Waktunya Membaca Buku! 📚', {
          body: 'Ini adalah contoh pengingat membaca harian. Luangkan waktu sejenak untuk membaca buku favoritmu hari ini!',
          icon: './icons/icon-192.png'
        });
      }
    } catch (e) {
      console.warn('Notification error:', e);
    }
  }
}

function checkReadingReminderSchedule() {
  if (!reminderEnabled) return;

  const now = new Date();
  const currentHH = String(now.getHours()).padStart(2, '0');
  const currentMM = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${currentHH}:${currentMM}`;
  const todayStr = toLocalDateString(now);

  const lastNotified = localStorage.getItem(REMINDER_KEY_LAST_NOTIFIED);

  if (currentTime === reminderTime && lastNotified !== todayStr) {
    const hasReadToday = todayActivities.some(act => {
      const catName = act.categories?.name?.toLowerCase() || '';
      const desc = act.description?.toLowerCase() || '';
      return catName.includes('baca') || catName.includes('buku') || desc.includes('membaca');
    });

    if (!hasReadToday) {
      localStorage.setItem(REMINDER_KEY_LAST_NOTIFIED, todayStr);
      playAudioChime('bell');
      showToast('📚 Pengingat: Saatnya luangkan waktu membaca buku hari ini!', 'success');

      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then(reg => {
              reg.showNotification('Waktunya Membaca Buku! 📚', {
                body: 'Sudahkah kamu membaca buku hari ini? Buka aplikasi dan mulai sesi fokus membaca!',
                icon: './icons/icon-192.png',
                badge: './icons/icon-192.png'
              });
            });
          } else {
            new Notification('Waktunya Membaca Buku! 📚', {
              body: 'Sudahkah kamu membaca buku hari ini? Buka aplikasi dan mulai sesi fokus membaca!',
              icon: './icons/icon-192.png'
            });
          }
        } catch (e) {
          console.warn('Notification trigger error:', e);
        }
      }
    }
  }
}

// ════════════════════════════════════════════════════════════
//  FOCUS READING TIMER
// ════════════════════════════════════════════════════════════
let timerRunning = false;
let timerPaused = false;
let timerMode = 'preset';
let timerTotalSeconds = 15 * 60;
let timerRemainingSeconds = 15 * 60;
let timerElapsedSeconds = 0;
let timerInterval = null;

function initReadingTimer() {
  const digitsEl = document.getElementById('timer-digits');
  const labelEl = document.getElementById('timer-status-label');
  const startBtn = document.getElementById('btn-timer-start');
  const pauseBtn = document.getElementById('btn-timer-pause');
  const finishBtn = document.getElementById('btn-timer-finish');
  const resetBtn = document.getElementById('btn-timer-reset');
  const presetBtns = document.querySelectorAll('.btn-preset');
  const bookSelect = document.getElementById('timer-book-select');
  const startPageInput = document.getElementById('timer-start-page');
  const endPageInput = document.getElementById('timer-end-page');

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (timerRunning) {
        if (!confirm('Sesi timer sedang berjalan. Ganti durasi dan reset timer?')) return;
        resetTimer();
      }
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const minutes = parseInt(btn.dataset.minutes, 10);
      if (minutes === 0) {
        timerMode = 'stopwatch';
        timerTotalSeconds = 0;
        timerRemainingSeconds = 0;
        timerElapsedSeconds = 0;
        digitsEl.textContent = '00:00';
        labelEl.textContent = 'Mode Stopwatch Bebas';
      } else {
        timerMode = 'preset';
        timerTotalSeconds = minutes * 60;
        timerRemainingSeconds = timerTotalSeconds;
        timerElapsedSeconds = 0;
        digitsEl.textContent = formatTimerDigits(timerRemainingSeconds);
        labelEl.textContent = 'Siap Membaca';
      }
    });
  });

  bookSelect && bookSelect.addEventListener('change', () => {
    const selectedId = bookSelect.value;
    if (selectedId) {
      const book = books.find(b => b.id === selectedId);
      if (book) {
        startPageInput.value = book.current_page || 0;
        if (book.total_pages && book.total_pages > book.current_page) {
          endPageInput.placeholder = `Maks ${book.total_pages}`;
        }
      }
    }
  });

  startBtn && startBtn.addEventListener('click', () => {
    if (!timerRunning) startTimer();
  });

  pauseBtn && pauseBtn.addEventListener('click', () => {
    if (timerRunning) {
      if (timerPaused) resumeTimer();
      else pauseTimer();
    }
  });

  finishBtn && finishBtn.addEventListener('click', () => {
    finishReadingSession();
  });

  resetBtn && resetBtn.addEventListener('click', () => {
    resetTimer();
  });
}

function formatTimerDigits(totalSecs) {
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function startTimer() {
  timerRunning = true;
  timerPaused = false;

  const startBtn = document.getElementById('btn-timer-start');
  const pauseBtn = document.getElementById('btn-timer-pause');
  const finishBtn = document.getElementById('btn-timer-finish');
  const resetBtn = document.getElementById('btn-timer-reset');
  const labelEl = document.getElementById('timer-status-label');

  startBtn.style.display = 'none';
  pauseBtn.style.display = 'inline-flex';
  pauseBtn.textContent = '⏸ Jeda';
  finishBtn.style.display = 'inline-flex';
  resetBtn.style.display = 'inline-flex';
  labelEl.textContent = '📖 Sedang Membaca...';

  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(timerTick, 1000);
}

function pauseTimer() {
  timerPaused = true;
  clearInterval(timerInterval);
  const pauseBtn = document.getElementById('btn-timer-pause');
  const labelEl = document.getElementById('timer-status-label');
  pauseBtn.textContent = '▶ Lanjutkan';
  labelEl.textContent = '⏸ Sesi Dijeda';
}

function resumeTimer() {
  timerPaused = false;
  const pauseBtn = document.getElementById('btn-timer-pause');
  const labelEl = document.getElementById('timer-status-label');
  pauseBtn.textContent = '⏸ Jeda';
  labelEl.textContent = '📖 Sedang Membaca...';
  timerInterval = setInterval(timerTick, 1000);
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerPaused = false;
  timerElapsedSeconds = 0;

  const startBtn = document.getElementById('btn-timer-start');
  const pauseBtn = document.getElementById('btn-timer-pause');
  const finishBtn = document.getElementById('btn-timer-finish');
  const resetBtn = document.getElementById('btn-timer-reset');
  const digitsEl = document.getElementById('timer-digits');
  const labelEl = document.getElementById('timer-status-label');

  startBtn.style.display = 'inline-flex';
  pauseBtn.style.display = 'none';
  finishBtn.style.display = 'none';
  resetBtn.style.display = 'none';

  if (timerMode === 'stopwatch') {
    digitsEl.textContent = '00:00';
    labelEl.textContent = 'Mode Stopwatch Bebas';
  } else {
    timerRemainingSeconds = timerTotalSeconds;
    digitsEl.textContent = formatTimerDigits(timerRemainingSeconds);
    labelEl.textContent = 'Siap Membaca';
  }
}

function timerTick() {
  const digitsEl = document.getElementById('timer-digits');
  const labelEl = document.getElementById('timer-status-label');

  if (timerMode === 'stopwatch') {
    timerElapsedSeconds++;
    digitsEl.textContent = formatTimerDigits(timerElapsedSeconds);
  } else {
    timerElapsedSeconds++;
    timerRemainingSeconds--;
    if (timerRemainingSeconds <= 0) {
      clearInterval(timerInterval);
      digitsEl.textContent = '00:00';
      labelEl.textContent = '🎉 Waktu Membaca Selesai!';
      playAudioChime('complete');
      showToast('🎉 Sesi membaca selesai! Klik "Selesai & Catat" untuk menyimpan.', 'success');
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Sesi Membaca Selesai! 🎉', {
          body: `Hebat! Kamu telah menyelesaikan sesi membaca selama ${Math.round(timerTotalSeconds / 60)} menit. Simpan progresmu sekarang!`,
          icon: './icons/icon-192.png'
        });
      }
      return;
    }
    digitsEl.textContent = formatTimerDigits(timerRemainingSeconds);
  }
}

async function finishReadingSession() {
  const finishBtn = document.getElementById('btn-timer-finish');
  const bookSelect = document.getElementById('timer-book-select');
  const startPageInput = document.getElementById('timer-start-page');
  const endPageInput = document.getElementById('timer-end-page');

  const elapsedMinutes = Math.max(1, Math.round(timerElapsedSeconds / 60));
  const selectedBookId = bookSelect.value;
  const selectedBook = books.find(b => b.id === selectedBookId);

  const startPage = parseInt(startPageInput.value, 10);
  const endPage = parseInt(endPageInput.value, 10);

  let desc = '';
  if (selectedBook) {
    desc = `Membaca "${selectedBook.title}"`;
    if (!isNaN(startPage) && !isNaN(endPage) && endPage > 0) {
      desc += ` hal ${startPage}-${endPage}`;
    } else if (!isNaN(endPage) && endPage > 0) {
      desc += ` hingga hal ${endPage}`;
    }
    desc += ` (${elapsedMinutes} menit)`;
  } else {
    desc = `Membaca buku (${elapsedMinutes} menit)`;
  }

  let bookCat = categories.find(c => {
    const n = c.name.toLowerCase();
    return n.includes('baca') || n.includes('buku');
  });

  finishBtn.disabled = true;
  finishBtn.innerHTML = '<span class="spinner"></span> Menyimpan...';

  try {
    const newAct = await addActivity(desc, bookCat ? bookCat.id : null, new Date());
    todayActivities.unshift(newAct);
    renderTodayList();

    if (selectedBook && !isNaN(endPage) && endPage > 0) {
      const newCurrent = endPage;
      const isFinished = selectedBook.total_pages > 0 && newCurrent >= selectedBook.total_pages;
      await updateBookProgress(selectedBook.id, newCurrent, isFinished ? 'finished' : 'reading');
      await loadBooks();
    }

    playAudioChime('complete');
    showToast(`✅ Aktivitas membaca "${desc}" berhasil dicatat!`, 'success');
    resetTimer();
    updateReadingStreak();
  } catch (err) {
    showToast('Gagal menyimpan aktivitas: ' + err.message, 'error');
  } finally {
    finishBtn.disabled = false;
    finishBtn.innerHTML = '⏹ Selesai & Catat';
  }
}

// ════════════════════════════════════════════════════════════
//  BOOKSHELF & BOOK MANAGEMENT
// ════════════════════════════════════════════════════════════
let books = [];
let activeBookFilter = 'all';
let editingBookId = null;

async function loadBooks() {
  const gridEl = document.getElementById('bookshelf-grid');
  try {
    books = await getBooks();
    renderBookshelf();
    populateBookSelect();
  } catch (err) {
    console.error('Error loadBooks:', err);
    if (gridEl) gridEl.innerHTML = `<div class="empty-state"><span class="empty-icon">⚠️</span><div class="empty-text">Gagal memuat buku</div></div>`;
  }
}

function populateBookSelect() {
  const sel = document.getElementById('timer-book-select');
  if (!sel) return;
  const currentVal = sel.value;
  sel.innerHTML = '<option value="">— Membaca Bebas (Tanpa Buku Khusus) —</option>';
  books.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b.id;
    opt.textContent = `📖 ${b.title}${b.author ? ' — ' + b.author : ''} (${b.current_page || 0}/${b.total_pages || '?'} hal)`;
    sel.appendChild(opt);
  });
  if (currentVal) sel.value = currentVal;
}

function renderBookshelf() {
  const gridEl = document.getElementById('bookshelf-grid');
  if (!gridEl) return;

  const cAll = books.length;
  const cReading = books.filter(b => b.status === 'reading').length;
  const cWishlist = books.filter(b => b.status === 'wishlist').length;
  const cFinished = books.filter(b => b.status === 'finished').length;

  document.getElementById('count-book-all').textContent = cAll;
  document.getElementById('count-book-reading').textContent = cReading;
  document.getElementById('count-book-wishlist').textContent = cWishlist;
  document.getElementById('count-book-finished').textContent = cFinished;

  const filtered = activeBookFilter === 'all'
    ? books
    : books.filter(b => b.status === activeBookFilter);

  if (filtered.length === 0) {
    gridEl.innerHTML = `
      <div class="empty-state fade-in" style="grid-column: 1 / -1">
        <span class="empty-icon">📚</span>
        <div class="empty-text">Tidak ada buku dalam kategori ini</div>
        <div class="empty-sub">Tambahkan buku barumu untuk mulai melacak progres membaca!</div>
      </div>`;
    return;
  }

  gridEl.innerHTML = '';
  filtered.forEach(book => {
    gridEl.appendChild(buildBookCard(book));
  });
}

function buildBookCard(book) {
  const current = book.current_page || 0;
  const total = book.total_pages || 0;
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  const card = document.createElement('div');
  card.className = `book-card fade-in ${book.status}`;
  card.dataset.id = book.id;

  let statusLabel = 'Sedang Dibaca';
  if (book.status === 'wishlist') statusLabel = 'Ingin Dibaca';
  if (book.status === 'finished') statusLabel = 'Selesai';

  card.innerHTML = `
    <div class="book-card-top">
      <div class="book-cover-icon">📖</div>
      <div class="book-info">
        <div class="book-title" title="${escHtml(book.title)}">${escHtml(book.title)}</div>
        <div class="book-author">${book.author ? escHtml(book.author) : 'Penulis tidak diketahui'}</div>
      </div>
      <span class="book-status-tag ${book.status}">${statusLabel}</span>
    </div>

    <div class="book-progress-wrap">
      <div class="book-progress-info">
        <span>Progres: ${current} / ${total > 0 ? total : '?'} hal</span>
        <span>${total > 0 ? pct + '%' : ''}</span>
      </div>
      <div class="book-progress-bar">
        <div class="book-progress-fill" style="width: ${total > 0 ? pct : 0}%"></div>
      </div>
    </div>

    ${book.notes ? `<div class="book-notes-box">"${escHtml(book.notes)}"</div>` : ''}

    <div class="book-actions-row">
      <button type="button" class="btn btn-secondary btn-sm" onclick="startTimerWithBook('${book.id}')" title="Mulai sesi membaca buku ini">
        ▶ Baca
      </button>
      <button type="button" class="btn btn-secondary btn-sm" onclick="openQuickProgressModal('${book.id}')" title="Update halaman terakhir">
        ✏️ Progres
      </button>
      <button type="button" class="btn btn-secondary btn-sm" onclick="openEditBookModal('${book.id}')" title="Edit info buku">
        ⚙️ Edit
      </button>
      <button type="button" class="btn-icon delete" style="padding:6px 8px" onclick="confirmDeleteBook('${book.id}')" title="Hapus buku">
        🗑️
      </button>
    </div>
  `;
  return card;
}

function startTimerWithBook(bookId) {
  const sel = document.getElementById('timer-book-select');
  const startPage = document.getElementById('timer-start-page');
  const endPage = document.getElementById('timer-end-page');
  if (sel) {
    sel.value = bookId;
    const b = books.find(item => item.id === bookId);
    if (b) {
      startPage.value = b.current_page || 0;
      endPage.value = '';
    }
  }
  document.getElementById('timer-digits')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  showToast('📖 Buku dipilih di timer membaca!', 'success');
}

function openAddBookModal() {
  editingBookId = null;
  document.getElementById('modal-book-title').textContent = '📚 Tambah Buku Baru';
  document.getElementById('book-id').value = '';
  document.getElementById('book-title').value = '';
  document.getElementById('book-author').value = '';
  document.getElementById('book-current-page').value = '0';
  document.getElementById('book-total-pages').value = '';
  document.getElementById('book-status').value = 'reading';
  document.getElementById('book-notes').value = '';
  document.getElementById('modal-book').classList.add('visible');
  document.getElementById('book-title').focus();
}

function openEditBookModal(bookId) {
  const book = books.find(b => b.id === bookId);
  if (!book) return;
  editingBookId = bookId;
  document.getElementById('modal-book-title').textContent = '✏️ Edit Buku';
  document.getElementById('book-id').value = book.id;
  document.getElementById('book-title').value = book.title;
  document.getElementById('book-author').value = book.author || '';
  document.getElementById('book-current-page').value = book.current_page || 0;
  document.getElementById('book-total-pages').value = book.total_pages || '';
  document.getElementById('book-status').value = book.status || 'reading';
  document.getElementById('book-notes').value = book.notes || '';
  document.getElementById('modal-book').classList.add('visible');
}

function closeBookModal() {
  document.getElementById('modal-book').classList.remove('visible');
  editingBookId = null;
}

function openQuickProgressModal(bookId) {
  const book = books.find(b => b.id === bookId);
  if (!book) return;
  document.getElementById('quick-book-id').value = book.id;
  document.getElementById('quick-book-title').textContent = `Buku: "${book.title}" (Total: ${book.total_pages || '?'} halaman)`;
  document.getElementById('quick-current-page').value = book.current_page || 0;
  document.getElementById('quick-page-hint').textContent = `Total Halaman: ${book.total_pages || 'tidak ditentukan'}`;
  document.getElementById('modal-quick-progress').classList.add('visible');
  document.getElementById('quick-current-page').focus();
}

function closeQuickProgressModal() {
  document.getElementById('modal-quick-progress').classList.remove('visible');
}

async function confirmDeleteBook(bookId) {
  const book = books.find(b => b.id === bookId);
  if (!confirm(`Hapus buku "${book ? book.title : ''}" dari rak buku?`)) return;
  try {
    await deleteBook(bookId);
    books = books.filter(b => b.id !== bookId);
    renderBookshelf();
    populateBookSelect();
    showToast('🗑️ Buku berhasil dihapus', 'success');
  } catch (err) {
    showToast('Gagal menghapus buku: ' + err.message, 'error');
  }
}

// ════════════════════════════════════════════════════════════
//  DATABASE STATUS & ANTI-PAUSE MODAL
// ════════════════════════════════════════════════════════════
let lastPingResult = null;

async function checkDbStatus() {
  const pill = document.getElementById('btn-db-status');
  const textEl = document.getElementById('db-status-text');
  if (!pill) return;

  pill.className = 'db-status-pill checking';
  textEl.textContent = 'Cek DB...';

  const res = await pingDatabase();
  lastPingResult = res;

  if (res.success) {
    pill.className = 'db-status-pill online';
    textEl.textContent = 'DB Online';
  } else {
    pill.className = 'db-status-pill offline';
    textEl.textContent = 'DB Offline';
  }
  updateDbModalDetails();
}

function updateDbModalDetails() {
  const dotEl = document.getElementById('db-modal-dot');
  const stateEl = document.getElementById('db-modal-state');
  const latencyEl = document.getElementById('db-modal-latency');
  const logEl = document.getElementById('db-last-ping-time');

  if (!stateEl) return;

  if (!lastPingResult) {
    stateEl.textContent = 'Belum diperiksa';
    latencyEl.textContent = 'Latency: — ms';
    return;
  }

  if (lastPingResult.success) {
    dotEl?.classList.remove('offline');
    stateEl.textContent = 'Database Terhubung & Aktif';
    stateEl.style.color = 'var(--success)';
    latencyEl.textContent = `Latency: ${lastPingResult.latency} ms • Status: OK (200)`;
  } else {
    dotEl?.classList.add('offline');
    stateEl.textContent = 'Database Tidak Terjangkau / Ter-pause';
    stateEl.style.color = 'var(--danger)';
    latencyEl.textContent = `Error: ${lastPingResult.error || 'Connection Failed'}`;
  }

  const timeStr = lastPingResult.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = lastPingResult.timestamp.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  logEl.textContent = `${dateStr} pukul ${timeStr} (${lastPingResult.latency} ms)`;
}

function openDbStatusModal() {
  document.getElementById('modal-db-status')?.classList.add('visible');
  updateDbModalDetails();
}

function closeDbStatusModal() {
  document.getElementById('modal-db-status')?.classList.remove('visible');
}

// ════════════════════════════════════════════════════════════
//  INITIALIZE READING FEATURE & EVENT LISTENERS
// ════════════════════════════════════════════════════════════
async function loadReadingPage() {
  displayRandomReadingQuote();
  updateReadingStreak();
  await loadBooks();
}

function initReadingFeature() {
  initReminderModule();
  initReadingTimer();
  displayRandomReadingQuote();

  // Tombol tambah buku
  document.getElementById('btn-open-add-book')?.addEventListener('click', openAddBookModal);
  document.getElementById('btn-modal-book-close')?.addEventListener('click', closeBookModal);
  document.getElementById('modal-book')?.addEventListener('click', e => {
    if (e.target === document.getElementById('modal-book')) closeBookModal();
  });

  // Tombol update cepat progres
  document.getElementById('btn-modal-quick-close')?.addEventListener('click', closeQuickProgressModal);
  document.getElementById('modal-quick-progress')?.addEventListener('click', e => {
    if (e.target === document.getElementById('modal-quick-progress')) closeQuickProgressModal();
  });

  // Database status button & modal
  document.getElementById('btn-db-status')?.addEventListener('click', openDbStatusModal);
  document.getElementById('btn-modal-db-close')?.addEventListener('click', closeDbStatusModal);
  document.getElementById('btn-modal-db-done')?.addEventListener('click', closeDbStatusModal);
  document.getElementById('modal-db-status')?.addEventListener('click', e => {
    if (e.target === document.getElementById('modal-db-status')) closeDbStatusModal();
  });

  // Manual Ping button
  document.getElementById('btn-ping-db-now')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-ping-db-now');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Mem-ping...';
    await checkDbStatus();
    btn.disabled = false;
    btn.innerHTML = '⚡ Ping Database Sekarang';
    showToast(lastPingResult && lastPingResult.success ? '⚡ Database berhasil di-ping!' : '⚠️ Gagal mem-ping database', lastPingResult?.success ? 'success' : 'error');
  });

  // Form submit: Buku baru/edit
  document.getElementById('book-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('book-id').value;
    const title = document.getElementById('book-title').value.trim();
    const author = document.getElementById('book-author').value.trim();
    const currentPage = parseInt(document.getElementById('book-current-page').value, 10) || 0;
    const totalPages = parseInt(document.getElementById('book-total-pages').value, 10) || 0;
    const status = document.getElementById('book-status').value;
    const notes = document.getElementById('book-notes').value.trim();

    if (!title) {
      showToast('Judul buku wajib diisi!', 'error');
      return;
    }

    const btn = document.getElementById('btn-save-book');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';

    try {
      if (id) {
        await updateBook(id, { title, author, current_page: currentPage, total_pages: totalPages, status, notes });
        showToast('📖 Buku berhasil diperbarui!', 'success');
      } else {
        await addBook({ title, author, current_page: currentPage, total_pages: totalPages, status, notes });
        showToast('🎉 Buku baru ditambahkan ke rak!', 'success');
      }
      closeBookModal();
      await loadBooks();
    } catch (err) {
      showToast('Gagal menyimpan buku: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Simpan Buku';
    }
  });

  // Form submit: Quick Progress
  document.getElementById('quick-progress-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const bookId = document.getElementById('quick-book-id').value;
    const newPage = parseInt(document.getElementById('quick-current-page').value, 10) || 0;
    const book = books.find(b => b.id === bookId);

    const btn = document.getElementById('btn-save-quick-progress');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';

    try {
      const isFinished = book && book.total_pages > 0 && newPage >= book.total_pages;
      await updateBookProgress(bookId, newPage, isFinished ? 'finished' : (book?.status || 'reading'));
      closeQuickProgressModal();
      await loadBooks();
      showToast(`✅ Progres diperbarui ke halaman ${newPage}!`, 'success');
    } catch (err) {
      showToast('Gagal update progres: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Simpan Progress';
    }
  });

  // Filter tabs buku
  document.querySelectorAll('.book-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.book-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeBookFilter = btn.dataset.filter;
      renderBookshelf();
    });
  });
}

// ─── SERVICE WORKER ───────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// ─── INIT ─────────────────────────────────────────────────
async function init() {
  try {
    await loadCategories();
    await loadToday();
    initReadingFeature();
    checkDbStatus();
  } catch (e) {
    // Error handled inside each loader
  }
}

init();
