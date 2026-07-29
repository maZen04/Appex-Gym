import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, QrCode, Snowflake, RefreshCw, XCircle, Wallet } from 'lucide-react';
import Layout from '../components/Layout';
import { Card, Button, Select, Input, Modal, EmptyState } from '../components/ui';
import StatusBadge, { membershipDisplayStatus } from '../components/StatusBadge';
import api from '../api/client';

export default function MemberProfile() {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [plans, setPlans] = useState([]);
  const [qr, setQr] = useState(null);
  const [tab, setTab] = useState('memberships');
  const [showRenew, setShowRenew] = useState(false);
  const [showFreeze, setShowFreeze] = useState(null);
  const [showPay, setShowPay] = useState(null);

  function load() {
    api.get(`/members/${id}`).then((r) => setMember(r.data));
  }

  useEffect(() => {
    load();
    api.get('/plans').then((r) => setPlans(r.data.filter((p) => p.is_active)));
  }, [id]);

  function loadQr() {
    api.get(`/members/${id}/qr`).then((r) => setQr(r.data));
  }

  if (!member) return <Layout title="Loading..."><div /></Layout>;

  const currentMembership = member.memberships?.[0];
  const status = membershipDisplayStatus(currentMembership);

  return (
    <Layout title={member.full_name} subtitle={member.phone}>
      <Link to="/members" className="inline-flex items-center gap-1.5 text-sm text-ink/50 hover:text-ember mb-4">
        <ArrowLeft size={15} /> Back to Members
      </Link>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-ember-light text-ember font-display font-bold text-2xl flex items-center justify-center overflow-hidden">
                {member.photo_url ? <img src={`${(import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/api$/, '')}${member.photo_url}`} alt="" className="w-full h-full object-cover" /> : member.full_name[0]}
              </div>
              <div>
                <div className="font-display font-bold text-xl text-ink">{member.full_name}</div>
                <div className="text-sm text-ink/50">{member.phone} {member.email && `• ${member.email}`}</div>
                <div className="mt-2"><StatusBadge status={status} /></div>
              </div>
            </div>
            <Button variant="secondary" onClick={() => { loadQr(); }} className="flex items-center gap-1.5">
              <QrCode size={15} /> View QR
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 text-sm">
            <Info label="Gender" value={member.gender || '—'} />
            <Info label="Date of Birth" value={member.date_of_birth || '—'} />
            <Info label="Address" value={member.address || '—'} />
            <Info label="Emergency Contact" value={member.emergency_contact || '—'} />
          </div>
          {member.notes && <div className="mt-4 text-sm text-ink/50 bg-canvas rounded-lg p-3">{member.notes}</div>}
        </Card>

        <Card className="p-6">
          <div className="font-display font-bold text-ink mb-3">Membership Actions</div>
          <div className="space-y-2">
            <Button className="w-full" onClick={() => setShowRenew(true)}>
              <RefreshCw size={14} className="inline mr-1.5" /> Renew Membership
            </Button>
            {currentMembership && currentMembership.due_amount > 0 && (
              <Button variant="secondary" className="w-full" onClick={() => setShowPay(currentMembership)}>
                <Wallet size={14} className="inline mr-1.5" /> Pay Balance ({currentMembership.due_amount} EGP due)
              </Button>
            )}
            {currentMembership && currentMembership.status === 'Active' && (
              <Button variant="secondary" className="w-full" onClick={() => setShowFreeze(currentMembership)}>
                <Snowflake size={14} className="inline mr-1.5" /> Freeze Membership
              </Button>
            )}
            {currentMembership && currentMembership.status === 'Active' && (
              <Button variant="danger" className="w-full" onClick={async () => { await api.post(`/memberships/${currentMembership.id}/cancel`); load(); }}>
                <XCircle size={14} className="inline mr-1.5" /> Cancel Membership
              </Button>
            )}
          </div>
          {currentMembership && (
            <div className="mt-4 text-xs text-ink/40 space-y-1">
              <div>Plan: <span className="text-ink/70 font-medium">{currentMembership.plan_name}</span></div>
              <div>Ends: <span className="text-ink/70 font-medium">{currentMembership.end_date}</span></div>
            </div>
          )}
        </Card>
      </div>

      <div className="flex gap-2 mb-4">
        {['memberships', 'payments', 'attendance'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize ${tab === t ? 'bg-ink text-white' : 'bg-white text-ink/50 hover:bg-black/5'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        {tab === 'memberships' && (
          member.memberships.length === 0 ? <EmptyState title="No membership history yet" /> : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-ink/40 text-xs uppercase border-b border-black/5">
                <th className="px-5 py-3">Plan</th><th className="px-5 py-3">Start</th><th className="px-5 py-3">End</th><th className="px-5 py-3">Price</th><th className="px-5 py-3">Payment</th><th className="px-5 py-3">Status</th>
              </tr></thead>
              <tbody>
                {member.memberships.map((m) => (
                  <tr key={m.id} className="border-b border-black/5 last:border-0">
                    <td className="px-5 py-3 font-medium">{m.plan_name}</td>
                    <td className="px-5 py-3 text-ink/50">{m.start_date}</td>
                    <td className="px-5 py-3 text-ink/50">{m.end_date}</td>
                    <td className="px-5 py-3">{m.price} EGP</td>
                    <td className="px-5 py-3">
                      {m.due_amount > 0 ? <span className="text-warn font-semibold text-xs">{m.due_amount} EGP due</span> : <span className="text-signal font-semibold text-xs">Paid in full</span>}
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={membershipDisplayStatus(m)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
        {tab === 'payments' && (
          member.payments.length === 0 ? <EmptyState title="No payments recorded" /> : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-ink/40 text-xs uppercase border-b border-black/5">
                <th className="px-5 py-3">Date</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Method</th><th className="px-5 py-3">Notes</th>
              </tr></thead>
              <tbody>
                {member.payments.map((p) => (
                  <tr key={p.id} className="border-b border-black/5 last:border-0">
                    <td className="px-5 py-3 text-ink/50">{p.payment_date}</td>
                    <td className="px-5 py-3 font-medium">{p.amount} EGP</td>
                    <td className="px-5 py-3">{p.method}</td>
                    <td className="px-5 py-3 text-ink/40">{p.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
        {tab === 'attendance' && (
          member.attendance.length === 0 ? <EmptyState title="No check-ins yet" /> : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-ink/40 text-xs uppercase border-b border-black/5">
                <th className="px-5 py-3">Date</th><th className="px-5 py-3">Time</th><th className="px-5 py-3">Method</th>
              </tr></thead>
              <tbody>
                {member.attendance.map((a) => (
                  <tr key={a.id} className="border-b border-black/5 last:border-0">
                    <td className="px-5 py-3 text-ink/50">{a.check_in_date}</td>
                    <td className="px-5 py-3 font-mono text-xs">{a.check_in_time}</td>
                    <td className="px-5 py-3">{a.method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </Card>

      <Modal open={!!qr} onClose={() => setQr(null)} title="Member QR Code">
        {qr && (
          <div className="text-center">
            <img src={qr.qr_image} alt="QR" className="mx-auto w-56 h-56 rounded-lg border border-black/10" />
            <p className="text-sm text-ink/50 mt-3 font-mono">{qr.qr_code}</p>
          </div>
        )}
      </Modal>

      <RenewModal open={showRenew} onClose={() => setShowRenew(false)} plans={plans} memberId={id} onDone={load} />
      <FreezeModal open={!!showFreeze} membership={showFreeze} onClose={() => setShowFreeze(null)} onDone={load} />
      <PayBalanceModal open={!!showPay} membership={showPay} memberId={id} onClose={() => setShowPay(null)} onDone={load} />
    </Layout>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-ink/40 text-xs font-semibold mb-0.5">{label}</div>
      <div className="text-ink font-medium">{value}</div>
    </div>
  );
}

function RenewModal({ open, onClose, plans, memberId, onDone }) {
  const [planId, setPlanId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [payNow, setPayNow] = useState('full');
  const [partialAmount, setPartialAmount] = useState('');
  const [method, setMethod] = useState('Cash');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedPlan = plans.find((p) => p.id === planId);

  useEffect(() => {
    if (open && plans.length) {
      setPlanId((prev) => prev || plans[0].id);
      setPayNow('full');
      setPartialAmount('');
      setError('');
    }
  }, [open, plans]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const body = { plan_id: planId, start_date: startDate };
      if (payNow === 'full') body.payment_method = method;
      else if (payNow === 'partial') { body.payment_amount = Number(partialAmount); body.payment_method = method; }
      else body.payment_amount = 0;

      await api.post(`/memberships/${memberId}/renew`, body);
      onDone();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not renew membership');
    } finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Renew Membership">
      <form onSubmit={submit} className="space-y-4">
        <Select label="Plan" value={planId} onChange={(e) => setPlanId(e.target.value)}>
          {plans.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.price} EGP ({p.duration_days} days)</option>)}
        </Select>
        <Input label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />

        <div className="border-t border-black/5 pt-4">
          <span className="block text-xs font-semibold text-ink/60 mb-2">Payment</span>
          <div className="flex gap-2 mb-3">
            {[
              ['full', `Pay in full (${selectedPlan?.price ?? '—'} EGP)`],
              ['partial', 'Pay partial'],
              ['none', 'No payment now'],
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
                <Input label="Amount now (EGP)" type="number" min="0" max={selectedPlan?.price} required value={partialAmount} onChange={(e) => setPartialAmount(e.target.value)} />
              )}
              <Select label="Method" value={method} onChange={(e) => setMethod(e.target.value)} className={payNow === 'full' ? 'col-span-2' : ''}>
                <option>Cash</option><option>Visa</option><option>Instapay</option>
              </Select>
            </div>
          )}
        </div>

        {error && <div className="text-sm text-danger bg-danger-light rounded-lg px-3 py-2">{error}</div>}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Saving...' : 'Renew'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function PayBalanceModal({ open, membership, memberId, onClose, onDone }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Cash');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && membership) {
      setAmount(String(membership.due_amount));
      setError('');
    }
  }, [open, membership]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/payments', {
        member_id: memberId,
        membership_id: membership.id,
        amount: Number(amount),
        method,
        payment_date: new Date().toISOString().slice(0, 10),
      });
      onDone();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not record payment');
    } finally { setSaving(false); }
  }

  if (!membership) return null;

  return (
    <Modal open={open} onClose={onClose} title="Pay Outstanding Balance">
      <form onSubmit={submit} className="space-y-4">
        <div className="text-sm bg-warn-light text-warn rounded-lg px-3 py-2">
          {membership.due_amount} EGP remaining on {membership.plan_name} ({membership.price} EGP total)
        </div>
        <Input label="Amount (EGP)" type="number" min="1" max={membership.due_amount} required value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Select label="Payment Method" value={method} onChange={(e) => setMethod(e.target.value)}>
          <option>Cash</option><option>Visa</option><option>Instapay</option>
        </Select>
        {error && <div className="text-sm text-danger bg-danger-light rounded-lg px-3 py-2">{error}</div>}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Saving...' : 'Record Payment'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function FreezeModal({ open, membership, onClose, onDone }) {
  const [freezeStart, setFreezeStart] = useState(new Date().toISOString().slice(0, 10));
  const [freezeEnd, setFreezeEnd] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/memberships/${membership.id}/freeze`, { freeze_start: freezeStart, freeze_end: freezeEnd });
      onDone();
      onClose();
    } finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Freeze Membership">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Freeze Start" type="date" value={freezeStart} onChange={(e) => setFreezeStart(e.target.value)} required />
        <Input label="Freeze End" type="date" value={freezeEnd} onChange={(e) => setFreezeEnd(e.target.value)} required />
        <p className="text-xs text-ink/40">The membership's expiry date will be pushed forward by the number of frozen days.</p>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Saving...' : 'Freeze'}</Button>
        </div>
      </form>
    </Modal>
  );
}
