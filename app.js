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
  document.getElementById(`page-${tabId}`).classList.add('active');
  document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

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
  } catch (e) {
    // Error handled inside each loader
  }
}

init();
