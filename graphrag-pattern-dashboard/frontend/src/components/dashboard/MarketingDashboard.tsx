import React from 'react';
import { 
  Target, 
  Users, 
  Eye, 
  TrendingUp, 
  AlertTriangle, 
  BarChart3 
} from 'lucide-react';

const MarketingDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Marketing Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Campaign ROI</h3>
            <Target className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">340%</p>
          <p className="text-sm text-green-600">+45% from last campaign</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Lead Generation</h3>
            <Users className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">1,247</p>
          <p className="text-sm text-blue-600">312 this week</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Market Share</h3>
            <Eye className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">12.8%</p>
          <p className="text-sm text-purple-600">+1.2% growth</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Brand Awareness</h3>
            <TrendingUp className="h-5 w-5 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">67%</p>
          <p className="text-sm text-orange-600">+8% this quarter</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Marketing Intelligence</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <p className="font-medium text-blue-800">Competitor Movement Detected</p>
              <p className="text-sm text-blue-600">TechCorp launched new campaign targeting our keywords</p>
            </div>
            <AlertTriangle className="h-6 w-6 text-blue-500" />
          </div>
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div>
              <p className="font-medium text-green-800">Channel Performance</p>
              <p className="text-sm text-green-600">Social media campaigns outperforming by 45%</p>
            </div>
            <TrendingUp className="h-6 w-6 text-green-500" />
          </div>
          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
            <div>
              <p className="font-medium text-purple-800">Audience Insight</p>
              <p className="text-sm text-purple-600">New demographic segment showing 23% engagement</p>
            </div>
            <Users className="h-6 w-6 text-purple-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketingDashboard; 