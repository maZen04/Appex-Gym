import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/ui';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(phone, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-ember flex items-center justify-center mb-4">
            <Dumbbell size={26} className="text-white" />
          </div>
          <h1 className="font-display font-bold text-2xl text-white">Appex Gym</h1>
          <p className="text-white/40 text-sm mt-1">Sign in to manage your gym</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-card p-6 space-y-4">
          <Input label="Phone Number" type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01000000000" required />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          {error && <div className="text-sm text-danger bg-danger-light rounded-lg px-3 py-2">{error}</div>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="text-center text-white/30 text-xs mt-6 space-y-1">
          <div>Demo Owner: 01000000000 / owner123</div>
          <div>Demo Reception: 01000000001 / reception123</div>
        </div>
      </div>
    </div>
  );
}
