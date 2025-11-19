import React from 'react';
import { mockCompetitors } from '../../data/mockData';
import { Company } from '../../types';

interface CompetitorsSectionProps {
  company: Company | null;
}

const CompetitorsSection: React.FC<CompetitorsSectionProps> = ({ company }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Competitor Analysis</h2>
        <button className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors">
          Add Competitor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {company?.competitors?.map((competitorName) => {
          const competitor = mockCompetitors[company.industry]?.find(c => c.name === competitorName);
          if (!competitor) return null;

          return (
            <div key={competitor.name} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{competitor.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  competitor.growth > 10 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                  {competitor.growth > 10 ? 'High Growth' : 'Stable'}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Market Share</span>
                  <span className="text-sm font-medium text-gray-900">{competitor.marketShare}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Revenue</span>
                  <span className="text-sm font-medium text-gray-900">{competitor.revenue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Growth Rate</span>
                  <span className={`text-sm font-medium ${competitor.growth > 10 ? 'text-red-600' : 'text-green-600'}`}>
                    {competitor.growth}%
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Strengths</h4>
                <div className="flex flex-wrap gap-1">
                  {competitor.strengths.map((strength, index) => (
                    <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      {strength}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-3">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Weaknesses</h4>
                <div className="flex flex-wrap gap-1">
                  {competitor.weaknesses.map((weakness, index) => (
                    <span key={index} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                      {weakness}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CompetitorsSection; 