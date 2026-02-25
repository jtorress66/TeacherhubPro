import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSchool } from '../contexts/SchoolContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './ui/button';
import LanguageSelector from './LanguageSelector';
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
  ChevronRight,
  FileText,
  BarChart3,
  Briefcase,
  CreditCard,
  Shield,
  Sparkles,
  Moon,
  Sun,
  Presentation,
  GraduationCap,
  Brain,
  TrendingUp,
  Gamepad2,
  Rocket
} from 'lucide-react';
import { cn } from '../lib/utils';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const { school, branding } = useSchool();
  const { isDarkMode, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('dashboard'), gradient: 'from-blue-400 to-blue-600' },
    { path: '/ai-assistant', icon: Sparkles, label: language === 'es' ? 'Asistente IA' : 'AI Assistant', gradient: 'from-purple-500 to-pink-500', isNew: true },
    { path: '/adaptive-learning', icon: Brain, label: language === 'es' ? 'Aprendizaje Adaptativo' : 'Adaptive Learning', gradient: 'from-pink-400 to-purple-600', isNew: true },
    { path: '/student-progress', icon: TrendingUp, label: language === 'es' ? 'Progreso Estudiante' : 'Student Progress', gradient: 'from-indigo-400 to-purple-500', isNew: true },
    { path: '/games', icon: Gamepad2, label: language === 'es' ? 'Juegos Educativos' : 'Educational Games', gradient: 'from-orange-400 to-pink-500', isNew: true },
    { path: '/teacher/play-to-learn', icon: Rocket, label: 'Play to Learn', gradient: 'from-indigo-500 to-purple-600', isNew: true },
    { path: '/presentations', icon: Presentation, label: language === 'es' ? 'Presentaciones' : 'Presentations', gradient: 'from-cyan-400 to-blue-500', isNew: true },
    { path: '/planner', icon: Calendar, label: t('planner'), gradient: 'from-purple-400 to-purple-600' },
    { path: '/templates', icon: FileText, label: language === 'es' ? 'Plantillas' : 'Templates', gradient: 'from-indigo-400 to-indigo-600' },
    { path: '/attendance', icon: ClipboardCheck, label: t('attendance'), gradient: 'from-teal-400 to-teal-600' },
    { path: '/attendance/reports', icon: BarChart3, label: language === 'es' ? 'Rep. Asistencia' : 'Attendance Rpt', gradient: 'from-cyan-400 to-cyan-600' },
    { path: '/gradebook', icon: BookOpen, label: t('gradebook'), gradient: 'from-rose-400 to-rose-600' },
    { path: '/gradebook/reports', icon: BarChart3, label: language === 'es' ? 'Rep. Notas' : 'Grade Report', gradient: 'from-pink-400 to-pink-600' },
    { path: '/report-cards', icon: GraduationCap, label: language === 'es' ? 'Boletas' : 'Report Cards', gradient: 'from-emerald-400 to-green-600', isNew: true },
    { path: '/classes', icon: Users, label: t('classes'), gradient: 'from-green-400 to-emerald-600' },
    { path: '/substitute-packet', icon: Briefcase, label: language === 'es' ? 'Paquete Sustituto' : 'Sub Packet', gradient: 'from-orange-400 to-orange-600' },
    { path: '/pricing', icon: CreditCard, label: language === 'es' ? 'Suscripción' : 'Pricing', gradient: 'from-amber-400 to-amber-600' },
    { path: '/settings', icon: Settings, label: t('settings'), gradient: 'from-slate-400 to-slate-600' },
    // Super Admin only
    ...(user?.role === 'super_admin' ? [
      { path: '/admin', icon: Shield, label: 'Admin Panel', superAdmin: true, gradient: 'from-violet-400 to-violet-600' }
    ] : [])
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className={cn("min-h-screen", isDarkMode ? "bg-background" : "paper-bg")}>
      {/* Mobile Header */}
      <header className={cn(
        "lg:hidden fixed top-0 left-0 right-0 z-50 border-b border-border/50 px-4 py-3",
        isDarkMode 
          ? "bg-gradient-to-r from-slate-800 via-slate-800/95 to-emerald-900/30" 
          : "bg-gradient-to-r from-lime-50 via-emerald-50/80 to-white"
      )}>
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
            <div className="flex items-center gap-2">
              <div 
                className="p-1.5 rounded-lg shadow-md"
                style={{ background: `linear-gradient(135deg, ${branding.primary_color}, ${branding.secondary_color})` }}
              >
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-heading font-bold text-foreground">TeacherHubPro</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              title={isDarkMode ? (language === 'es' ? 'Modo claro' : 'Light mode') : (language === 'es' ? 'Modo oscuro' : 'Dark mode')}
            >
              {isDarkMode ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5" />}
            </Button>
            <LanguageSelector variant="compact" />
          </div>
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
        "fixed top-0 left-0 z-50 h-full w-64 bg-card/95 backdrop-blur-xl border-r border-border transform transition-transform duration-200 ease-in-out shadow-xl lg:shadow-none",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo - Enhanced header with gradient background */}
          <div className={cn(
            "p-5 border-b border-border/50",
            isDarkMode 
              ? "bg-gradient-to-br from-slate-800 via-slate-800/95 to-emerald-900/30" 
              : "bg-gradient-to-br from-lime-50 via-emerald-50/80 to-white"
          )}>
            <div className="flex items-center justify-between">
              <Link to="/dashboard" className="flex items-center gap-4 group">
                {/* Show TeacherHubPro logo for Platform Admin (super_admin with no school) */}
                {user?.role === 'super_admin' && !school?.school_id ? (
                  <img 
                    src="https://customer-assets.emergentagent.com/job_teachersuite/artifacts/swlef12w_ChatGPT%20Image%20Feb%2015%2C%202026%2C%2009_08_36%20PM.png"
                    alt="TeacherHubPro" 
                    className="h-14 w-14 object-contain rounded-xl border-2 border-white/80 bg-white p-1.5 shadow-lg group-hover:shadow-xl transition-all duration-200"
                  />
                ) : school?.logo_url ? (
                  <img 
                    src={school.logo_url} 
                    alt={school.name} 
                    className="h-14 w-14 object-contain rounded-xl border-2 border-white/80 bg-white p-1.5 shadow-lg group-hover:shadow-xl transition-all duration-200"
                  />
                ) : (
                  <div 
                    className="p-3 rounded-xl shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-200"
                    style={{ background: `linear-gradient(135deg, ${branding.primary_color}, ${branding.secondary_color})` }}
                  >
                    <BookOpen className="h-7 w-7 text-white" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span 
                    className="text-xl font-heading font-bold leading-tight tracking-tight"
                    style={{ color: isDarkMode ? '#f8fafc' : branding.secondary_color }}
                  >
                    {user?.role === 'super_admin' && !school?.school_id ? 'TeacherHubPro' : (school?.name || 'TeacherHubPro')}
                  </span>
                  {user?.role === 'super_admin' && !school?.school_id ? (
                    <span className={cn(
                      "text-xs font-medium mt-0.5",
                      isDarkMode ? "text-purple-400" : "text-purple-600"
                    )}>
                      Platform Admin
                    </span>
                  ) : school?.name ? (
                    <span className="text-xs font-medium text-muted-foreground mt-0.5">TeacherHubPro</span>
                  ) : (
                    <span className={cn(
                      "text-xs font-medium mt-0.5",
                      isDarkMode ? "text-emerald-400" : "text-lime-600"
                    )}>
                      {language === 'es' ? 'Tu aula digital' : 'Your digital classroom'}
                    </span>
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
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                    isActive 
                      ? "bg-secondary shadow-md font-medium" 
                      : "text-muted-foreground hover:bg-secondary/60 hover:shadow-sm"
                  )}
                  data-testid={`nav-${item.path.slice(1)}`}
                >
                  <div className={cn(
                    "p-2 rounded-lg bg-gradient-to-br shadow-sm",
                    item.gradient
                  )}>
                    <item.icon className="h-4 w-4 text-white" />
                  </div>
                  <span className={isActive ? "text-foreground" : ""}>{item.label}</span>
                  {item.isNew && (
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold">
                      NEW
                    </span>
                  )}
                  {isActive && !item.isNew && (
                    <ChevronRight 
                      className="h-4 w-4 ml-auto text-muted-foreground"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-border bg-secondary/50">
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
                <p className="font-medium text-foreground truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            
            <div className="flex gap-2 items-center">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={toggleTheme}
                title={isDarkMode ? (language === 'es' ? 'Modo claro' : 'Light mode') : (language === 'es' ? 'Modo oscuro' : 'Dark mode')}
              >
                {isDarkMode ? <Sun className="h-4 w-4 mr-2 text-amber-500" /> : <Moon className="h-4 w-4 mr-2" />}
                {isDarkMode ? (language === 'es' ? 'Claro' : 'Light') : (language === 'es' ? 'Oscuro' : 'Dark')}
              </Button>
              <LanguageSelector variant="compact" dropdownPosition="up" />
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950 dark:hover:text-red-400"
              onClick={handleLogout}
              data-testid="logout-btn"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t('logout')}
            </Button>
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
