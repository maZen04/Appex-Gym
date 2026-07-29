import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, CreditCard, ScanLine, Wallet,
  BarChart3, UserCog, Settings as SettingsIcon, Dumbbell, MessageCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, ownerOnly: false },
  { to: '/members', label: 'Members', icon: Users, ownerOnly: false },
  { to: '/memberships', label: 'Memberships', icon: CreditCard, ownerOnly: false },
  { to: '/attendance', label: 'Attendance', icon: ScanLine, ownerOnly: false },
  { to: '/payments', label: 'Payments', icon: Wallet, ownerOnly: false },
  { to: '/reports', label: 'Reports', icon: BarChart3, ownerOnly: false },
  { to: '/whatsapp', label: 'WhatsApp Log', icon: MessageCircle, ownerOnly: false },
  { to: '/employees', label: 'Employees', icon: UserCog, ownerOnly: true },
  { to: '/settings', label: 'Settings', icon: SettingsIcon, ownerOnly: true },
];

export default function Sidebar() {
  const { isOwner } = useAuth();
  return (
    <aside className="w-64 shrink-0 bg-ink text-white/90 min-h-screen flex flex-col">
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="w-9 h-9 rounded-lg bg-ember flex items-center justify-center">
          <Dumbbell size={18} className="text-white" />
        </div>
        <div>
          <div className="font-display font-bold text-lg leading-none">Appex</div>
          <div className="text-[11px] text-white/50 tracking-wide">GYM MANAGEMENT</div>
        </div>
      </div>
      <nav className="flex-1 px-3 space-y-1 mt-2">
        {links.filter((l) => !l.ownerOnly || isOwner).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-ember text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-6 py-4 text-[11px] text-white/30">Appex Gym V1</div>
    </aside>
  );
}
