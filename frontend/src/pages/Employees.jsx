import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Layout from '../components/Layout';
import { Card, Button, Input, Select, Modal, EmptyState } from '../components/ui';
import api from '../api/client';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [showAdd, setShowAdd] = useState(false);

  function load() { api.get('/employees').then((r) => setEmployees(r.data)); }
  useEffect(load, []);

  async function remove(id) {
    if (!confirm('Remove this employee?')) return;
    await api.delete(`/employees/${id}`);
    load();
  }

  return (
    <Layout title="Employees" subtitle="Manage staff access to Appex Gym">
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5">
          <Plus size={16} /> Add Employee
        </Button>
      </div>
      <Card className="overflow-hidden">
        {employees.length === 0 ? <EmptyState title="No employees yet" /> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-ink/40 text-xs uppercase border-b border-black/5">
              <th className="px-5 py-3">Name</th><th className="px-5 py-3">Phone</th><th className="px-5 py-3">Role</th><th className="px-5 py-3"></th>
            </tr></thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id} className="border-b border-black/5 last:border-0">
                  <td className="px-5 py-3 font-medium">{e.full_name}</td>
                  <td className="px-5 py-3 font-mono text-xs text-ink/60">{e.phone}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${e.role === 'Owner' ? 'bg-ember-light text-ember' : 'bg-signal-light text-signal'}`}>{e.role}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => remove(e.id)} className="text-ink/30 hover:text-danger p-1.5"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <AddEmployeeModal open={showAdd} onClose={() => setShowAdd(false)} onDone={load} />
    </Layout>
  );
}

function AddEmployeeModal({ open, onClose, onDone }) {
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', role: 'Reception', password: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/employees', form);
      onDone();
      onClose();
      setForm({ full_name: '', phone: '', email: '', role: 'Reception', password: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add employee');
    } finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Employee">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Full Name" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        <Input label="Phone Number" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label="Email (Optional)" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option>Reception</option><option>Owner</option>
        </Select>
        <Input label="Password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <div className="text-sm text-danger bg-danger-light rounded-lg px-3 py-2">{error}</div>}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Adding...' : 'Add Employee'}</Button>
        </div>
      </form>
    </Modal>
  );
}
