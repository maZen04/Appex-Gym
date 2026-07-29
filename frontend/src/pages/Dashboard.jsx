import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, UserCheck, UserX, Wallet, CalendarClock, Dumbbell, AlertTriangle,
  Clock, ArrowUpRight, UserPlus, ScanLine, Wallet as WalletIcon,
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Layout from '../components/Layout';
import { Card, EmptyState } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const PIE_COLORS = ['#FF5A36', '#0EA5A0', '#F5A524'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [charts, setCharts] = useState(null);
  const [renewals, setRenewals] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/dashboard/stats').then((r) => setStats(r.data));
    api.get('/dashboard/alerts').then((r) => setAlerts(r.data));
    api.get('/dashboard/charts').then((r) => setCharts(r.data));
    api.get('/dashboard/renewals-today').then((r) => setRenewals(r.data));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const alertCount = alerts ? alerts.expiring_soon.length + alerts.expired.length + alerts.outstanding_payments.length : 0;

  return (
    <Layout title="Dashboard">
      {/* Hero header */}
      <div className="rounded-card bg-gradient-to-br from-ink to-ink-soft text-white px-8 py-7 mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="text-white/50 text-sm">{dateStr}</div>
          <h1 className="font-display font-bold text-2xl mt-1">{greeting}, {user?.full_name?.split(' ')[0]} 👋</h1>
          <p className="text-white/50 text-sm mt-1">Here's what's happening at your gym today</p>
        </div>
        <div className="flex gap-2">
          <QuickAction to="/members" icon={UserPlus} label="Add Member" />
          <QuickAction to="/attendance" icon={ScanLine} label="Check In" />
          <QuickAction to="/payments" icon={WalletIcon} label="Record Payment" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatTile icon={Users} label="Total Members" value={stats?.total_members} accent="ember" />
        <StatTile icon={UserCheck} label="Active Members" value={stats?.active_members} accent="signal" />
        <StatTile icon={UserX} label="Expired" value={stats?.expired_memberships} accent="danger" />
        <StatTile icon={Wallet} label="Revenue (Month)" value={stats ? `${stats.revenue_this_month}` : undefined} suffix=" EGP" accent="warn" />
        <StatTile icon={CalendarClock} label="Renewals Today" value={stats?.renewals_today} accent="ember" />
        <StatTile icon={Dumbbell} label="Today's Check-ins" value={stats?.today_checkins} accent="signal" />
      </div>

      {alertCount > 0 && (
        <Card className="p-5 mb-6 border-l-4 border-l-warn">
          <div className="flex items-center gap-2 mb-4 text-ink font-display font-bold">
            <AlertTriangle size={18} className="text-warn" /> {alertCount} thing{alertCount === 1 ? '' : 's'} need attention
          </div>
          <div className="grid md:grid-cols-3 gap-5 text-sm">
            <AlertGroup
              color="warn"
              title="Expiring in 3 days"
              items={alerts.expiring_soon.map((a) => ({ label: a.full_name, meta: a.end_date }))}
            />
            <AlertGroup
              color="danger"
              title="Expired memberships"
              items={alerts.expired.slice(0, 5).map((a) => ({ label: a.full_name, meta: a.end_date }))}
            />
            <AlertGroup
              color="ember"
              title="Outstanding payments"
              items={alerts.outstanding_payments.slice(0, 5).map((a) => ({ label: a.full_name, meta: `${a.due} EGP due` }))}
            />
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-6 lg:col-span-2">
          <div className="font-display font-bold text-ink">Revenue</div>
          <p className="text-xs text-ink/40 mb-4">Last 6 months</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={charts?.revenue_by_month || []}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => `${v} EGP`} contentStyle={{ borderRadius: 10, border: '1px solid #eee', fontSize: 13 }} />
              <Line type="monotone" dataKey="total" stroke="#FF5A36" strokeWidth={3} dot={{ r: 4, fill: '#FF5A36' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-6">
          <div className="font-display font-bold text-ink">Membership Mix</div>
          <p className="text-xs text-ink/40 mb-2">Active subscriptions by plan type</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={charts?.membership_distribution || []} dataKey="count" nameKey="type" innerRadius={45} outerRadius={75} paddingAngle={3}>
                {(charts?.membership_distribution || []).map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #eee', fontSize: 13 }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <div className="font-display font-bold text-ink">Daily Check-ins</div>
          <p className="text-xs text-ink/40 mb-4">Last 14 days</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts?.attendance_by_day || []}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d?.slice(5)} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #eee', fontSize: 13 }} />
              <Bar dataKey="count" fill="#0EA5A0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-6">
          <div className="font-display font-bold text-ink flex items-center gap-1.5"><Clock size={16} className="text-ember" /> Renewals Today</div>
          <p className="text-xs text-ink/40 mb-3">Members due to renew</p>
          {renewals.length === 0 ? (
            <EmptyState title="No renewals due today" />
          ) : (
            <div className="space-y-3">
              {renewals.map((r) => (
                <div key={r.membership_id} className="flex items-center justify-between text-sm pb-3 border-b border-black/5 last:border-0 last:pb-0">
                  <span className="font-medium text-ink">{r.full_name}</span>
                  <span className="text-ink/40 text-xs">{r.end_date}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}

function QuickAction({ to, icon: Icon, label }) {
  return (
    <Link to={to} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors backdrop-blur-sm">
      <Icon size={15} /> {label}
    </Link>
  );
}

function StatTile({ icon: Icon, label, value, suffix = '', accent }) {
  const accentMap = {
    ember: { bg: 'bg-ember-light', text: 'text-ember' },
    signal: { bg: 'bg-signal-light', text: 'text-signal' },
    warn: { bg: 'bg-warn-light', text: 'text-warn' },
    danger: { bg: 'bg-danger-light', text: 'text-danger' },
  }[accent];

  return (
    <Card className="p-5 hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${accentMap.bg} ${accentMap.text}`}>
        <Icon size={18} />
      </div>
      <div className="text-xs font-medium text-ink/50">{label}</div>
      <div className="font-display font-bold text-2xl text-ink mt-0.5">
        {value != null ? <>{value}{suffix}</> : <span className="text-ink/20">—</span>}
      </div>
    </Card>
  );
}

function AlertGroup({ title, items, color }) {
  const dotColor = { warn: 'bg-warn', danger: 'bg-danger', ember: 'bg-ember' }[color];
  return (
    <div>
      <div className="font-semibold text-ink/70 mb-2 flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} /> {title} ({items.length})
      </div>
      {items.length === 0 ? (
        <div className="text-ink/30">None 🎉</div>
      ) : (
        <ul className="space-y-1.5 text-ink/60">
          {items.map((i, idx) => (
            <li key={idx} className="flex justify-between gap-2">
              <span className="truncate">{i.label}</span>
              <span className="text-ink/40 shrink-0 text-xs">{i.meta}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
