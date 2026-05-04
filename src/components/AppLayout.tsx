import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, LayoutDashboard, Upload, History, User, Home, LogOut, Menu, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { isAdminEmail } from '@/lib/admin';
import { Button } from './ui/button';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { goToSupportSection } from '@/lib/supportNavigation';

const userNavItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/detect', icon: Upload, label: 'Detect' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const adminNavItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/admin-dashboard', icon: LayoutDashboard, label: 'Analytics' },
];

const supportNavLabel = 'Support';

const AppLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const adminSession = isAdminEmail(user?.email);
  const navItems = adminSession ? adminNavItems : userNavItems;
  const logoTarget = adminSession ? '/admin-dashboard' : '/dashboard';

  const handleSupportClick = () => {
    goToSupportSection(navigate, location.pathname);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <nav className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to={logoTarget} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-bold text-foreground">DeepGuard</span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link key={item.to} to={item.to} className="relative px-3 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-muted">
                  <span className={active ? 'text-primary' : 'text-muted-foreground'}>
                    <item.icon className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </span>
                  {active && (
                    <motion.div layoutId="nav-active" className="absolute inset-0 rounded-xl bg-primary/10 -z-10" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
                  )}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={handleSupportClick}
              className="relative px-3 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-primary/5 hover:text-primary text-muted-foreground"
            >
              <Heart className="w-4 h-4 inline mr-1.5 -mt-0.5" />
              {supportNavLabel}
            </button>
            {adminSession && (
              <Button onClick={handleLogout} variant="ghost" size="sm" className="px-3 py-2 rounded-xl gap-1.5 text-muted-foreground hover:text-foreground">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-sm">
                <SheetHeader className="text-left">
                  <SheetTitle className="font-heading text-xl">DeepGuard</SheetTitle>
                </SheetHeader>
                <div className="mt-8 space-y-2">
                  {navItems.map((item) => (
                    <SheetClose asChild key={item.to}>
                      <Link
                        to={item.to}
                        className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        <item.icon className="w-4 h-4 text-primary" />
                        {item.label}
                      </Link>
                    </SheetClose>
                  ))}
                  <SheetClose asChild>
                    <button
                      type="button"
                      onClick={handleSupportClick}
                      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-foreground hover:bg-primary/5 hover:text-primary transition-colors cursor-pointer"
                    >
                      <Heart className="w-4 h-4 text-primary" />
                      {supportNavLabel}
                    </button>
                  </SheetClose>
                  {adminSession && (
                    <SheetClose asChild>
                      <Button onClick={handleLogout} variant="ghost" className="w-full justify-start rounded-2xl px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted">
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </Button>
                    </SheetClose>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
