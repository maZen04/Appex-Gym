import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Card, Button, Input } from '../components/ui';
import api from '../api/client';

export default function Settings() {
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.get('/settings').then((r) => setForm(r.data)); }, []);

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })); setSaved(false); }

  async function save() {
    setSaving(true);
    try {
      await api.put('/settings', form);
      setSaved(true);
    } finally { setSaving(false); }
  }

  if (!form) return <Layout title="Settings"><div /></Layout>;

  return (
    <Layout title="Settings" subtitle="Configure your gym and WhatsApp automation">
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <div className="font-display font-bold text-ink">Gym Information</div>
          <Input label="Gym Name" value={form.gym_name || ''} onChange={(e) => update('gym_name', e.target.value)} />
          <Input label="Address" value={form.address || ''} onChange={(e) => update('address', e.target.value)} />
          <Input label="Phone" value={form.phone || ''} onChange={(e) => update('phone', e.target.value)} />
        </Card>

        <Card className="p-6 space-y-4">
          <div className="font-display font-bold text-ink">WhatsApp Integration</div>
          <p className="text-xs text-ink/50 -mt-2">
            Messages are simulated (logged only) unless a real provider is connected on the backend
            (set TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_WHATSAPP_FROM in the server's .env)
            and enabled below.
          </p>
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input type="checkbox" checked={!!form.whatsapp_enabled} onChange={(e) => update('whatsapp_enabled', e.target.checked)} className="w-4 h-4" />
            Enable live WhatsApp sending
          </label>
          <Input label="Sender Number (E.164 format)" value={form.whatsapp_from || ''} onChange={(e) => update('whatsapp_from', e.target.value)} placeholder="+201234567890" />
          <Input label="Reminder Days (comma-separated)" value={form.reminder_days || ''} onChange={(e) => update('reminder_days', e.target.value)} placeholder="7,3,1" />
        </Card>

        <Card className="p-6 space-y-4 lg:col-span-2">
          <div className="font-display font-bold text-ink">Message Templates</div>
          <p className="text-xs text-ink/50 -mt-2">Available variables: {'{gym_name}'}, {'{member_name}'}, {'{expiry_date}'}</p>
          <TemplateField label="Welcome Message" value={form.welcome_message_template} onChange={(v) => update('welcome_message_template', v)} />
          <TemplateField label="Renewal Reminder" value={form.renewal_reminder_template} onChange={(v) => update('renewal_reminder_template', v)} />
          <TemplateField label="Expired Membership Reminder" value={form.expired_reminder_template} onChange={(v) => update('expired_reminder_template', v)} />
        </Card>
      </div>

      <div className="flex items-center gap-3 mt-6">
        <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</Button>
        {saved && <span className="text-sm text-signal font-medium">Saved ✓</span>}
      </div>
    </Layout>
  );
}

function TemplateField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-ink/60 mb-1.5">{label}</span>
      <textarea
        rows={2}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-lg border border-black/10 bg-white text-sm text-ink"
      />
    </label>
  );
}
