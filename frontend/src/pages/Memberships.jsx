import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import Layout from '../components/Layout';
import { Card, Button, Input, Select, Modal, EmptyState } from '../components/ui';
import StatusBadge, { membershipDisplayStatus } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function Memberships() {
  const [tab, setTab] = useState('memberships');
  const { isOwner } = useAuth();

  return (
    <Layout title="Memberships" subtitle="Manage subscriptions and membership plans">
      <div className="flex gap-2 mb-5">
        {['memberships', 'plans'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize ${tab === t ? 'bg-ink text-white' : 'bg-white text-ink/50 hover:bg-black/5'}`}
          >
            {t === 'memberships' ? 'All Memberships' : 'Membership Plans'}
          </button>
        ))}
      </div>
      {tab === 'memberships' ? <MembershipsTab /> : <PlansTab isOwner={isOwner} />}
    </Layout>
  );
}

function MembershipsTab() {
  const [rows, setRows] = useState([]);
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [showAdd, setShowAdd] = useState(false);

  function load() { api.get('/memberships').then((r) => setRows(r.data)); }

  useEffect(() => {
    load();
    api.get('/members').then((r) => setMembers(r.data));
    api.get('/plans').then((r) => setPlans(r.data.filter((p) => p.is_active)));
  }, []);

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5">
          <Plus size={16} /> New Membership
        </Button>
      </div>
      <Card className="overflow-hidden">
        {rows.length === 0 ? <EmptyState title="No memberships yet" /> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-ink/40 text-xs uppercase border-b border-black/5">
              <th className="px-5 py-3">Member</th><th className="px-5 py-3">Plan</th><th className="px-5 py-3">Start</th><th className="px-5 py-3">End</th><th className="px-5 py-3">Price</th><th className="px-5 py-3">Payment</th><th className="px-5 py-3">Status</th>
            </tr></thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02]">
                  <td className="px-5 py-3 font-medium">{m.member_name}</td>
                  <td className="px-5 py-3 text-ink/60">{m.plan_name}</td>
                  <td className="px-5 py-3 text-ink/50">{m.start_date}</td>
                  <td className="px-5 py-3 text-ink/50">{m.end_date}</td>
                  <td className="px-5 py-3">{m.price} EGP</td>
                  <td className="px-5 py-3">
                    {m.due_amount > 0 ? (
                      <span className="text-warn font-semibold text-xs">{m.due_amount} EGP due</span>
                    ) : (
                      <span className="text-signal font-semibold text-xs">Paid in full</span>
                    )}
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={membershipDisplayStatus(m)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <NewMembershipModal open={showAdd} onClose={() => setShowAdd(false)} members={members} plans={plans} onDone={load} />
    </>
  );
}

function NewMembershipModal({ open, onClose, members, plans, onDone }) {
  const [memberId, setMemberId] = useState('');
  const [planId, setPlanId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [payNow, setPayNow] = useState('full'); // 'full' | 'partial' | 'none'
  const [partialAmount, setPartialAmount] = useState('');
  const [method, setMethod] = useState('Cash');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedPlan = plans.find((p) => p.id === planId);

  useEffect(() => {
    if (open) {
      setMemberId(members[0]?.id || '');
      setPlanId(plans[0]?.id || '');
      setPayNow('full');
      setPartialAmount('');
      setMethod('Cash');
      setError('');
    }
  }, [open, members, plans]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const body = { member_id: memberId, plan_id: planId, start_date: startDate };
      if (payNow === 'full') {
        body.payment_method = method;
      } else if (payNow === 'partial') {
        body.payment_amount = Number(partialAmount);
        body.payment_method = method;
      } else {
        body.payment_amount = 0;
      }
      await api.post('/memberships', body);
      onDone();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create membership');
    } finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="New Membership">
      <form onSubmit={submit} className="space-y-4">
        <Select label="Member" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
          {members.map((m) => <option key={m.id} value={m.id}>{m.full_name} — {m.phone}</option>)}
        </Select>
        <Select label="Plan" value={planId} onChange={(e) => setPlanId(e.target.value)}>
          {plans.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.price} EGP ({p.duration_days} days)</option>)}
        </Select>
        <Input label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />

        <div className="border-t border-black/5 pt-4">
          <span className="block text-xs font-semibold text-ink/60 mb-2">Payment</span>
          <div className="flex gap-2 mb-3">
            {[
              ['full', `Pay in full (${selectedPlan?.price ?? '—'} EGP)`],
              ['partial', 'Pay partial amount'],
              ['none', 'Record without payment'],
            ].map(([val, label]) => (
              <button
                type="button"
                key={val}
                onClick={() => setPayNow(val)}
                className={`flex-1 px-2 py-2 rounded-lg text-xs font-semibold border ${payNow === val ? 'bg-ember text-white border-ember' : 'bg-white text-ink/60 border-black/10 hover:bg-black/5'}`}
              >
                {label}
              </button>
            ))}
          </div>
          {payNow !== 'none' && (
            <div className="grid grid-cols-2 gap-3">
              {payNow === 'partial' && (
                <Input
                  label="Amount to pay now (EGP)"
                  type="number"
                  min="0"
                  max={selectedPlan?.price}
                  required
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                />
              )}
              <Select label="Payment Method" value={method} onChange={(e) => setMethod(e.target.value)} className={payNow === 'full' ? 'col-span-2' : ''}>
                <option>Cash</option><option>Visa</option><option>Instapay</option>
              </Select>
            </div>
          )}
          {payNow === 'none' && (
            <p className="text-xs text-warn bg-warn-light rounded-lg px-3 py-2">This membership will start with an outstanding balance of the full plan price — it'll show up under Outstanding Payments on the dashboard.</p>
          )}
        </div>

        {error && <div className="text-sm text-danger bg-danger-light rounded-lg px-3 py-2">{error}</div>}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Saving...' : 'Create Membership'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function PlansTab({ isOwner }) {
  const [plans, setPlans] = useState([]);
  const [showAdd, setShowAdd] = useState(false);

  function load() { api.get('/plans').then((r) => setPlans(r.data)); }
  useEffect(load, []);

  return (
    <>
      {isOwner && (
        <div className="flex justify-end mb-4">
          <Button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5">
            <Plus size={16} /> New Plan
          </Button>
        </div>
      )}
      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((p) => (
          <Card key={p.id} className={`p-5 ${!p.is_active ? 'opacity-50' : ''}`}>
            <div className="text-xs font-semibold text-ember uppercase tracking-wide">{p.type}</div>
            <div className="font-display font-bold text-lg text-ink mt-1">{p.name}</div>
            <div className="font-display font-bold text-3xl text-ink mt-3">{p.price} <span className="text-sm font-body font-normal text-ink/40">EGP</span></div>
            <div className="text-sm text-ink/50 mt-1">{p.duration_days} days</div>
          </Card>
        ))}
      </div>
      <NewPlanModal open={showAdd} onClose={() => setShowAdd(false)} onDone={load} />
    </>
  );
}

function NewPlanModal({ open, onClose, onDone }) {
  const [form, setForm] = useState({ name: '', type: 'Monthly', price: '', duration_days: 30 });
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/plans', form);
      onDone();
      onClose();
      setForm({ name: '', type: 'Monthly', price: '', duration_days: 30 });
    } finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="New Membership Plan">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Plan Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option>Monthly</option><option>Quarterly</option><option>Yearly</option><option>Custom</option>
        </Select>
        <Input label="Price (EGP)" type="number" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <Input label="Duration (days)" type="number" required value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} />
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Saving...' : 'Create Plan'}</Button>
        </div>
      </form>
    </Modal>
  );
}
