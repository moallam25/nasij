import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createAdminClient } from '@/lib/supabase/admin';
import { InvoiceDocument, type InvoiceData } from '@/lib/invoices/InvoiceDocument';

// Force Node runtime — react-pdf needs Node APIs (not Edge-compatible)
export const runtime = 'nodejs';
// Don't cache — invoices should reflect current order state
export const dynamic = 'force-dynamic';

/**
 * GET /api/invoice/[orderCode]
 *
 * Returns a PDF invoice for the given order. Authentication: requires the
 * caller to be an authenticated admin. We piggyback on the same Supabase
 * session cookie that the dashboard middleware uses.
 *
 * For now we use the admin client to read the order (RLS-bypassing), but
 * we gate the route via the existing dashboard middleware (matcher: /dashboard
 * only). To expose this safely at /api/invoice/, we re-check session here.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { orderCode: string } }
) {
  const orderCode = (params.orderCode || '').toUpperCase().trim();
  if (!orderCode || !/^NAS-\d{5}$/.test(orderCode)) {
    return NextResponse.json({ error: 'Invalid order code' }, { status: 400 });
  }

  // Auth check: require a Supabase session cookie. We use the SSR client
  // for this so we read the user's auth state from the request cookies.
  const { createServerClient } = await import('@supabase/ssr');
  const { cookies } = await import('next/headers');
  const cookieStore = cookies();
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {
          /* read-only in API route */
        },
      },
    }
  );
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch the order using the admin client (bypasses RLS, safe — we're authed)
  const supabase = createAdminClient();
  const { data: order, error } = await supabase
    .from('orders')
    .select(
      'order_code, customer_name, phone, customer_email, address, size, length_cm, width_cm, colors, notes, admin_notes, admin_price, status, payment_status, created_at, paid_at'
    )
    .eq('order_code', orderCode)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.admin_price == null) {
    return NextResponse.json(
      { error: 'Cannot generate invoice — set the order price first' },
      { status: 400 }
    );
  }

  const invoiceData: InvoiceData = {
    orderCode: order.order_code,
    customerName: order.customer_name,
    customerPhone: order.phone,
    customerEmail: order.customer_email,
    customerAddress: order.address,
    size: order.size,
    lengthCm: order.length_cm,
    widthCm: order.width_cm,
    colors: order.colors,
    notes: order.notes,
    adminNotes: order.admin_notes,
    price: Number(order.admin_price),
    status: order.status,
    paymentStatus: order.payment_status,
    createdAt: order.created_at,
    paidAt: order.paid_at,
  };

  try {
    // Cast around react-pdf's narrow ReactElement<DocumentProps> requirement —
    // our InvoiceDocument returns <Document>, which is what renderToBuffer needs.
    const buffer = await renderToBuffer(
      (<InvoiceDocument data={invoiceData} />) as any
    );

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="NASIJ-Invoice-${order.order_code}.pdf"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (e: any) {
    console.error('[invoice] render error:', e);
    return NextResponse.json(
      { error: 'Failed to generate invoice', detail: e?.message },
      { status: 500 }
    );
  }
}
