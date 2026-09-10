import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendWhatsAppMessage } from '@/lib/fonnte';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const { data: roleRow } = await supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle();
  if (!roleRow || roleRow.role !== 'owner') {
    return NextResponse.json({ ok: false, error: 'Hanya owner' }, { status: 403 });
  }

  // Ambil produk stok habis
  const { data: products } = await supabase
    .from('product_stock_summary')
    .select('name, code, stok')
    .lte('stok', 0)
    .order('name');

  if (!products || products.length === 0) {
    return NextResponse.json({ ok: true, count: 0, message: 'Tidak ada produk stok habis' });
  }

  const namaWarung = process.env.NEXT_PUBLIC_NAMA_WARUNG || 'Warung Saya';
  const list = products.map((p) => `• ${p.name} (${p.code})`).join('\n');
  const message = `⚠️ *STOK HABIS - ${namaWarung}*\n\nBerikut produk yang stoknya habis:\n\n${list}\n\nSegera lakukan restock!`;

  const result = await sendWhatsAppMessage(message);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error });

  return NextResponse.json({ ok: true, count: products.length });
}
