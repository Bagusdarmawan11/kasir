-- ============================================================================
-- WARUNG KASIR - Tabel App Settings (key-value)
-- Dipakai untuk menyimpan konfigurasi yang bisa diubah dari UI
-- (contoh: nomor target Fonnte, jadwal laporan)
-- ============================================================================
create table if not exists app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table app_settings enable row level security;

-- Hanya owner yang bisa baca & tulis
create policy "owner can manage settings" on app_settings
  for all using (get_my_role() = 'owner')
  with check (get_my_role() = 'owner');

-- Insert nilai default
insert into app_settings (key, value) values
  ('fonnte_target', ''),
  ('report_schedule_utc_hour', '17')
on conflict (key) do nothing;

-- Tambah key jadwal WIB bebas (format HH:MM)
insert into app_settings (key, value) values
  ('report_schedule_wib', '00:00')
on conflict (key) do nothing;

-- Tambah key mode laporan
insert into app_settings (key, value) values
  ('report_mode', 'today'),
  ('report_days_ago', '0')
on conflict (key) do nothing;

-- Fitur baru pengaturan owner
insert into app_settings (key, value) values
  ('nama_warung', ''),
  ('laporan_mingguan', 'true'),
  ('laporan_bulanan', 'true'),
  ('notif_stok_habis', 'false'),
  ('template_laporan', '')
on conflict (key) do nothing;
