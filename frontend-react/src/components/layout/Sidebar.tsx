import React from 'react';
import type { NavItem } from '../../types';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  brandSubtitle?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  items,
  activeId,
  onSelect,
  brandSubtitle = 'Portal de Servicios',
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[#041E27]/50 backdrop-blur-xs z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-[#DCE2DD]
          flex flex-col transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Top Header inside sidebar */}
        <div className="h-[74px] px-6 border-b border-[#DCE2DD] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <img
                src="/assets/mira-circle-192.png"
                alt="MIRA"
                className="w-7 h-7 object-contain shrink-0"
              />
              <span className="text-lg font-black text-[#062D3A] tracking-tight">MIRA<span className="text-[#7AC143]">.</span></span>
            </div>
            <p className="text-[11px] font-medium text-[#56696D]">{brandSubtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1.5 text-[#8E9FA2] hover:text-[#062D3A] rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {items.map((item) => {
            const isActive = item.id === activeId;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelect(item.id);
                  onClose();
                }}
                className={`
                  w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-semibold
                  transition-all duration-150 cursor-pointer text-left
                  ${isActive
                    ? 'bg-[#EEF7E6] text-[#2D6619] shadow-xs font-bold border-l-4 border-[#7AC143]'
                    : 'text-[#56696D] hover:bg-[#F4F6F4] hover:text-[#062D3A]'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  {item.icon && <span className="w-4 h-4 text-current">{item.icon}</span>}
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`
                      text-xs px-2 py-0.5 rounded-full font-bold
                      ${isActive ? 'bg-[#7AC143] text-white' : 'bg-[#DCE2DD] text-[#062D3A]'}
                    `}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Support / Information Box */}
        <div className="p-4 border-t border-[#DCE2DD] bg-[#F7F9F7]">
          <div className="bg-white p-3 rounded-lg border border-[#DCE2DD] shadow-xs text-xs">
            <p className="font-bold text-[#062D3A]">Atención MIRA</p>
            <p className="text-[#56696D] mt-0.5">Soporte técnico y emergencias 24/7</p>
            <p className="font-bold text-[#7AC143] mt-2">800-MIRA-24</p>
          </div>
        </div>
      </aside>
    </>
  );
};
