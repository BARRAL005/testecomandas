import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Wine, 
  Users, 
  History, 
  DollarSign, 
  TrendingUp, 
  Settings, 
  LogOut,
  Sparkles,
  UserCheck,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PitStopLogo from './PitStopLogo';

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  adminName: string;
  totalOpenComandas: number;
  userPhoto?: string;
  onLogout?: () => void;
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ 
  currentTab, 
  setTab, 
  adminName, 
  totalOpenComandas,
  userPhoto,
  onLogout,
  isOpenOnMobile = false,
  onCloseMobile
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'comandas', name: 'Comandas', icon: Receipt, badge: totalOpenComandas > 0 ? totalOpenComandas : undefined },
    { id: 'consignacoes', name: 'Consignações', icon: Sparkles },
    { id: 'produtos', name: 'Produtos', icon: Wine },
    { id: 'clientes', name: 'Clientes', icon: Users },
    { id: 'historico', name: 'Histórico', icon: History },
    { id: 'caixa', name: 'Caixa', icon: DollarSign },
    { id: 'relatorios', name: 'Relatórios', icon: TrendingUp },
    { id: 'configuracoes', name: 'Configurações', icon: Settings },
  ];

  const handleTabClick = (tabId: string) => {
    setTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    }
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  // Shared Sidebar contents to keep desktop/mobile perfectly in sync and clean
  const renderSidebarContents = () => (
    <>
      {/* Top Section - Brand */}
      <div className="flex flex-col items-center pt-2">
        {/* PitStop COHAB Animated Logo Brand */}
        <PitStopLogo size="md" className="mb-6" />

        {/* Separator */}
        <div className="w-full h-px bg-slate-800 mb-6" />

        {/* Navigation Items */}
        <nav className="w-full space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            
            return (
              <button
                key={item.id}
                id={`sidebar-item-${item.id}`}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative group overflow-hidden ${
                  isActive 
                    ? 'text-slate-950 font-semibold' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                {/* Active Gold Fill Animation */}
                {isActive && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute inset-0 bg-gold-500 z-0 gold-glow-strong"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                
                <span className="flex items-center gap-3 z-10">
                  <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-gold-400 group-hover:scale-115 transition-all duration-300'}`} />
                  {item.name}
                </span>

                {item.badge !== undefined && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold z-10 ${
                    isActive 
                      ? 'bg-slate-950 text-gold-500' 
                      : 'bg-gold-500/10 text-gold-500 border border-gold-500/20'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section - User Admin Profile Info */}
      <div className="flex flex-col gap-3">
        <div className="p-3 bg-slate-900/60 border border-slate-900 rounded-2xl flex items-center gap-3">
          {userPhoto ? (
            <img 
              src={userPhoto} 
              alt={adminName} 
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-xl object-cover border border-gold-500/20 shrink-0 shadow-sm" 
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-center text-gold-500 shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
          )}
          <div className="overflow-hidden">
            <h4 className="text-sm font-semibold text-white truncate">{adminName}</h4>
            <span className="text-[10px] font-medium text-gold-500 tracking-wider uppercase block">Operador</span>
          </div>
        </div>

        <button 
          id="logout-btn"
          onClick={handleLogoutClick}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border border-slate-900 text-slate-400 hover:text-red-400 hover:bg-slate-900/35 hover:border-red-500/20 transition-all duration-300 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
        <span className="text-[10px] text-center text-slate-600 block">Pit Stop Cohab © 2026</span>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent Sidebar displayed on medium screens and up) */}
      <aside 
        id="sidebar-desktop" 
        className="hidden md:flex w-68 h-screen bg-slate-950 border-r border-slate-900 flex-col justify-between p-4 sticky top-0 shrink-0 z-40 select-none"
      >
        {renderSidebarContents()}
      </aside>

      {/* Mobile Slider Drawer Sidebar (Animated Slide overlay displayed on mobile screen width trigger) */}
      <AnimatePresence>
        {isOpenOnMobile && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Dark blur backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50"
            />

            {/* Slide and Bounce Content Container */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="relative w-72 max-w-[85vw] h-full bg-slate-950 border-r border-slate-900 flex flex-col justify-between p-5 z-55 select-none shadow-2xl"
            >
              {/* Close Button on Mobile Slide Menu */}
              <button
                type="button"
                onClick={onCloseMobile}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {renderSidebarContents()}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
