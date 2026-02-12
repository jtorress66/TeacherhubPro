import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSchool } from '../contexts/SchoolContext';
import { Button } from './ui/button';
import { 
  LayoutDashboard, 
  Calendar, 
  ClipboardCheck, 
  BookOpen, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  X,
  Globe,
  ChevronRight,
  FileText,
  BarChart3,
  Briefcase,
  CreditCard,
  Shield
} from 'lucide-react';
import { cn } from '../lib/utils';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const { school, branding } = useSchool();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { path: '/planner', icon: Calendar, label: t('planner') },
    { path: '/templates', icon: FileText, label: language === 'es' ? 'Plantillas' : 'Templates' },
    { path: '/attendance', icon: ClipboardCheck, label: t('attendance') },
    { path: '/attendance/reports', icon: BarChart3, label: language === 'es' ? 'Rep. Asistencia' : 'Attendance Rpt' },
    { path: '/gradebook', icon: BookOpen, label: t('gradebook') },
    { path: '/gradebook/reports', icon: BarChart3, label: language === 'es' ? 'Rep. Notas' : 'Grade Report' },
    { path: '/classes', icon: Users, label: t('classes') },
    { path: '/substitute-packet', icon: Briefcase, label: language === 'es' ? 'Paquete Sustituto' : 'Sub Packet' },
    { path: '/pricing', icon: CreditCard, label: language === 'es' ? 'Suscripción' : 'Pricing' },
    { path: '/settings', icon: Settings, label: t('settings') },
    // Super Admin only
    ...(user?.role === 'super_admin' ? [
      { path: '/admin', icon: Shield, label: 'Admin Panel', superAdmin: true }
    ] : [])
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen paper-bg">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSidebarOpen(true)}
              data-testid="mobile-menu-btn"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span className="text-lg font-heading font-bold text-slate-800">TeacherHubPro</span>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleLanguage}>
            <Globe className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-white/90 backdrop-blur-xl border-r border-slate-200/50 transform transition-transform duration-200 ease-in-out shadow-xl lg:shadow-none",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo - School branded or default */}
          <div className="p-6 border-b border-slate-200/50">
            <div className="flex items-center justify-between">
              <Link to="/dashboard" className="flex items-center gap-3 group">
                {school?.logo_url ? (
                  <img 
                    src={school.logo_url} 
                    alt={school.name} 
                    className="h-10 w-10 object-contain rounded-lg border bg-white p-1"
                  />
                ) : (
                  <div 
                    className="p-2 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow"
                    style={{ background: `linear-gradient(135deg, ${branding.primary_color}, ${branding.secondary_color})` }}
                  >
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span 
                    className="text-lg font-heading font-bold leading-tight"
                    style={{ color: branding.secondary_color }}
                  >
                    {school?.name || 'TeacherHubPro'}
                  </span>
                  {school?.name && (
                    <span className="text-xs text-slate-500">TeacherHubPro</span>
                  )}
                </div>
              </Link>
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              const activeStyle = item.superAdmin 
                ? { backgroundColor: '#f3e8ff', color: '#7c3aed' }
                : { backgroundColor: `${branding.primary_color}15`, color: branding.primary_color };
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    item.superAdmin 
                      ? isActive 
                        ? "font-medium shadow-sm"
                        : "text-purple-600 hover:bg-purple-50 hover:text-purple-700 border border-purple-200"
                      : isActive 
                        ? "font-medium shadow-sm" 
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                  )}
                  style={isActive ? activeStyle : {}}
                  data-testid={`nav-${item.path.slice(1)}`}
                >
                  <item.icon 
                    className="h-5 w-5" 
                    style={isActive && !item.superAdmin ? { color: branding.primary_color } : item.superAdmin ? { color: '#7c3aed' } : {}}
                  />
                  <span>{item.label}</span>
                  {isActive && (
                    <ChevronRight 
                      className="h-4 w-4 ml-auto" 
                      style={{ color: item.superAdmin ? '#7c3aed' : branding.primary_color }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-slate-200/50 bg-slate-50/50">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center overflow-hidden shadow-md">
                {user?.picture ? (
                  <img src={user.picture} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-medium text-white">
                    {user?.name?.charAt(0) || 'T'}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 hover:bg-slate-100"
                onClick={toggleLanguage}
              >
                <Globe className="h-4 w-4 mr-2" />
                {language.toUpperCase()}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                onClick={handleLogout}
                data-testid="logout-btn"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t('logout')}
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-6 pt-20 lg:pt-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
