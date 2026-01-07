import React from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, Users, BarChart3, Menu } from 'lucide-react';

interface LayoutProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, onNavigate, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState; icon: any; label: string }) => (
    <button
      onClick={() => {
        onNavigate(view);
        setIsMobileMenuOpen(false);
      }}
      className={`w-full flex items-center space-x-3 px-6 py-4 transition-colors duration-200 
        ${currentView === view 
          ? 'bg-blue-600 text-white border-r-4 border-blue-800' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 shadow-xl z-20">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <UtensilsCrossed className="text-blue-500" />
            <span>Catering<span className="text-blue-500">PRO</span></span>
          </h1>
        </div>
        <nav className="flex-1 py-6 overflow-y-auto">
          <NavItem view="DASHBOARD" icon={LayoutDashboard} label="Обзор" />
          <NavItem view="ORDERS" icon={ShoppingBag} label="Заказы" />
          <NavItem view="MENU" icon={UtensilsCrossed} label="Меню блюд" />
          <NavItem view="CLIENTS" icon={Users} label="Клиенты" />
          <NavItem view="REPORTS" icon={BarChart3} label="Отчеты" />
        </nav>
        <div className="p-4 bg-slate-950 text-xs text-slate-500 text-center">
          v1.0.0 Prototype
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between shadow-md z-30">
             <div className="flex items-center gap-2 font-bold text-lg">
                <UtensilsCrossed className="text-blue-500" />
                <span>CateringPRO</span>
             </div>
             <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
               <Menu size={24} />
             </button>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-14 left-0 w-full bg-slate-900 shadow-xl z-20 border-t border-slate-800">
             <nav className="flex flex-col py-2">
                <NavItem view="DASHBOARD" icon={LayoutDashboard} label="Обзор" />
                <NavItem view="ORDERS" icon={ShoppingBag} label="Заказы" />
                <NavItem view="MENU" icon={UtensilsCrossed} label="Меню блюд" />
                <NavItem view="CLIENTS" icon={Users} label="Клиенты" />
                <NavItem view="REPORTS" icon={BarChart3} label="Отчеты" />
             </nav>
          </div>
        )}

        <main className="flex-1 overflow-auto p-4 md:p-8 bg-slate-50 relative">
            <div className="max-w-7xl mx-auto h-full">
                 {children}
            </div>
        </main>
      </div>
    </div>
  );
};
