import { LayoutDashboard, Ambulance, Users, Building2, FileText, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import Logo, { LogoMark } from './Logo';

interface NavItem {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
}

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  ems_command: [
    { icon: LayoutDashboard, label: 'Command Center', path: '/ems' },
    { icon: Ambulance, label: 'Ambulances', path: '/ems' },
    { icon: Building2, label: 'Hospitals', path: '/ems' },
    { icon: FileText, label: 'Reports', path: '/ems' },
  ],
  ambulance_staff: [{ icon: Ambulance, label: 'My Unit', path: '/ambulance' }],
  doctor: [{ icon: Users, label: 'Incoming Patients', path: '/doctor' }],
  family: [{ icon: LayoutDashboard, label: 'Track Patient', path: '/family' }],
};

const ROLE_LABEL: Record<string, string> = {
  ems_command: 'EMS Command',
  ambulance_staff: 'Ambulance Staff',
  doctor: 'Doctor',
  family: 'Family',
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const nav = user ? NAV_BY_ROLE[user.role] ?? [] : [];
  const initials = user ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('') : '—';

  return (
    <aside className="hidden md:flex md:w-[76px] lg:w-[232px] shrink-0 flex-col bg-gradient-to-b from-navy to-navy-2 text-[#CFE0F5] p-3.5">
      <div className="flex items-center gap-2.5 px-2 pb-5">
        <Logo variant="light" className="h-7 w-auto hidden lg:block" />
        <LogoMark className="lg:hidden" />
        <div className="hidden lg:block">

        </div>
      </div>

      <div className="hidden lg:block text-[10.5px] uppercase tracking-wide text-[#5F7CA0] mx-2.5 mt-3 mb-2">
        Operations
      </div>

      <nav className="flex flex-col gap-1">
        {nav.map(({ icon: Icon, label, path }) => (
          <div
            key={label}
            onClick={() => navigate(path)}
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[9px] text-[13.5px] font-medium cursor-pointer transition-colors ${
              location.pathname === path
                ? 'bg-teal/15 text-[#5DEAD4]'
                : 'text-[#B9CBE3] hover:bg-white/[0.06] hover:text-white'
            }`}
          >
            <Icon size={17} className="shrink-0" />
            <span className="hidden lg:inline">{label}</span>
          </div>
        ))}
      </nav>

      <div
        onClick={() => {
          logout();
          navigate('/login');
        }}
        className="flex items-center gap-2.5 px-2.5 py-2 mt-2 rounded-[9px] text-[13.5px] font-medium cursor-pointer text-[#B9CBE3] hover:bg-white/[0.06] hover:text-white transition-colors"
      >
        <LogOut size={17} className="shrink-0" />
        <span className="hidden lg:inline">Logout</span>
      </div>

      <div className="mt-auto pt-3.5 border-t border-white/[0.08] flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-[9px] bg-teal flex items-center justify-center font-bold text-[12.5px] text-[#04332C] shrink-0">
          {initials}
        </div>
        <div className="hidden lg:block">
          <div className="text-[12.5px] font-semibold text-white">{user?.name ?? '—'}</div>
          <div className="text-[10.5px] text-[#8FA8C7]">{user ? ROLE_LABEL[user.role] : ''}</div>
        </div>
      </div>
    </aside>
  );
}
