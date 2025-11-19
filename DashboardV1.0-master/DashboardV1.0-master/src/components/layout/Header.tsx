import React from 'react';
import { ChevronDown, LogOut } from 'lucide-react';
import { BusinessType, Company } from '../../types';

interface HeaderProps {
  businessType: BusinessType;
  company: Company | null;
  showProfileMenu: boolean;
  onToggleProfileMenu: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({
  businessType,
  company,
  showProfileMenu,
  onToggleProfileMenu,
  onLogout
}) => {
  const getHeaderTitle = () => {
    if (businessType === 'sales') return 'Sales Analytics';
    if (businessType === 'marketing') return 'Marketing Intelligence';
    if (businessType === 'both') return 'Business Intelligence';
    return 'IATA';
  };

  return (
    <header className="bg-white border-b border-[#DDDDDD] px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">
            {getHeaderTitle()}
          </h1>
          <p className="text-[#2D89C7]">
            {company?.name} • {company?.industry}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              onClick={onToggleProfileMenu}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-[#F5F5F5] transition-colors"
            >
              <div className="w-8 h-8 bg-[#FAC141] rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-[#1A1A1A]">
                  {company?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-[#2D89C7]" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-[#DDDDDD] py-2 z-50">
                <button
                  onClick={onLogout}
                  className="w-full flex items-center px-4 py-2 text-left text-[#E94B87] hover:bg-[#E94B87]/10 transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 