import React from 'react';
import { User, UserRole } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Briefcase, 
  ShieldCheck, 
  LogOut, 
  Menu,
  Database,
  Search,
  Settings,
  PieChart,
  Building,
  Calendar,
  ClipboardList,
  CheckSquare,
  UserCircle,
  Activity
} from 'lucide-react';
import { SyncIndicator } from './UI';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
  isSyncing: boolean;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ user, onLogout, children, isSyncing, currentPage, onNavigate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    const applyMode = (matches: boolean) => {
      setIsMobile(matches);
      setIsSidebarOpen(!matches);
    };
    applyMode(mediaQuery.matches);
    const listener = (event: MediaQueryListEvent) => applyMode(event.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  const getNavItems = () => {
    switch (user.role) {
      case UserRole.ADMIN:
        return [
          { id: 'admin-dash', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'admin-users', label: 'User Management', icon: Users },
          { id: 'admin-config', label: 'MPR Configuration', icon: Settings },
          { id: 'admin-compliance', label: 'Blacklist Manager', icon: ShieldCheck },
          { id: 'admin-offers', label: 'Comp & Offers', icon: PieChart },
        ];
      case UserRole.RECRUITER:
        return [
          { id: 'rec-dash', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'rec-agency-approved', label: 'Approved Agency', icon: ShieldCheck },
          { id: 'rec-agency-profiles', label: 'Agency Profiles', icon: Building },
          { id: 'rec-jobs', label: 'Job Postings', icon: Briefcase },
          { id: 'rec-mpr', label: 'MPR Handling', icon: ClipboardList },
          { id: 'rec-candidates', label: 'Candidates', icon: Users },
          { id: 'rec-interviews', label: 'Interviews', icon: Calendar },
          { id: 'rec-offers', label: 'Offers & Joining', icon: FileText },
        ];
      case UserRole.MANAGER:
        return [
          { id: 'mgr-hub', label: 'Manager Hub', icon: LayoutDashboard },
          { id: 'mgr-requests', label: 'My Requests', icon: FileText },
          { id: 'mgr-interviews', label: 'Interview Panel', icon: CheckSquare },
        ];
      case UserRole.CANDIDATE:
        return [
          { id: 'cand-jobs', label: 'Job Board', icon: Search },
          { id: 'cand-profile', label: 'My Profile', icon: UserCircle },
          { id: 'cand-status', label: 'Application Status', icon: Activity },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {isMobile && isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-10" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside 
        className={`bg-indigo-950 text-indigo-100 flex flex-col transition-all duration-300 ease-in-out z-20 ${
          isMobile
            ? `fixed inset-y-0 left-0 w-72 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : isSidebarOpen ? 'w-72' : 'w-20'
        }`}
      >
        <div className="h-20 flex items-center px-6 border-b border-indigo-900/50">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="font-black text-white text-lg">H</span>
            </div>
            {isSidebarOpen && (
              <span className="font-black text-xl tracking-tight text-white">HIREPULSE</span>
            )}
          </div>
        </div>

        <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto">
          {getNavItems().map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                if (isMobile) setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-4 rounded-[1.5rem] transition-all duration-200 group ${
                currentPage === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                  : 'text-indigo-300 hover:bg-indigo-900 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${currentPage === item.id ? 'text-white' : 'text-indigo-400 group-hover:text-white'}`} />
              {(isSidebarOpen || isMobile) && (
                <span className="text-sm font-bold tracking-wide uppercase">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-indigo-900/50">
          <div className={`flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
            {(isSidebarOpen || isMobile) && (
              <div className="flex items-center space-x-3">
                <img src={user.avatar} alt="User" className="w-10 h-10 rounded-full border-2 border-indigo-500" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white uppercase">{user.name}</span>
                  <span className="text-[10px] text-indigo-400 font-bold tracking-wider">{user.role}</span>
                </div>
              </div>
            )}
            <button onClick={onLogout} className="p-2 text-indigo-400 hover:text-white hover:bg-indigo-900 rounded-full transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <header className="h-16 lg:h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 md:px-6 lg:px-8 sticky top-0 z-10">
          <div className="flex items-center space-x-3 min-w-0">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-sm md:text-lg lg:text-xl font-black text-slate-800 tracking-tight uppercase truncate">
              {getNavItems().find(i => i.id === currentPage)?.label || 'System Dashboard'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-4 lg:space-x-6">
            <SyncIndicator isSyncing={isSyncing} />
            <div className="hidden md:flex items-center space-x-2 px-4 py-1.5 bg-slate-100 rounded-full border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">System Operator Active</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-4 md:space-y-6 lg:space-y-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
