import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import Layout from '../components/Layout';
import { Card, Button, EmptyState } from '../components/ui';
import api from '../api/client';

const TYPE_LABELS = {
  welcome: 'Welcome',
  expired_reminder: 'Expired Reminder',
};

export default function WhatsAppLog() {
  const [messages, setMessages] = useState([]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState('');

  function load() { api.get('/whatsapp/messages').then((r) => setMessages(r.data)); }
  useEffect(load, []);

  async function runReminders() {
    setRunning(true);
    setResult('');
    try {
      const { data } = await api.post('/whatsapp/run-reminders');
      setResult(data.message);
      load();
    } finally { setRunning(false); }
  }

  return (
    <Layout title="WhatsApp Log" subtitle="Automated welcome messages and renewal reminders">
      <Card className="p-5 mb-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="font-display font-bold text-ink">Reminder Automation</div>
          <p className="text-sm text-ink/50 mt-0.5">Runs automatically every day at 9:00 AM. Trigger it manually to test.</p>
        </div>
        <div className="flex items-center gap-3">
          {result && <span className="text-sm text-signal font-medium">{result}</span>}
          <Button variant="secondary" onClick={runReminders} disabled={running} className="flex items-center gap-1.5">
            <RefreshCw size={14} className={running ? 'animate-spin' : ''} /> {running ? 'Running...' : 'Run Reminder Check Now'}
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {messages.length === 0 ? <EmptyState title="No WhatsApp messages yet" subtitle="They'll appear here as members are added or reminders go out" /> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-ink/40 text-xs uppercase border-b border-black/5">
              <th className="px-5 py-3">Date</th><th className="px-5 py-3">Member</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Message</th><th className="px-5 py-3">Status</th>
            </tr></thead>
            <tbody>
              {messages.map((m) => (
                <tr key={m.id} className="border-b border-black/5 last:border-0">
                  <td className="px-5 py-3 text-ink/50 whitespace-nowrap">{m.created_at}</td>
                  <td className="px-5 py-3 font-medium whitespace-nowrap">{m.full_name || '—'}</td>
                  <td className="px-5 py-3 text-ink/60 whitespace-nowrap">{TYPE_LABELS[m.type] || m.type}</td>
                  <td className="px-5 py-3 text-ink/50 max-w-md truncate" title={m.message}>{m.message}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${m.status === 'sent' ? 'bg-signal-light text-signal' : m.status === 'failed' ? 'bg-danger-light text-danger' : 'bg-warn-light text-warn'}`}>
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </Layout>
  );
}
