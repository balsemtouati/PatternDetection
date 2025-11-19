import React, { useState } from 'react';
import { Users, CheckCircle, ArrowRight } from 'lucide-react';
import { mockCompetitors } from '../data/mockData';

interface CompetitorSelectionProps {
  industry: string;
  onCompetitorSelection: (competitors: string[]) => void;
}

const CompetitorSelection: React.FC<CompetitorSelectionProps> = ({ industry, onCompetitorSelection }) => {
  const [selectedCompetitors, setSelectedCompetitors] = useState<string[]>([]);
  const availableCompetitors = mockCompetitors[industry] || [];

  const handleCompetitorToggle = (competitorName: string) => {
    setSelectedCompetitors(prev =>
      prev.includes(competitorName)
        ? prev.filter(name => name !== competitorName)
        : [...prev, competitorName]
    );
  };

  const handleContinue = () => {
    onCompetitorSelection(selectedCompetitors);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F5F5] via-[#DDDDDD] to-[#1A1A1A] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-3xl w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#7D3083] to-[#E94B87] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-[#1A1A1A] mb-3">Select Competitors</h2>
          <p className="text-lg text-[#2D89C7]">Choose which competitors you want to track and analyze for market intelligence</p>
        </div>

        <div className="grid gap-4 mb-8">
          {availableCompetitors.map((competitor) => (
            <div
              key={competitor.name}
              className={`p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${
                selectedCompetitors.includes(competitor.name)
                  ? 'border-[#7D3083] bg-gradient-to-r from-[#7D3083]/10 to-[#E94B87]/10 shadow-md'
                  : 'border-[#DDDDDD] hover:border-[#7D3083] hover:shadow-md'
              }`}
              onClick={() => handleCompetitorToggle(competitor.name)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">{competitor.name}</h3>
                  <div className="flex items-center space-x-4 text-sm text-[#2D89C7]">
                    <span className="flex items-center">
                      <div className="w-2 h-2 bg-[#2D89C7] rounded-full mr-2"></div>
                      Market Share: {competitor.marketShare}%
                    </span>
                    <span className="flex items-center">
                      <div className="w-2 h-2 bg-[#969F21] rounded-full mr-2"></div>
                      Revenue: {competitor.revenue}
                    </span>
                    <span className={`flex items-center ${competitor.growth > 10 ? 'text-[#E94B87]' : 'text-[#969F21]'}`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${competitor.growth > 10 ? 'bg-[#E94B87]' : 'bg-[#969F21]'}`}></div>
                      Growth: {competitor.growth}%
                    </span>
                  </div>
                </div>
                {selectedCompetitors.includes(competitor.name) && (
                  <div className="w-10 h-10 bg-[#7D3083]/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-[#7D3083]" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleContinue}
          disabled={selectedCompetitors.length === 0}
          className="w-full bg-gradient-to-r from-[#7D3083] to-[#E94B87] text-white py-4 px-6 rounded-xl font-semibold hover:from-[#1A1A1A] hover:to-[#7D3083] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg hover:shadow-xl"
        >
          Continue with {selectedCompetitors.length} competitor{selectedCompetitors.length !== 1 ? 's' : ''}
          <ArrowRight className="inline-block ml-2 h-5 w-5" />
        </button>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-[#2D89C7]">
            You can add or remove competitors later from your dashboard
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompetitorSelection; 