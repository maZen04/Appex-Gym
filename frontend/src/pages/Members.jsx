import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, QrCode } from 'lucide-react';
import Layout from '../components/Layout';
import { Card, Button, Input, Select, Modal, EmptyState } from '../components/ui';
import StatusBadge, { membershipDisplayStatus } from '../components/StatusBadge';
import api from '../api/client';

export default function Members() {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newQr, setNewQr] = useState(null);

  function load(q = '') {
    api.get('/members', { params: q ? { search: q } : {} }).then((r) => setMembers(r.data));
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <Layout title="Members" subtitle={`${members.length} member${members.length === 1 ? '' : 's'} in your gym`}>
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-black/10 bg-white text-sm"
          />
        </div>
        <Button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 ml-auto">
          <Plus size={16} /> Add Member
        </Button>
      </div>

      <Card className="overflow-hidden">
        {members.length === 0 ? (
          <EmptyState title="No members yet" subtitle="Add your first member to get started" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink/40 text-xs uppercase tracking-wide border-b border-black/5">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Phone</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Expiry</th>
                <th className="px-5 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const status = membershipDisplayStatus(m.current_membership);
                return (
                  <tr key={m.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02]">
                    <td className="px-5 py-3">
                      <Link to={`/members/${m.id}`} className="font-medium text-ink hover:text-ember">{m.full_name}</Link>
                    </td>
                    <td className="px-5 py-3 text-ink/60 font-mono text-xs">{m.phone}</td>
                    <td className="px-5 py-3"><StatusBadge status={status} /></td>
                    <td className="px-5 py-3 text-ink/50">{m.current_membership?.end_date || '—'}</td>
                    <td className="px-5 py-3 text-right">
                      <Link to={`/members/${m.id}`} className="text-ember text-xs font-semibold hover:underline">View Profile →</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      <AddMemberModal
        open={showAdd}
        onClose={() => { setShowAdd(false); setNewQr(null); }}
        onCreated={(qr) => { load(search); setNewQr(qr); }}
      />

      <Modal open={!!newQr} onClose={() => setNewQr(null)} title="Member Added 🎉">
        {newQr && (
          <div className="text-center">
            <img src={newQr.qr_image} alt="Member QR" className="mx-auto w-48 h-48 rounded-lg border border-black/10" />
            <p className="text-sm text-ink/60 mt-4 flex items-center justify-center gap-1.5">
              <QrCode size={14} /> {newQr.qr_code}
            </p>
            <p className="text-xs text-ink/40 mt-2">A welcome WhatsApp message with this QR code was sent automatically. Use it for gym check-ins.</p>
            <Button className="w-full mt-4" onClick={() => setNewQr(null)}>Done</Button>
          </div>
        )}
      </Modal>
    </Layout>
  );
}

function AddMemberModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', gender: 'Male', date_of_birth: '', address: '', emergency_contact: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      const { data } = await api.post('/members', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onCreated({ qr_image: data.qr_image, qr_code: data.qr_code });
      setForm({ full_name: '', phone: '', email: '', gender: 'Male', date_of_birth: '', address: '', emergency_contact: '', notes: '' });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add member');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add New Member" wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Full Name" required value={form.full_name} onChange={(e) => update('full_name', e.target.value)} />
          <Input label="Phone Number" required value={form.phone} onChange={(e) => update('phone', e.target.value)} />
          <Input label="Email (Optional)" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
          <Select label="Gender" value={form.gender} onChange={(e) => update('gender', e.target.value)}>
            <option>Male</option>
            <option>Female</option>
          </Select>
          <Input label="Date of Birth" type="date" value={form.date_of_birth} onChange={(e) => update('date_of_birth', e.target.value)} />
          <Input label="Emergency Contact (Optional)" value={form.emergency_contact} onChange={(e) => update('emergency_contact', e.target.value)} />
        </div>
        <Input label="Address (Optional)" value={form.address} onChange={(e) => update('address', e.target.value)} />
        <Input label="Notes" value={form.notes} onChange={(e) => update('notes', e.target.value)} />
        {error && <div className="text-sm text-danger bg-danger-light rounded-lg px-3 py-2">{error}</div>}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Adding...' : 'Add Member'}</Button>
        </div>
      </form>
    </Modal>
  );
}
