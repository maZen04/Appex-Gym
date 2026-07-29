import { X } from 'lucide-react';

export function Card({ children, className = '' }) {
  return <div className={`bg-white rounded-card border border-black/5 shadow-sm ${className}`}>{children}</div>;
}

export function StatCard({ icon: Icon, label, value, accent = 'ember' }) {
  const accentMap = {
    ember: 'bg-ember-light text-ember',
    signal: 'bg-signal-light text-signal',
    warn: 'bg-warn-light text-warn',
    danger: 'bg-danger-light text-danger',
  };
  return (
    <Card className="p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accentMap[accent]}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium text-ink/50 truncate">{label}</div>
        <div className="font-display font-bold text-2xl text-ink mt-0.5">{value}</div>
      </div>
    </Card>
  );
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-ember text-white hover:bg-ember-dark',
    secondary: 'bg-ink/5 text-ink hover:bg-ink/10',
    danger: 'bg-danger-light text-danger hover:bg-danger hover:text-white',
    ghost: 'text-ink/60 hover:bg-black/5',
  };
  return (
    <button
      className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({ label, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-semibold text-ink/60 mb-1.5">{label}</span>}
      <input
        className={`w-full px-3.5 py-2.5 rounded-lg border border-black/10 bg-white text-sm text-ink placeholder:text-ink/30 ${className}`}
        {...props}
      />
    </label>
  );
}

export function Select({ label, children, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-semibold text-ink/60 mb-1.5">{label}</span>}
      <select
        className={`w-full px-3.5 py-2.5 rounded-lg border border-black/10 bg-white text-sm text-ink ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
      <div className={`bg-white rounded-card w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 sticky top-0 bg-white">
          <h3 className="font-display font-bold text-lg text-ink">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 text-ink/50">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ title, subtitle }) {
  return (
    <div className="text-center py-16 text-ink/40">
      <div className="font-display font-semibold text-ink/60">{title}</div>
      {subtitle && <div className="text-sm mt-1">{subtitle}</div>}
    </div>
  );
}
