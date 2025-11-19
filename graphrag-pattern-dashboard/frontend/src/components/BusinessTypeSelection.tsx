import React from 'react';
import { Zap, DollarSign, Target, BarChart3, ArrowRight } from 'lucide-react';
import { BusinessType } from '../types';

interface BusinessTypeSelectionProps {
  onBusinessTypeSelect: (type: BusinessType) => void;
}

const BusinessTypeSelection: React.FC<BusinessTypeSelectionProps> = ({ onBusinessTypeSelect }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F5F5] via-[#DDDDDD] to-[#1A1A1A] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-4xl w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-[#2D89C7] to-[#7D3083] rounded-2xl flex items-center justify-center mr-4">
              <Zap className="h-10 w-10 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold text-[#1A1A1A]">PatternAI</h1>
              <p className="text-lg text-[#2D89C7]">Intelligent Business Analytics</p>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-[#1A1A1A] mb-4">Choose Your Business Focus</h2>
          <p className="text-lg text-[#2D89C7] max-w-2xl mx-auto">Select the type of analysis that best fits your business needs. Our AI will customize the dashboard and insights accordingly.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <button
            onClick={() => onBusinessTypeSelect('sales')}
            className="p-8 border-2 border-[#DDDDDD] rounded-2xl hover:border-[#969F21] hover:bg-gradient-to-br hover:from-[#FAC141]/20 hover:to-[#ECA406]/20 transition-all duration-300 group hover:shadow-lg"
          >
            <div className="w-16 h-16 bg-[#FAC141]/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-[#ECA406]/30 transition-colors">
              <DollarSign className="h-8 w-8 text-[#ECA406]" />
            </div>
            <h3 className="text-2xl font-bold text-[#1A1A1A] mb-3">Sales Analytics</h3>
            <p className="text-[#2D89C7]">Focus on internal sales data patterns, performance optimization, and revenue growth opportunities</p>
            <div className="mt-4 text-sm text-[#ECA406] font-medium">→ Internal Data Analysis</div>
          </button>

          <button
            onClick={() => onBusinessTypeSelect('marketing')}
            className="p-8 border-2 border-[#DDDDDD] rounded-2xl hover:border-[#7D3083] hover:bg-gradient-to-br hover:from-[#7D3083]/20 hover:to-[#E94B87]/20 transition-all duration-300 group hover:shadow-lg"
          >
            <div className="w-16 h-16 bg-[#7D3083]/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-[#E94B87]/30 transition-colors">
              <Target className="h-8 w-8 text-[#7D3083]" />
            </div>
            <h3 className="text-2xl font-bold text-[#1A1A1A] mb-3">Marketing Intelligence</h3>
            <p className="text-[#2D89C7]">Analyze competitors, market positioning strategies, and competitive landscape insights</p>
            <div className="mt-4 text-sm text-[#7D3083] font-medium">→ Competitive Analysis</div>
          </button>

          <button
            onClick={() => onBusinessTypeSelect('both')}
            className="p-8 border-2 border-[#DDDDDD] rounded-2xl hover:border-[#2D89C7] hover:bg-gradient-to-br hover:from-[#2D89C7]/20 hover:to-[#969F21]/20 transition-all duration-300 group hover:shadow-lg"
          >
            <div className="w-16 h-16 bg-[#2D89C7]/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-[#969F21]/30 transition-colors">
              <BarChart3 className="h-8 w-8 text-[#2D89C7]" />
            </div>
            <h3 className="text-2xl font-bold text-[#1A1A1A] mb-3">Complete Suite</h3>
            <p className="text-[#2D89C7]">Comprehensive analysis combining sales performance and marketing intelligence for full business insights</p>
            <div className="mt-4 text-sm text-[#2D89C7] font-medium">→ Full Business Analytics</div>
          </button>
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-sm text-[#2D89C7]">
            Don't worry, you can always change your focus later in the settings
          </p>
        </div>
      </div>
    </div>
  );
};

export default BusinessTypeSelection; 