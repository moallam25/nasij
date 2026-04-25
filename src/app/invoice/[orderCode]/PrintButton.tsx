'use client';

import { Printer } from 'lucide-react';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 bg-nasij-primary text-nasij-cream px-5 py-2.5 rounded-full text-sm font-medium hover:bg-nasij-primary-dark transition-colors shadow-sm"
    >
      <Printer size={15} />
      Print Invoice
    </button>
  );
}
