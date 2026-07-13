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
