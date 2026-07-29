import { useEffect, useState, useRef } from 'react';
import { ScanLine, Search, CheckCircle2, AlertTriangle } from 'lucide-react';
import Layout from '../components/Layout';
import { Card, Button, Input, EmptyState } from '../components/ui';
import api from '../api/client';

export default function Attendance() {
  const [qrInput, setQrInput] = useState('');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [today, setToday] = useState([]);
  const [lastCheckin, setLastCheckin] = useState(null);
  const [error, setError] = useState('');
  const qrRef = useRef(null);

  function loadToday() {
    api.get('/attendance', { params: { date: new Date().toISOString().slice(0, 10) } }).then((r) => setToday(r.data));
  }

  useEffect(() => { loadToday(); qrRef.current?.focus(); }, []);

  useEffect(() => {
    if (!search) { setResults([]); return; }
    const t = setTimeout(() => api.get('/members', { params: { search } }).then((r) => setResults(r.data)), 300);
    return () => clearTimeout(t);
  }, [search]);

  async function handleQrSubmit(e) {
    e.preventDefault();
    if (!qrInput.trim()) return;
    setError('');
    try {
      const { data } = await api.post('/attendance/checkin', { qr_code: qrInput.trim(), method: 'QR' });
      setLastCheckin(data);
      setQrInput('');
      loadToday();
    } catch (err) {
      setError(err.response?.data?.error || 'Check-in failed');
    }
    qrRef.current?.focus();
  }

  async function checkInMember(memberId) {
    setError('');
    try {
      const { data } = await api.post('/attendance/checkin', { member_id: memberId, method: 'Manual' });
      setLastCheckin(data);
      setSearch('');
      setResults([]);
      loadToday();
    } catch (err) {
      setError(err.response?.data?.error || 'Check-in failed');
    }
  }

  return (
    <Layout title="Attendance" subtitle="Check members in with QR scan or search">
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-6 lg:col-span-2">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="font-display font-bold text-ink mb-3 flex items-center gap-2"><ScanLine size={18} className="text-ember" /> Scan QR Code</div>
              <form onSubmit={handleQrSubmit}>
                <input
                  ref={qrRef}
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  placeholder="Scan or type QR code..."
                  className="w-full px-4 py-3 rounded-lg border-2 border-dashed border-ember/30 bg-ember-light text-sm font-mono focus:border-ember"
                />
              </form>
              <p className="text-xs text-ink/40 mt-2">A barcode/QR scanner types into this field automatically and submits on Enter.</p>
            </div>
            <div>
              <div className="font-display font-bold text-ink mb-3 flex items-center gap-2"><Search size={18} className="text-ember" /> Search by Name</div>
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Type member name..." />
              {results.length > 0 && (
                <div className="mt-2 border border-black/10 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                  {results.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => checkInMember(m.id)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-ember-light border-b border-black/5 last:border-0"
                    >
                      {m.full_name} <span className="text-ink/40 text-xs">{m.phone}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {error && <div className="mt-4 text-sm text-danger bg-danger-light rounded-lg px-3 py-2">{error}</div>}
        </Card>

        <Card className="p-6">
          <div className="font-display font-bold text-ink mb-3">Last Check-in</div>
          {!lastCheckin ? (
            <EmptyState title="No check-ins yet" />
          ) : (
            <div>
              <div className="flex items-center gap-2 text-signal font-semibold">
                <CheckCircle2 size={18} /> Checked in
              </div>
              <div className="font-display font-bold text-lg text-ink mt-2">{lastCheckin.member.full_name}</div>
              <div className="text-sm text-ink/50">{lastCheckin.check_in_time}</div>
              {lastCheckin.membership_warning && (
                <div className="mt-3 flex items-start gap-1.5 text-xs text-warn bg-warn-light rounded-lg px-2.5 py-2">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" /> {lastCheckin.membership_warning}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="px-5 py-3 border-b border-black/5 font-display font-bold text-ink">Today's Check-ins ({today.length})</div>
        {today.length === 0 ? <EmptyState title="No check-ins today" /> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-ink/40 text-xs uppercase border-b border-black/5">
              <th className="px-5 py-3">Member</th><th className="px-5 py-3">Time</th><th className="px-5 py-3">Method</th>
            </tr></thead>
            <tbody>
              {today.map((a) => (
                <tr key={a.id} className="border-b border-black/5 last:border-0">
                  <td className="px-5 py-3 font-medium">{a.full_name}</td>
                  <td className="px-5 py-3 font-mono text-xs text-ink/60">{a.check_in_time}</td>
                  <td className="px-5 py-3 text-ink/50">{a.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </Layout>
  );
}
