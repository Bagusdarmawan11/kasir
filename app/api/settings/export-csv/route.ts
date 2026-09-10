import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const { data: roleRow } = await supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle();
  if (!roleRow || roleRow.role !== 'owner') {
    return NextResponse.json({ ok: false, error: 'Hanya owner' }, { status: 403 });
  }

  // Export semua transaksi penjualan
  const { data: sales } = await supabase
    .from('sales')
    .select('sold_at, product_name_snapshot, qty, unit_price, unit_cost, total, buyer_name')
    .order('sold_at', { ascending: false });

  if (!sales) return NextResponse.json({ ok: false, error: 'Gagal ambil data' }, { status: 500 });

  const rows = [
    ['Tanggal', 'Produk', 'Qty', 'Harga Jual', 'Harga Modal', 'Total', 'Pembeli'],
    ...sales.map((s) => [
      new Date(s.sold_at).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' }),
      s.product_name_snapshot,
      s.qty,
      s.unit_price,
      s.unit_cost,
      s.total,
      s.buyer_name || '',
    ]),
  ];

  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const date = new Date().toLocaleDateString('sv', { timeZone: 'Asia/Jakarta' });

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="transaksi-${date}.csv"`,
    },
  });
}
