import { 
  BarChart3, 
  MessageCircle,
  Network
} from 'lucide-react';
import { BusinessType, SidebarSection } from '../types';

export const getSidebarSections = (_businessType: BusinessType): SidebarSection[] => {
  const baseSections: SidebarSection[] = [
    { id: 'home', name: 'Dashboard', icon: BarChart3 },
    { id: 'competitor-chat', name: 'Competitor Intelligence', icon: MessageCircle },
    { id: 'knowledge-graph', name: 'Knowledge Graph', icon: Network }
  ];

  return baseSections;
}; 