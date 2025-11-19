import React from 'react';
import { Zap, ChevronDown, LogOut } from 'lucide-react';
import { ActiveSection, Company, SidebarSection } from '../../types';

interface SidebarProps {
  activeSection: ActiveSection;
  onSectionChange: (section: ActiveSection) => void;
  company: Company | null;
  showProfileMenu: boolean;
  onToggleProfileMenu: () => void;
  onLogout: () => void;
  sections: SidebarSection[];
}

const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSectionChange,
  company,
  showProfileMenu,
  onToggleProfileMenu,
  onLogout,
  sections
}) => {
  return (
    <div className="w-64 bg-gradient-to-b from-[#1A1A1A] via-[#2D89C7] to-[#1A1A1A] text-white flex flex-col">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center">
          <Zap className="h-8 w-8 text-[#FAC141] mr-2" />
          <h1 className="text-xl font-bold">IATA</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                activeSection === section.id
                  ? 'bg-[#7D3083] text-white'
                  : 'text-white/80 hover:bg-[#2D89C7]/50 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5 mr-3" />
              {section.name}
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-[#2D89C7]/30">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#FAC141] rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-[#1A1A1A]">
              {company?.name?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">{company?.name}</p>
            <p className="text-xs text-white/60">{company?.industry}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 