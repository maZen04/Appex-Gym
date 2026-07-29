import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Topbar({ title, subtitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between px-8 py-6 border-b border-black/5">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink">{title}</h1>
        {subtitle && <p className="text-sm text-ink/50 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-sm font-semibold text-ink">{user?.full_name}</div>
          <div className="text-xs text-ink/40">{user?.role}</div>
        </div>
        <div className="w-9 h-9 rounded-full bg-ember-light text-ember font-display font-bold flex items-center justify-center">
          {user?.full_name?.[0] || '?'}
        </div>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="p-2 rounded-lg hover:bg-black/5 text-ink/50 hover:text-danger transition-colors"
          title="Log out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
