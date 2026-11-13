// ============================================================
//  KONFIGURASI SUPABASE
//  Isi SUPABASE_URL dan SUPABASE_ANON_KEY dari dashboard Supabase-mu
//  Settings → API → Project URL & anon public key
// ============================================================

const SUPABASE_URL = 'https://gcakfwokwtgidaddieif.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjYWtmd29rd3RnaWRhZGRpZWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5MjI2NDQsImV4cCI6MjA5OTQ5ODY0NH0.K6o2T1qQSVV5FtyuUGYzyqEUL-qvfq5gGof8IG3lr3A';

// Inisialisasi client Supabase
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
//  HELPER: CATEGORIES
// ============================================================

async function getCategories() {
  const { data, error } = await db
    .from('categories')
    .select('*')
    .order('is_default', { ascending: false })
    .order('name');
  if (error) throw error;
  return data;
}

async function addCategory(name, color, icon) {
  const { data, error } = await db
    .from('categories')
    .insert([{ name, color, icon, is_default: false }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteCategory(id) {
  const { error } = await db
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('is_default', false);
  if (error) throw error;
}

// ============================================================
//  HELPER: ACTIVITIES
// ============================================================

async function getActivitiesForDate(date) {
  // date: objek Date, ambil semua aktivitas pada hari itu
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const { data, error } = await db
    .from('activities')
    .select(`*, categories(id, name, color, icon)`)
    .gte('logged_at', start.toISOString())
    .lte('logged_at', end.toISOString())
    .order('logged_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function getActivitiesForMonth(year, month) {
  // month: 0-indexed (Januari = 0)
  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const { data, error } = await db
    .from('activities')
    .select(`*, categories(id, name, color, icon)`)
    .gte('logged_at', start.toISOString())
    .lte('logged_at', end.toISOString())
    .order('logged_at', { ascending: true });
  if (error) throw error;
  return data;
}

async function addActivity(description, categoryId, loggedAt) {
  const { data, error } = await db
    .from('activities')
    .insert([{
      description,
      category_id: categoryId || null,
      logged_at: loggedAt.toISOString()
    }])
    .select(`*, categories(id, name, color, icon)`)
    .single();
  if (error) throw error;
  return data;
}

async function updateActivity(id, description, categoryId, loggedAt) {
  const { data, error } = await db
    .from('activities')
    .update({
      description,
      category_id: categoryId || null,
      logged_at: loggedAt.toISOString()
    })
    .eq('id', id)
    .select(`*, categories(id, name, color, icon)`)
    .single();
  if (error) throw error;
  return data;
}

async function deleteActivity(id) {
  const { error } = await db
    .from('activities')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ============================================================
//  HELPER: DATABASE HEALTH & KEEP-ALIVE PING
// ============================================================

async function pingDatabase() {
  const startTime = performance.now();
  try {
    const { data, error } = await db
      .from('categories')
      .select('id')
      .limit(1);
    const latency = Math.round(performance.now() - startTime);
    if (error) throw error;
    return { success: true, latency, timestamp: new Date() };
  } catch (err) {
    const latency = Math.round(performance.now() - startTime);
    return { success: false, latency, error: err.message, timestamp: new Date() };
  }
}

// ============================================================
//  HELPER: BOOKS (DENGAN LOCALSTORAGE FALLBACK)
// ============================================================

const LOCAL_STORAGE_BOOKS_KEY = 'aktivitas_reading_books_v1';

function getLocalBooks() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_BOOKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Gagal membaca buku dari localStorage:', e);
    return [];
  }
}

function saveLocalBooks(books) {
  try {
    localStorage.setItem(LOCAL_STORAGE_BOOKS_KEY, JSON.stringify(books));
  } catch (e) {
    console.warn('Gagal menyimpan buku ke localStorage:', e);
  }
}

async function getBooks() {
  try {
    const { data, error } = await db
      .from('books')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    // Simpan salinan ke localStorage sebagai backup offline
    saveLocalBooks(data || []);
    return data || [];
  } catch (err) {
    // Fallback jika tabel books belum dibuat di Supabase atau offline
    console.info('Menggunakan penyimpanan lokal untuk buku (Tabel Supabase belum dibuat atau offline):', err.message);
    return getLocalBooks();
  }
}

async function addBook(bookData) {
  const newBook = {
    title: bookData.title,
    author: bookData.author || '',
    total_pages: parseInt(bookData.total_pages, 10) || 0,
    current_page: parseInt(bookData.current_page, 10) || 0,
    status: bookData.status || 'reading',
    notes: bookData.notes || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await db
      .from('books')
      .insert([newBook])
      .select()
      .single();
    if (error) throw error;

    // Sinkronkan ke local
    const local = getLocalBooks();
    local.unshift(data);
    saveLocalBooks(local);
    return data;
  } catch (err) {
    // Simpan lokal
    newBook.id = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const local = getLocalBooks();
    local.unshift(newBook);
    saveLocalBooks(local);
    return newBook;
  }
}

async function updateBook(id, bookData) {
  const updatePayload = {
    title: bookData.title,
    author: bookData.author || '',
    total_pages: parseInt(bookData.total_pages, 10) || 0,
    current_page: parseInt(bookData.current_page, 10) || 0,
    status: bookData.status || 'reading',
    notes: bookData.notes || '',
    updated_at: new Date().toISOString()
  };

  try {
    if (!String(id).startsWith('local_')) {
      const { data, error } = await db
        .from('books')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        const local = getLocalBooks();
        const idx = local.findIndex(b => b.id === id);
        if (idx !== -1) local[idx] = data;
        saveLocalBooks(local);
        return data;
      }
    }
    throw new Error('Fallback ke lokal');
  } catch (err) {
    const local = getLocalBooks();
    const idx = local.findIndex(b => b.id === id);
    if (idx !== -1) {
      local[idx] = { ...local[idx], ...updatePayload };
      saveLocalBooks(local);
      return local[idx];
    }
    throw err;
  }
}

async function updateBookProgress(id, currentPage, newStatus = null) {
  const current = parseInt(currentPage, 10) || 0;
  const updatePayload = {
    current_page: current,
    updated_at: new Date().toISOString()
  };
  if (newStatus) updatePayload.status = newStatus;

  try {
    if (!String(id).startsWith('local_')) {
      const { data, error } = await db
        .from('books')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        const local = getLocalBooks();
        const idx = local.findIndex(b => b.id === id);
        if (idx !== -1) local[idx] = data;
        saveLocalBooks(local);
        return data;
      }
    }
    throw new Error('Fallback ke lokal');
  } catch (err) {
    const local = getLocalBooks();
    const idx = local.findIndex(b => b.id === id);
    if (idx !== -1) {
      local[idx] = { ...local[idx], ...updatePayload };
      saveLocalBooks(local);
      return local[idx];
    }
    throw err;
  }
}

async function deleteBook(id) {
  try {
    if (!String(id).startsWith('local_')) {
      const { error } = await db
        .from('books')
        .delete()
        .eq('id', id);
      if (error) console.warn('Supabase delete error:', error);
    }
  } catch (err) {
    console.warn('Gagal hapus dari Supabase:', err.message);
  }
  const local = getLocalBooks().filter(b => b.id !== id);
  saveLocalBooks(local);
}
