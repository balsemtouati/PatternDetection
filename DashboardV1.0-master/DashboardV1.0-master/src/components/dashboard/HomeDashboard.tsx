import React from 'react';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  MessageSquare, 
  Upload, 
  Target,
  Zap,
  DollarSign,
  ShoppingCart,
  Eye,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  TrendingDown,
  Award,
  Clock,
  MapPin,
  Calendar,
  Filter,
  PieChart,
  Activity,
  Building2,
  Brain
} from 'lucide-react';
import { BusinessType, ActiveSection } from '../../types';
import { GraphRAGAnalysis } from '../patterns';

interface HomeDashboardProps {
  businessType: BusinessType;
  company: any;
  onSectionChange: (section: ActiveSection) => void;
}

const HomeDashboard: React.FC<HomeDashboardProps> = ({ businessType, company, onSectionChange }) => {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 rounded-3xl p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mr-4">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Welcome to IATA</h1>
              <p className="text-xl text-blue-100">Intelligent Pattern Recognition for {company?.name}</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <BarChart3 className="h-8 w-8 text-blue-200 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Smart Analytics</h3>
              <p className="text-blue-100 text-sm">Advanced pattern detection algorithms analyze your data to uncover hidden insights and trends.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <Target className="h-8 w-8 text-purple-200 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Strategic Insights</h3>
              <p className="text-purple-100 text-sm">Get actionable recommendations based on data patterns to drive better business decisions.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <MessageSquare className="h-8 w-8 text-indigo-200 mb-3" />
              <h3 className="text-lg font-semibold mb-2">AI Assistant</h3>
              <p className="text-indigo-100 text-sm">Chat with our AI to get instant answers and strategic guidance for your business challenges.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">+12%</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Patterns Detected</h3>
          <p className="text-2xl font-bold text-gray-900">47</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">Active</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Data Sources</h3>
          <p className="text-2xl font-bold text-gray-900">8</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">+2.1%</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Accuracy Rate</h3>
          <p className="text-2xl font-bold text-gray-900">94.2%</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">New</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">
            {businessType === 'marketing' || businessType === 'both' ? 'Competitor Alerts' : 'Risk Alerts'}
          </h3>
          <p className="text-2xl font-bold text-gray-900">3</p>
        </div>
      </div>

      {/* Platform Features */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How IATA Works</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our advanced AI engine analyzes your business data to identify patterns, predict trends, and provide actionable insights for better decision-making.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Upload className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Upload Your Data</h3>
            <p className="text-gray-600">
              Connect your data sources or upload files. Our system supports various formats including CSV, Excel, and database connections.
            </p>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <BarChart3 className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">2. AI Analysis</h3>
            <p className="text-gray-600">
              Our machine learning algorithms automatically detect patterns, anomalies, and trends in your data with 94%+ accuracy.
            </p>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Target className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Get Insights</h3>
            <p className="text-gray-600">
              Receive actionable recommendations and strategic insights to optimize your business performance and stay ahead of the competition.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Insights & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Recent Insights</h3>
            <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">Live</span>
          </div>
          <div className="space-y-4">
            {businessType === 'sales' && (
              <>
                <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-xl border border-green-100">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Q4 Sales Pattern Detected</p>
                    <p className="text-sm text-gray-600">Historical data shows 23% increase in Q4</p>
                    <span className="text-xs text-green-600 font-medium">High Confidence</span>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Lead Conversion Drop</p>
                    <p className="text-sm text-gray-600">15% decrease in enterprise segment</p>
                    <span className="text-xs text-orange-600 font-medium">Needs Attention</span>
                  </div>
                </div>
              </>
            )}
            {(businessType === 'marketing' || businessType === 'both') && (
              <>
                <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Eye className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Competitor Price Change</p>
                    <p className="text-sm text-gray-600">TechCorp reduced prices by 8%</p>
                    <span className="text-xs text-blue-600 font-medium">Market Impact</span>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-4 bg-red-50 rounded-xl border border-red-100">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Market Share Alert</p>
                    <p className="text-sm text-gray-600">Competitor gaining 2% monthly</p>
                    <span className="text-xs text-red-600 font-medium">Critical</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => onSectionChange('company-tracker')}
              className="w-full text-left p-4 rounded-xl border border-gray-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-200 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Upload className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Upload New Data</p>
                    <p className="text-sm text-gray-600">Add more data sources</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </button>
            {(businessType === 'sales' || businessType === 'both') && (
              <button 
                onClick={() => onSectionChange('sales-patterns')}
                className="w-full text-left p-4 rounded-xl border border-gray-200 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:border-green-200 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <Award className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Sales Patterns</p>
                      <p className="text-sm text-gray-600">Winning configurations analysis</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                </div>
              </button>
            )}
            {(businessType === 'marketing' || businessType === 'both') && (
              <button 
                onClick={() => onSectionChange('marketing-patterns')}
                className="w-full text-left p-4 rounded-xl border border-gray-200 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:border-purple-200 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                      <Target className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Marketing Patterns</p>
                      <p className="text-sm text-gray-600">Campaign success analysis</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                </div>
              </button>
            )}
            <button className="w-full text-left p-4 rounded-xl border border-gray-200 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 hover:border-indigo-200 transition-all duration-200 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                    <Brain className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">GraphRAG Analysis</p>
                    <p className="text-sm text-gray-600">Advanced AI pattern detection</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
              </div>
            </button>
            <button className="w-full text-left p-4 rounded-xl border border-gray-200 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 hover:border-orange-200 transition-all duration-200 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    <BarChart3 className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Export Analysis</p>
                    <p className="text-sm text-gray-600">Download detailed reports</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* GraphRAG Analysis Section */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Advanced Pattern Analysis</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Use our cutting-edge GraphRAG technology to discover hidden business patterns and strategic insights.
          </p>
        </div>
        <GraphRAGAnalysis />
      </div>
    </div>
  );
};

export default HomeDashboard; 