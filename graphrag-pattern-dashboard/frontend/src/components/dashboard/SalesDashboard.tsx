import React from 'react';
import { 
  DollarSign, 
  CheckCircle, 
  TrendingUp, 
  Target, 
  BarChart3, 
  AlertTriangle 
} from 'lucide-react';

const SalesDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Sales Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Revenue</h3>
            <DollarSign className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">$2.4M</p>
          <p className="text-sm text-green-600">+15% from last quarter</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Deals Closed</h3>
            <CheckCircle className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">127</p>
          <p className="text-sm text-blue-600">23 this week</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Conversion Rate</h3>
            <TrendingUp className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">18.2%</p>
          <p className="text-sm text-purple-600">+3.1% improvement</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Pipeline Value</h3>
            <Target className="h-5 w-5 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">$8.7M</p>
          <p className="text-sm text-orange-600">145 active deals</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Performance Patterns</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div>
              <p className="font-medium text-green-800">Peak Performance Detected</p>
              <p className="text-sm text-green-600">Tuesdays show 34% higher close rates</p>
            </div>
            <TrendingUp className="h-6 w-6 text-green-500" />
          </div>
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <p className="font-medium text-blue-800">Seasonal Pattern</p>
              <p className="text-sm text-blue-600">Q4 typically shows 28% revenue increase</p>
            </div>
            <BarChart3 className="h-6 w-6 text-blue-500" />
          </div>
          <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
            <div>
              <p className="font-medium text-orange-800">Follow-up Opportunity</p>
              <p className="text-sm text-orange-600">2-hour response time increases conversion by 21%</p>
            </div>
            <AlertTriangle className="h-6 w-6 text-orange-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard; 