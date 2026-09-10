import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildReportMessage } from '@/lib/reporting';
import { sendWhatsAppMessage } from '@/lib/fonnte';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const { data: roleRow } = await supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle();
  if (!roleRow || roleRow.role !== 'owner') {
    return NextResponse.json({ ok: false, error: 'Hanya owner yang bisa mengirim laporan manual' }, { status: 403 });
  }

  const namaWarung = process.env.NEXT_PUBLIC_NAMA_WARUNG || 'Warung Saya';

  // Baca mode laporan dari database (sama seperti cron otomatis)
  let mode = 'today';
  let daysAgo = 0;
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceKey) {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/app_settings?key=in.(report_mode,report_days_ago)&select=key,value`,
        { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
      );
      if (res.ok) {
        const rows = await res.json();
        const modeRow = rows.find((r: any) => r.key === 'report_mode');
        const daysRow = rows.find((r: any) => r.key === 'report_days_ago');
        if (modeRow?.value) mode = modeRow.value;
        if (daysRow?.value) daysAgo = parseInt(daysRow.value) || 0;
      }
    }
  } catch { /* pakai default today */ }

  // Hitung tanggal target berdasarkan mode
  const nowWib = new Date(Date.now() + 7 * 3600 * 1000);
  const todayStr = nowWib.toISOString().slice(0, 10);

  function addDays(dateStr: string, n: number) {
    const d = new Date(dateStr + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }

  const targetDate = mode === 'yesterday'
    ? addDays(todayStr, -1)
    : mode === 'custom'
    ? addDays(todayStr, -daysAgo)
    : todayStr;

  const targetLabel = new Date(targetDate + 'T00:00:00Z').toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  const period = { kind: 'harian' as const, label: targetLabel, startDate: targetDate, endDate: targetDate };

  try {
    const message = await buildReportMessage(period, namaWarung);
    const result = await sendWhatsAppMessage(message);
    if (!result.ok) return NextResponse.json({ ok: false, error: result.error });
    return NextResponse.json({ ok: true, date: targetDate, mode });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
