import { useEffect, useState } from 'react';
import { Download, FileText, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Layout from '../components/Layout';
import { Card, Button, Select, EmptyState } from '../components/ui';
import api from '../api/client';

const TABS = ['Overview', 'Revenue', 'Members', 'Attendance Patterns', 'Payments', 'Expired Members'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Reports() {
  const [tab, setTab] = useState('Overview');

  return (
    <Layout title="Reports" subtitle="Insights, trends, and exportable reports">
      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === t ? 'bg-ink text-white' : 'bg-white text-ink/50 hover:bg-black/5'}`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 'Overview' && <OverviewReport />}
      {tab === 'Revenue' && <RevenueReport />}
      {tab === 'Members' && <MembersReport />}
      {tab === 'Attendance Patterns' && <AttendanceReport />}
      {tab === 'Payments' && <PaymentsReport />}
      {tab === 'Expired Members' && <ExpiredMembersReport />}
    </Layout>
  );
}

async function downloadExport(report, format) {
  const res = await api.get(`/reports/export/${report}/${format}`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${report}.${format}`;
  a.click();
  window.URL.revokeObjectURL(url);
}

function ExportButtons({ report }) {
  return (
    <div className="flex gap-2">
      <Button variant="secondary" className="flex items-center gap-1.5" onClick={() => downloadExport(report, 'csv')}>
        <Download size={14} /> Excel (CSV)
      </Button>
      <Button variant="secondary" className="flex items-center gap-1.5" onClick={() => downloadExport(report, 'pdf')}>
        <FileText size={14} /> PDF
      </Button>
    </div>
  );
}

function GrowthPill({ value }) {
  if (value == null) return <span className="text-ink/30 text-xs flex items-center gap-1"><Minus size={12} /> n/a</span>;
  const positive = value > 0;
  const flat = value === 0;
  const color = flat ? 'text-ink/40' : positive ? 'text-signal' : 'text-danger';
  const Icon = flat ? Minus : positive ? TrendingUp : TrendingDown;
  return <span className={`text-xs font-semibold flex items-center gap-1 ${color}`}><Icon size={12} /> {positive && !flat ? '+' : ''}{value}%</span>;
}

// --- Overview: the deep-analytics tab ---
function OverviewReport() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/reports/analytics').then((r) => setData(r.data)); }, []);

  if (!data) return <div className="text-ink/40 text-sm">Loading analytics...</div>;

  const latestGrowth = data.revenue_trend.length ? data.revenue_trend[data.revenue_trend.length - 1].growth_pct : null;
  const weekdayData = WEEKDAYS.map((label, i) => ({
    label,
    count: data.attendance_by_weekday.find((d) => d.weekday === i)?.count || 0,
  }));
  const hourData = Array.from({ length: 24 }, (_, h) => ({
    hour: `${h}:00`,
    count: data.attendance_by_hour.find((d) => d.hour === h)?.count || 0,
  }));
  const busiestHour = hourData.reduce((max, d) => (d.count > max.count ? d : max), hourData[0]);
  const busiestDay = weekdayData.reduce((max, d) => (d.count > max.count ? d : max), weekdayData[0]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric label="Avg Revenue / Member" value={`${data.avg_revenue_per_member} EGP`} />
        <Metric label="Outstanding Balance" value={`${data.outstanding_balance_total} EGP`} accent={data.outstanding_balance_total > 0 ? 'warn' : 'signal'} />
        <Metric label="Retention Rate" value={data.retention.retention_rate != null ? `${data.retention.retention_rate}%` : '—'} sub={`${data.retention.renewed} renewed / ${data.retention.churned} churned`} />
        <Metric label="This Month's Growth" value={<GrowthPill value={latestGrowth} />} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="font-display font-bold text-ink mb-1">Revenue Trend (12 months)</div>
          <p className="text-xs text-ink/40 mb-4">Month-over-month, with growth rate</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.revenue_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `${v} EGP`} />
              <Line type="monotone" dataKey="total" stroke="#FF5A36" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <div className="font-display font-bold text-ink mb-1">Plan Popularity</div>
          <p className="text-xs text-ink/40 mb-4">Active subscribers & revenue per plan</p>
          <div className="space-y-3 mt-2">
            {data.plan_popularity.map((p) => (
              <div key={p.plan_name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-ink">{p.plan_name}</span>
                  <span className="text-ink/50">{p.active_count} active · {p.revenue} EGP</span>
                </div>
                <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-ember rounded-full"
                    style={{ width: `${Math.min(100, (p.active_count / Math.max(1, Math.max(...data.plan_popularity.map(x => x.active_count)))) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="font-display font-bold text-ink mb-1">Busiest Days</div>
          <p className="text-xs text-ink/40 mb-4">Total check-ins by day of week{busiestDay?.count > 0 && ` — busiest: ${busiestDay.label}`}</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weekdayData}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#0EA5A0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-6">
          <div className="font-display font-bold text-ink mb-1">Busiest Hours</div>
          <p className="text-xs text-ink/40 mb-4">Check-ins by hour of day{busiestHour?.count > 0 && ` — peak: ${busiestHour.hour}`}</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hourData}>
              <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={2} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#FF5A36" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

function RevenueReport() {
  const [range, setRange] = useState('month');
  const [data, setData] = useState(null);

  useEffect(() => { api.get('/reports/revenue', { params: { range } }).then((r) => setData(r.data)); }, [range]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Select value={range} onChange={(e) => setRange(e.target.value)} className="w-48">
          <option value="today">Today</option><option value="week">This Week</option><option value="month">This Month</option><option value="year">This Year</option>
        </Select>
        <ExportButtons report="payments" />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="text-xs font-semibold text-ink/40 uppercase">Total Revenue — {data?.range}</div>
          <div className="font-display font-bold text-4xl text-ink mt-2">{data?.total_revenue ?? '—'} EGP</div>
        </Card>
        <Card className="p-6">
          <div className="text-xs font-semibold text-ink/40 uppercase mb-3">By Payment Method</div>
          <div className="space-y-2">
            {(data?.revenue_by_method || []).map((m) => (
              <div key={m.method} className="flex justify-between text-sm">
                <span className="font-medium">{m.method}</span>
                <span className="text-ink/60">{m.total} EGP ({m.count})</span>
              </div>
            ))}
            {(data?.revenue_by_method || []).length === 0 && <div className="text-ink/30 text-sm">No revenue in this range</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}

function MembersReport() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/reports/members').then((r) => setData(r.data)); }, []);
  return (
    <div className="space-y-5">
      <div className="flex justify-end"><ExportButtons report="members" /></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric label="Total Members" value={data?.total_members} />
        <Metric label="Active" value={data?.active_members} accent="signal" />
        <Metric label="Expired" value={data?.expired_members} accent="danger" />
        <Metric label="New This Month" value={data?.new_members_this_month} accent="warn" />
      </div>
    </div>
  );
}

function AttendanceReport() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/reports/attendance').then((r) => setData(r.data)); }, []);
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <div className="font-display font-bold text-ink mb-4">Daily Check-ins (30 days)</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data?.daily_attendance || []}>
            <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(d) => d?.slice(5)} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#0EA5A0" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card className="p-6">
        <div className="font-display font-bold text-ink mb-4">Most Active Members</div>
        {!data || data.most_active_members.length === 0 ? <EmptyState title="No attendance data yet" /> : (
          <div className="space-y-2">
            {data.most_active_members.map((m, i) => (
              <div key={i} className="flex justify-between text-sm py-1.5 border-b border-black/5 last:border-0">
                <span className="font-medium">{m.full_name}</span>
                <span className="text-ink/50">{m.visits} visits</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function PaymentsReport() {
  const [rows, setRows] = useState([]);
  useEffect(() => { api.get('/reports/payments').then((r) => setRows(r.data)); }, []);
  return (
    <div className="space-y-5">
      <div className="flex justify-end"><ExportButtons report="payments" /></div>
      <Card className="overflow-hidden">
        {rows.length === 0 ? <EmptyState title="No payments yet" /> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-ink/40 text-xs uppercase border-b border-black/5">
              <th className="px-5 py-3">Date</th><th className="px-5 py-3">Member</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Method</th>
            </tr></thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-black/5 last:border-0">
                  <td className="px-5 py-3 text-ink/50">{p.payment_date}</td>
                  <td className="px-5 py-3 font-medium">{p.full_name}</td>
                  <td className="px-5 py-3">{p.amount} EGP</td>
                  <td className="px-5 py-3">{p.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function ExpiredMembersReport() {
  const [rows, setRows] = useState([]);
  useEffect(() => { api.get('/reports/expired-members').then((r) => setRows(r.data)); }, []);
  return (
    <div className="space-y-5">
      <div className="flex justify-end"><ExportButtons report="expired-members" /></div>
      <Card className="overflow-hidden">
        {rows.length === 0 ? <EmptyState title="No expired memberships 🎉" /> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-ink/40 text-xs uppercase border-b border-black/5">
              <th className="px-5 py-3">Name</th><th className="px-5 py-3">Phone</th><th className="px-5 py-3">Expired On</th><th className="px-5 py-3">Days Since</th>
            </tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-black/5 last:border-0">
                  <td className="px-5 py-3 font-medium">{r.full_name}</td>
                  <td className="px-5 py-3 font-mono text-xs">{r.phone}</td>
                  <td className="px-5 py-3 text-ink/50">{r.end_date}</td>
                  <td className="px-5 py-3 text-danger font-semibold">{r.days_since_expiry}d</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function Metric({ label, value, sub, accent = 'ember' }) {
  const accentMap = { ember: 'text-ember', signal: 'text-signal', warn: 'text-warn', danger: 'text-danger' };
  return (
    <Card className="p-5">
      <div className="text-xs font-semibold text-ink/40 uppercase">{label}</div>
      <div className={`font-display font-bold text-3xl mt-1 ${typeof value === 'string' || typeof value === 'number' ? 'text-ink' : ''}`}>{value ?? '—'}</div>
      {sub && <div className="text-xs text-ink/40 mt-1">{sub}</div>}
    </Card>
  );
}
