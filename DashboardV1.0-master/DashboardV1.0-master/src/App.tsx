import React, { useState, useEffect } from 'react';
import { BusinessType, Company, ActiveSection } from './types';
import { getSidebarSections } from './utils/sidebarUtils';

// Import components
import BusinessTypeSelection from './components/BusinessTypeSelection';
import CompanySetup from './components/CompanySetup';
import CompetitorSelection from './components/CompetitorSelection';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import HomeDashboard from './components/dashboard/HomeDashboard';
import CompetitorsSection from './components/dashboard/CompetitorsSection';
import CompanyTracker from './components/dashboard/CompanyTracker';
import DecisionAssistant from './components/dashboard/DecisionAssistant';
import SalesDashboard from './components/dashboard/SalesDashboard';
import MarketingDashboard from './components/dashboard/MarketingDashboard';
import SalesPatterns from './components/patterns/SalesPatterns';
import MarketingPatterns from './components/patterns/MarketingPatterns';
import CompetitorChat from './components/dashboard/CompetitorChat';
import KnowledgeGraphVisualization from './components/knowledge-graph/KnowledgeGraphVisualization';

function App() {
  const [company, setCompany] = useState<Company | null>(null);
  const [currentStep, setCurrentStep] = useState<'business-type' | 'company-setup' | 'competitor-selection' | 'dashboard'>('business-type');
  const [activeSection, setActiveSection] = useState<ActiveSection>('home');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [businessType, setBusinessType] = useState<BusinessType>(null);

  // Load saved company data
  useEffect(() => {
    const savedCompany = localStorage.getItem('company-data');
    if (savedCompany) {
      const companyData = JSON.parse(savedCompany);
      setCompany(companyData);
      setCurrentStep('dashboard');
      setBusinessType(companyData.businessType);
    }
  }, []);

  const handleBusinessTypeSelection = (type: BusinessType) => {
    setBusinessType(type);
    setCurrentStep('company-setup');
  };

  const handleCompanySetup = (companyName: string, industry: string) => {
    if (businessType === 'sales') {
      const companyData: Company = {
        name: companyName,
        industry: 'technology', // Default industry for sales
        businessType,
        competitors: []
      };
      setCompany(companyData);
      localStorage.setItem('company-data', JSON.stringify(companyData));
      setCurrentStep('dashboard');
    } else {
      setCurrentStep('competitor-selection');
    }
  };

  const handleCompetitorSelection = (competitors: string[]) => {
    if (!company) return;
    
    const companyData: Company = {
      ...company,
      competitors
    };
    setCompany(companyData);
    localStorage.setItem('company-data', JSON.stringify(companyData));
    setCurrentStep('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('company-data');
    setCompany(null);
    setCurrentStep('business-type');
    setBusinessType(null);
    setActiveSection('home');
    setShowProfileMenu(false);
  };

  const renderMainContent = () => {
    switch (activeSection) {
      case 'home':
        return <HomeDashboard businessType={businessType} company={company} onSectionChange={setActiveSection} />;
      case 'competitors':
        return <CompetitorsSection company={company} />;
      case 'competitor-chat':
        return <CompetitorChat />;
      case 'knowledge-graph':
        return <KnowledgeGraphVisualization />;
      case 'company-tracker':
        return <CompanyTracker />;
      case 'decision-assistant':
        return <DecisionAssistant businessType={businessType} />;
      case 'sales-dashboard':
        return <SalesDashboard />;
      case 'marketing-dashboard':
        return <MarketingDashboard />;
      case 'sales-patterns':
        return <SalesPatterns />;
      case 'marketing-patterns':
        return <MarketingPatterns />;
      default:
        return <HomeDashboard businessType={businessType} company={company} onSectionChange={setActiveSection} />;
    }
  };

  // Business Type Selection Screen
  if (currentStep === 'business-type') {
    return <BusinessTypeSelection onBusinessTypeSelect={handleBusinessTypeSelection} />;
  }

  // Company Setup Screen
  if (currentStep === 'company-setup') {
    return <CompanySetup businessType={businessType} onCompanySetup={handleCompanySetup} />;
  }

  // Competitor Selection Screen
  if (currentStep === 'competitor-selection') {
    return <CompetitorSelection industry={company?.industry || ''} onCompetitorSelection={handleCompetitorSelection} />;
  }

  // Main Dashboard
  const sidebarSections = getSidebarSections(businessType);

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex">
      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        company={company}
        showProfileMenu={showProfileMenu}
        onToggleProfileMenu={() => setShowProfileMenu(!showProfileMenu)}
        onLogout={handleLogout}
        sections={sidebarSections}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header
          businessType={businessType}
          company={company}
          showProfileMenu={showProfileMenu}
          onToggleProfileMenu={() => setShowProfileMenu(!showProfileMenu)}
          onLogout={handleLogout}
        />

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
}

export default App;