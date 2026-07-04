import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ShieldCheck, Activity, MapPin, Users2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { HOME_BY_ROLE } from '@/lib/roleHome';
import Logo from '@/components/Logo';

const DEMO_LOGINS = [
  { label: 'EMS Command', email: 'ems@leip.demo' },
  { label: 'Ambulance Staff', email: 'staff@leip.demo' },
  { label: 'Doctor', email: 'doctor@leip.demo' },
  { label: 'Family', email: 'family@leip.demo' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('demo1234');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(HOME_BY_ROLE[user.role]);
    } catch {
      setError('Incorrect email or password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-[#F3F7FA]">
      {/* Left — brand panel */}
      <div className="hidden lg:flex w-[46%] relative overflow-hidden bg-gradient-to-br from-[#0B2545] via-[#123057] to-[#0B3A4A] text-white flex-col justify-between p-11">
        {/* subtle dot grid backdrop */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '22px 22px' }}
        />
        <div
          className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #14B8A6, transparent 70%)' }}
        />

        <div className="relative z-10">
          <Logo variant="light" className="h-9 w-auto" />
          
        </div>

        <div className="relative z-10">
          <h1 className="font-display text-[28px] font-extrabold leading-tight max-w-md">
            Every second, coordinated. Every unit, connected.
          </h1>
          <p className="text-[13.5px] text-[#B9CBE3] mt-3 max-w-sm leading-relaxed">
            One live view across dispatch, ambulance crews, emergency physicians, and families — from first call to
            hospital arrival.
          </p>

          {/* heartbeat line */}
          <div className="mt-8 h-14 w-full max-w-sm">
            <svg viewBox="0 0 300 56" className="w-full h-full overflow-visible">
              <polyline
                points="0,28 60,28 74,10 88,46 102,28 300,28"
                fill="none"
                stroke="#5DEAD4"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={100}
                style={{
                  strokeDasharray: 100,
                  strokeDashoffset: 100,
                  animation: 'leip-draw 2.6s ease-in-out infinite',
                }}
              />
            </svg>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6 max-w-sm">
            <StatPill icon={Activity} value="5" label="Ambulances live" />
            <StatPill icon={MapPin} value="3" label="Hospitals linked" />
            <StatPill icon={Users2} value="24/7" label="Command coverage" />
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-[11px] text-[#8FA8C7]">
          <ShieldCheck size={14} />
          Demo environment — all patient data and vitals are simulated.
        </div>

        <style>{`
          @keyframes leip-draw {
            0% { stroke-dashoffset: 100; }
            45% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: -100; }
          }
        `}</style>
      </div>

      {/* Right — sign in */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[380px]">
          <div className="lg:hidden mb-7 flex items-center gap-2.5">
            <Logo variant="dark" className="h-8 w-auto" />
          </div>

          <h2 className="font-display text-xl font-extrabold text-ink">Welcome back</h2>
          <p className="text-[12.5px] text-muted mt-1 mb-6">Sign in to your role's dashboard.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <label className="text-[12px] font-medium text-ink">
              Email
              <div className="mt-1 flex items-center gap-2 border border-line rounded-[10px] px-3 py-2.5 focus-within:border-primary transition-colors">
                <Mail size={15} className="text-muted shrink-0" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@leip.demo"
                  className="w-full border-none outline-none text-[13px] bg-transparent"
                />
              </div>
            </label>

            <label className="text-[12px] font-medium text-ink">
              Password
              <div className="mt-1 flex items-center gap-2 border border-line rounded-[10px] px-3 py-2.5 focus-within:border-primary transition-colors">
                <Lock size={15} className="text-muted shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-none outline-none text-[13px] bg-transparent"
                />
                <button type="button" onClick={() => setShowPassword((s) => !s)} className="text-muted shrink-0">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </label>

            {error && (
              <div className="flex items-center gap-1.5 text-[12px] text-alert-red bg-alert-red-soft rounded-[8px] px-2.5 py-2">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 bg-gradient-to-r from-primary to-[#0C4A70] text-white text-[13px] font-semibold rounded-[10px] py-3 hover:opacity-90 transition-opacity disabled:opacity-60 shadow-[0_8px_20px_-6px_rgba(15,92,140,0.5)]"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-line">
            <div className="text-[10.5px] text-muted mb-2 font-semibold uppercase tracking-wide">Quick demo access</div>
            <div className="grid grid-cols-2 gap-1.5">
              {DEMO_LOGINS.map((d) => (
                <button
                  key={d.email}
                  onClick={() => {
                    setEmail(d.email);
                    setPassword('demo1234');
                  }}
                  className="text-[11.5px] text-left px-2.5 py-2 rounded-[8px] border border-line hover:border-primary hover:bg-primary-soft transition-colors"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatPill({ icon: Icon, value, label }: { icon: typeof Activity; value: string; label: string }) {
  return (
    <div className="bg-white/[0.07] border border-white/10 rounded-[12px] px-2.5 py-2.5 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 text-[#5DEAD4]">
        <Icon size={13} />
        <span className="font-mono font-bold text-[15px]">{value}</span>
      </div>
      <div className="text-[9.5px] text-[#B9CBE3] mt-0.5 leading-tight">{label}</div>
    </div>
  );
}
