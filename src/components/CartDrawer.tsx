'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, Plus, Minus, ChevronLeft, CheckCircle2, Copy } from 'lucide-react';
import { useCart } from '@/lib/cart/context';
import { GOVERNORATES, calcShipping } from '@/lib/shipping';
import { submitOrder } from '@/lib/actions/orders';

type View = 'cart' | 'checkout' | 'success';

const PAYMENT_METHODS = [
  { id: 'vodafone_cash', label: 'فودافون كاش', en: 'Vodafone Cash' },
  { id: 'instapay',      label: 'إنستاباي',     en: 'InstaPay' },
  { id: 'cod',           label: 'الدفع عند الاستلام', en: 'Cash on Delivery' },
];

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, count, subtotal, removeItem, updateQty, clear } = useCart();
  const [view, setView]             = useState<View>('cart');
  const [orderCode, setOrderCode]   = useState('');
  const [copied, setCopied]         = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  // Checkout form state
  const [name,      setName]      = useState('');
  const [phone,     setPhone]     = useState('');
  const [email,     setEmail]     = useState('');
  const [govId,     setGovId]     = useState('');
  const [address,   setAddress]   = useState('');
  const [payment,   setPayment]   = useState('vodafone_cash');

  const shipping = govId ? calcShipping(govId, subtotal) : 0;
  const total    = subtotal + shipping;

  const handleClose = () => {
    onClose();
    // Reset to cart view after close animation
    setTimeout(() => { setView('cart'); setError(''); }, 350);
  };

  const handleCheckout = async () => {
    if (!name.trim() || !phone.trim() || !govId || !address.trim()) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    setError('');
    setSubmitting(true);

    const cartSummary = items
      .map((i) => `${i.nameAr} (${i.qty}x) — ${(i.price * i.qty).toLocaleString('ar-EG')} ج.م`)
      .join('\n');

    const gov = GOVERNORATES.find((g) => g.id === govId);
    const fullAddress = `${gov?.nameAr ?? govId} — ${address}`;

    const res = await submitOrder({
      customer_name:  name,
      phone,
      customer_email: email || null,
      address:        fullAddress,
      payment_method: payment,
      notes: `[طلب من المتجر]\n${cartSummary}\n\nالإجمالي: ${subtotal.toLocaleString('ar-EG')} ج.م\nالشحن: ${shipping} ج.م\nالمجموع الكلي: ${total.toLocaleString('ar-EG')} ج.م`,
    });

    setSubmitting(false);

    if (!res.ok) {
      setError(res.error ?? 'حدث خطأ، يرجى المحاولة مرة أخرى');
      return;
    }

    setOrderCode(res.orderCode);
    clear();
    setView('success');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(orderCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-nasij-ink/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 38 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-nasij-cream shadow-2xl flex flex-col"
            dir="rtl"
          >
            {/* ── CART VIEW ── */}
            {view === 'cart' && (
              <>
                <div className="flex items-center justify-between p-6 border-b border-nasij-accent/20">
                  <h2 className="display-heading text-2xl text-nasij-primary">
                    سلة التسوق
                    {count > 0 && (
                      <span className="mr-2 text-sm font-normal text-nasij-ink/50">({count})</span>
                    )}
                  </h2>
                  <button onClick={handleClose} className="p-2 text-nasij-primary hover:bg-nasij-secondary/40 rounded-full transition-colors">
                    <X size={22} />
                  </button>
                </div>

                {items.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-4 text-nasij-ink/40">
                    <ShoppingBag size={56} strokeWidth={1} />
                    <p className="text-sm">السلة فارغة</p>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {items.map((item) => (
                        <div key={`${item.id}-${item.size}`} className="flex gap-4 items-start">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.nameAr}
                              className="w-20 h-20 rounded-xl object-cover shrink-0 border border-nasij-accent/20"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-xl bg-nasij-secondary/50 shrink-0 flex items-center justify-center">
                              <ShoppingBag size={24} className="text-nasij-accent/50" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-nasij-primary text-sm leading-snug">{item.nameAr}</p>
                            {item.size && (
                              <p className="text-xs text-nasij-ink/50 mt-0.5">{item.size}</p>
                            )}
                            <p className="text-nasij-accent-dark font-semibold mt-1 text-sm">
                              {(item.price * item.qty).toLocaleString('ar-EG')} ج.م
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => updateQty(item.id, item.qty - 1)}
                                className="w-7 h-7 rounded-full border border-nasij-accent/30 flex items-center justify-center text-nasij-primary hover:bg-nasij-secondary/60 transition-colors"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="text-sm font-medium w-5 text-center">{item.qty}</span>
                              <button
                                onClick={() => updateQty(item.id, item.qty + 1)}
                                className="w-7 h-7 rounded-full border border-nasij-accent/30 flex items-center justify-center text-nasij-primary hover:bg-nasij-secondary/60 transition-colors"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1.5 text-nasij-ink/30 hover:text-red-500 transition-colors shrink-0"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="p-6 border-t border-nasij-accent/20 space-y-4">
                      <div className="flex justify-between text-sm text-nasij-ink/70">
                        <span>المجموع الفرعي</span>
                        <span className="font-medium text-nasij-primary">{subtotal.toLocaleString('ar-EG')} ج.م</span>
                      </div>
                      <p className="text-xs text-nasij-ink/40">رسوم الشحن تُحسب في الخطوة التالية</p>
                      <button
                        onClick={() => setView('checkout')}
                        className="w-full btn-primary justify-center text-base py-3"
                      >
                        متابعة الشراء
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* ── CHECKOUT VIEW ── */}
            {view === 'checkout' && (
              <>
                <div className="flex items-center gap-3 p-6 border-b border-nasij-accent/20">
                  <button onClick={() => { setView('cart'); setError(''); }} className="p-1.5 text-nasij-primary hover:bg-nasij-secondary/40 rounded-full transition-colors">
                    <ChevronLeft size={20} />
                  </button>
                  <h2 className="display-heading text-2xl text-nasij-primary flex-1">تفاصيل الطلب</h2>
                  <button onClick={handleClose} className="p-2 text-nasij-primary hover:bg-nasij-secondary/40 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  {/* Order summary mini */}
                  <div className="bg-nasij-secondary/40 rounded-xl p-4 space-y-2">
                    {items.map((item) => (
                      <div key={`${item.id}-${item.size}`} className="flex justify-between text-sm">
                        <span className="text-nasij-ink/70">{item.nameAr} × {item.qty}</span>
                        <span className="font-medium text-nasij-primary">{(item.price * item.qty).toLocaleString('ar-EG')} ج.م</span>
                      </div>
                    ))}
                  </div>

                  {/* Customer info */}
                  <div className="space-y-3">
                    <label className="block text-xs text-nasij-ink/50 uppercase tracking-wide">بيانات التواصل</label>
                    <input
                      type="text"
                      placeholder="الاسم الكامل *"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-nasij-accent/30 bg-white text-sm text-nasij-ink placeholder:text-nasij-ink/40 focus:outline-none focus:border-nasij-primary transition-colors"
                    />
                    <input
                      type="tel"
                      placeholder="رقم الهاتف * (مثل +201xxxxxxxxx)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-nasij-accent/30 bg-white text-sm text-nasij-ink placeholder:text-nasij-ink/40 focus:outline-none focus:border-nasij-primary transition-colors"
                    />
                    <input
                      type="email"
                      placeholder="البريد الإلكتروني (اختياري)"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-nasij-accent/30 bg-white text-sm text-nasij-ink placeholder:text-nasij-ink/40 focus:outline-none focus:border-nasij-primary transition-colors"
                    />
                  </div>

                  {/* Shipping */}
                  <div className="space-y-3">
                    <label className="block text-xs text-nasij-ink/50 uppercase tracking-wide">عنوان التوصيل</label>
                    <select
                      value={govId}
                      onChange={(e) => setGovId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-nasij-accent/30 bg-white text-sm text-nasij-ink focus:outline-none focus:border-nasij-primary transition-colors appearance-none"
                    >
                      <option value="">اختر المحافظة *</option>
                      {GOVERNORATES.map((g) => (
                        <option key={g.id} value={g.id}>{g.nameAr}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="العنوان التفصيلي *"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-nasij-accent/30 bg-white text-sm text-nasij-ink placeholder:text-nasij-ink/40 focus:outline-none focus:border-nasij-primary transition-colors"
                    />
                    {govId && (
                      <p className="text-xs text-nasij-ink/50">
                        رسوم الشحن: <span className="font-semibold text-nasij-primary">{shipping} ج.م</span>
                      </p>
                    )}
                  </div>

                  {/* Payment */}
                  <div className="space-y-3">
                    <label className="block text-xs text-nasij-ink/50 uppercase tracking-wide">طريقة الدفع</label>
                    <div className="grid grid-cols-1 gap-2">
                      {PAYMENT_METHODS.map((m) => (
                        <label
                          key={m.id}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
                            payment === m.id
                              ? 'border-nasij-primary bg-nasij-secondary/40'
                              : 'border-nasij-accent/30 bg-white hover:border-nasij-primary/40'
                          }`}
                        >
                          <input
                            type="radio"
                            name="payment"
                            value={m.id}
                            checked={payment === m.id}
                            onChange={() => setPayment(m.id)}
                            className="accent-nasij-primary"
                          />
                          <div>
                            <p className="text-sm font-medium text-nasij-primary">{m.label}</p>
                            <p className="text-[11px] text-nasij-ink/40">{m.en}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
                  )}
                </div>

                {/* Order total + submit */}
                <div className="p-6 border-t border-nasij-accent/20 space-y-4">
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-nasij-ink/60">
                      <span>المجموع الفرعي</span>
                      <span>{subtotal.toLocaleString('ar-EG')} ج.م</span>
                    </div>
                    <div className="flex justify-between text-nasij-ink/60">
                      <span>الشحن</span>
                      <span>{govId ? `${shipping} ج.م` : '—'}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-nasij-primary text-base pt-1 border-t border-nasij-accent/20">
                      <span>الإجمالي</span>
                      <span>{govId ? `${total.toLocaleString('ar-EG')} ج.م` : `${subtotal.toLocaleString('ar-EG')} ج.م`}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleCheckout}
                    disabled={submitting}
                    className="w-full btn-primary justify-center text-base py-3 disabled:opacity-60"
                  >
                    {submitting ? 'جاري الإرسال...' : 'تأكيد الطلب'}
                  </button>
                </div>
              </>
            )}

            {/* ── SUCCESS VIEW ── */}
            {view === 'success' && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-6">
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                >
                  <CheckCircle2 size={72} className="text-emerald-500" strokeWidth={1.5} />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="space-y-2"
                >
                  <h2 className="display-heading text-3xl text-nasij-primary">تم استلام طلبك!</h2>
                  <p className="text-nasij-ink/60 text-sm leading-relaxed">
                    سنتواصل معك قريباً لتأكيد التفاصيل والسعر النهائي.
                  </p>
                </motion.div>

                {orderCode && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-nasij-secondary/60 border border-nasij-accent/30 rounded-2xl px-6 py-4 space-y-2 w-full"
                  >
                    <p className="text-xs text-nasij-ink/50">كود الطلب</p>
                    <p className="display-heading text-2xl text-nasij-primary">{orderCode}</p>
                    <button
                      onClick={copyCode}
                      className="inline-flex items-center gap-1.5 text-xs text-nasij-accent-dark hover:text-nasij-primary transition-colors"
                    >
                      <Copy size={12} />
                      {copied ? 'تم النسخ ✓' : 'نسخ الكود'}
                    </button>
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.55 }}
                  className="flex gap-3 w-full"
                >
                  <a href="/track" className="btn-outline flex-1 justify-center text-sm">
                    تتبع طلبك
                  </a>
                  <button onClick={handleClose} className="btn-primary flex-1 justify-center text-sm">
                    إغلاق
                  </button>
                </motion.div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
