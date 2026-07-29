import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import Layout from '../components/Layout';
import { Card, Button, Input, Select, Modal, EmptyState } from '../components/ui';
import api from '../api/client';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [showAdd, setShowAdd] = useState(false);

  function load() { api.get('/payments').then((r) => setPayments(r.data)); }

  useEffect(() => {
    load();
    api.get('/members').then((r) => setMembers(r.data));
    api.get('/memberships').then((r) => setMemberships(r.data));
  }, []);

  const total = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <Layout title="Payments" subtitle={`${payments.length} payments — ${total} EGP total`}>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5">
          <Plus size={16} /> Record Payment
        </Button>
      </div>
      <Card className="overflow-hidden">
        {payments.length === 0 ? <EmptyState title="No payments recorded yet" /> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-ink/40 text-xs uppercase border-b border-black/5">
              <th className="px-5 py-3">Date</th><th className="px-5 py-3">Member</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Method</th><th className="px-5 py-3">Notes</th>
            </tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02]">
                  <td className="px-5 py-3 text-ink/50">{p.payment_date}</td>
                  <td className="px-5 py-3 font-medium">{p.full_name}</td>
                  <td className="px-5 py-3 font-semibold">{p.amount} EGP</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-ink/5 text-ink/60">{p.method}</span>
                  </td>
                  <td className="px-5 py-3 text-ink/40">{p.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <AddPaymentModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        members={members}
        memberships={memberships}
        onDone={() => { load(); api.get('/memberships').then((r) => setMemberships(r.data)); }}
      />
    </Layout>
  );
}

function AddPaymentModal({ open, onClose, members, memberships, onDone }) {
  const [memberId, setMemberId] = useState('');
  const [membershipId, setMembershipId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Only memberships belonging to the selected member that still have a balance due
  const outstandingForMember = memberships.filter((m) => m.member_id === memberId && m.due_amount > 0);
  const selectedMembership = outstandingForMember.find((m) => m.id === membershipId);

  useEffect(() => {
    if (open) {
      setMemberId(members[0]?.id || '');
      setAmount('');
      setNotes('');
      setError('');
    }
  }, [open, members]);

  useEffect(() => {
    const first = memberships.find((m) => m.member_id === memberId && m.due_amount > 0);
    setMembershipId(first?.id || '');
    setAmount(first ? String(first.due_amount) : '');
  }, [memberId, memberships]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!membershipId) {
      setError('This member has no outstanding balance to pay.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/payments', {
        member_id: memberId,
        membership_id: membershipId,
        amount: Number(amount),
        method,
        payment_date: new Date().toISOString().slice(0, 10),
        notes,
      });
      onDone();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not record payment');
    } finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Record Payment">
      <form onSubmit={submit} className="space-y-4">
        <Select label="Member" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
          {members.map((m) => <option key={m.id} value={m.id}>{m.full_name} — {m.phone}</option>)}
        </Select>

        {outstandingForMember.length === 0 ? (
          <div className="text-sm text-signal bg-signal-light rounded-lg px-3 py-2">
            This member has no outstanding balance — nothing to collect right now.
          </div>
        ) : (
          <>
            <Select label="Membership" value={membershipId} onChange={(e) => { setMembershipId(e.target.value); const m = outstandingForMember.find((x) => x.id === e.target.value); setAmount(m ? String(m.due_amount) : ''); }}>
              {outstandingForMember.map((m) => (
                <option key={m.id} value={m.id}>{m.plan_name} — {m.due_amount} EGP due of {m.price} EGP</option>
              ))}
            </Select>
            <Input
              label={`Amount (EGP) — max ${selectedMembership?.due_amount ?? 0}`}
              type="number"
              min="1"
              max={selectedMembership?.due_amount}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Select label="Payment Method" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option>Cash</option><option>Visa</option><option>Instapay</option>
            </Select>
            <Input label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </>
        )}

        {error && <div className="text-sm text-danger bg-danger-light rounded-lg px-3 py-2">{error}</div>}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1" disabled={saving || outstandingForMember.length === 0}>{saving ? 'Saving...' : 'Record Payment'}</Button>
        </div>
      </form>
    </Modal>
  );
}
