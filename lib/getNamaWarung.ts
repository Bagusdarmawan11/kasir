// Helper: baca nama warung dari DB, fallback ke env var
export async function getNamaWarung(): Promise<string> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      const res = await fetch(
        `${url}/rest/v1/app_settings?key=eq.nama_warung&select=value`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` }, next: { revalidate: 60 } }
      );
      if (res.ok) {
        const rows = await res.json();
        if (rows?.[0]?.value?.trim()) return rows[0].value.trim();
      }
    }
  } catch {}
  return process.env.NEXT_PUBLIC_NAMA_WARUNG || 'Warung Saya';
}
