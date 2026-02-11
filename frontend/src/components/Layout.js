import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
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
  CreditCard
} from 'lucide-react';
import { cn } from '../lib/utils';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { path: '/planner', icon: Calendar, label: t('planner') },
    { path: '/templates', icon: FileText, label: language === 'es' ? 'Plantillas' : 'Templates' },
    { path: '/attendance', icon: ClipboardCheck, label: t('attendance') },
    { path: '/attendance/reports', icon: BarChart3, label: language === 'es' ? 'Reportes' : 'Reports' },
    { path: '/gradebook', icon: BookOpen, label: t('gradebook') },
    { path: '/classes', icon: Users, label: t('classes') },
    { path: '/substitute-packet', icon: Briefcase, label: language === 'es' ? 'Paquete Sustituto' : 'Sub Packet' },
    { path: '/pricing', icon: CreditCard, label: language === 'es' ? 'Suscripción' : 'Pricing' },
    { path: '/settings', icon: Settings, label: t('settings') },
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
          {/* Logo */}
          <div className="p-6 border-b border-slate-200/50">
            <div className="flex items-center justify-between">
              <Link to="/dashboard" className="flex items-center gap-3 group">
                <div className="p-2 rounded-xl bg-gradient-to-br from-green-600 to-green-700 shadow-lg group-hover:shadow-xl transition-shadow">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-heading font-bold text-slate-800">TeacherHubPro</span>
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
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    isActive 
                      ? "bg-green-100 text-green-700 font-medium shadow-sm" 
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                  )}
                  data-testid={`nav-${item.path.slice(1)}`}
                >
                  <item.icon className={cn("h-5 w-5", isActive && "text-green-600")} />
                  <span>{item.label}</span>
                  {isActive && <ChevronRight className="h-4 w-4 ml-auto text-green-500" />}
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
