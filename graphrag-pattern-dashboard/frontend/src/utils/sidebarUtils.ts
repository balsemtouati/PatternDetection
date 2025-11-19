import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  MessageSquare, 
  Upload, 
  Target,
  DollarSign,
  Award
} from 'lucide-react';
import { BusinessType, SidebarSection } from '../types';

export const getSidebarSections = (businessType: BusinessType): SidebarSection[] => {
  const baseSections: SidebarSection[] = [
    { id: 'home', name: 'Dashboard', icon: BarChart3 }
  ];

  if (businessType === 'marketing' || businessType === 'both') {
    baseSections.push({ id: 'competitors', name: 'Competitors', icon: Users });
  }

  if (businessType === 'sales' || businessType === 'both') {
    baseSections.push({ id: 'sales-patterns', name: 'Sales Patterns', icon: Award });
  }

  if (businessType === 'marketing' || businessType === 'both') {
    baseSections.push({ id: 'marketing-patterns', name: 'Marketing Patterns', icon: Target });
  }

  if (businessType === 'both') {
    baseSections.push(
      { id: 'sales-dashboard', name: 'Sales Dashboard', icon: DollarSign },
      { id: 'marketing-dashboard', name: 'Marketing Dashboard', icon: Target }
    );
  }

  baseSections.push(
    { id: 'company-tracker', name: 'Company Tracker', icon: Upload },
    { id: 'decision-assistant', name: 'Decision Assistant', icon: MessageSquare }
  );

  return baseSections;
}; 