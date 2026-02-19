import React from 'react';
import { MODULES } from '../constants';
import { ModuleId } from '../types';
import { LogOut, Box } from 'lucide-react';

interface SidebarProps {
  activeModule: ModuleId;
  onNavigate: (id: ModuleId) => void;
  onLogout: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeModule, onNavigate, onLogout, isMobileOpen, setIsMobileOpen }) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 left-0 z-30 h-full w-72 bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo Area */}
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-3 text-white">
              <div className="bg-emerald-600 p-2 rounded-lg">
                <Box size={24} />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight">Simple-LMS</h1>
                <p className="text-xs text-slate-400 font-medium tracking-wide">FRANKSTON PACKAGING</p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
            {MODULES.map((module) => {
              const isActive = activeModule === module.id;
              const Icon = module.icon;
              return (
                <button
                  key={module.id}
                  onClick={() => {
                    onNavigate(module.id);
                    setIsMobileOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                      : 'hover:bg-slate-800 text-slate-400 hover:text-white'}
                  `}
                >
                  <Icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
                  <span className="truncate">{module.label}</span>
                </button>
              );
            })}
          </div>

          {/* User Profile / Logout */}
          <div className="p-4 border-t border-slate-800">
            <button
              onClick={onLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
            <div className="mt-4 px-2 text-xs text-slate-600 text-center">
              v1.0.0 &copy; 2024 Frankston
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;