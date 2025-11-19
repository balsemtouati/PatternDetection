import React from 'react';
import { 
  Target, 
  TrendingUp, 
  Users, 
  Activity, 
  MapPin, 
  Calendar, 
  Filter, 
  PieChart, 
  BarChart3, 
  Award 
} from 'lucide-react';
import { mockMarketingPatterns } from '../../data/mockData';

const MarketingPatterns: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-700 rounded-3xl p-8 text-white">
        <div className="flex items-center mb-6">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mr-4">
            <Target className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Patterns Marketing Gagnants</h1>
            <p className="text-purple-100">Stratégies marketing performantes basées sur l'analyse de vos campagnes</p>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center mb-2">
              <TrendingUp className="h-5 w-5 text-purple-200 mr-2" />
              <span className="text-sm font-medium">ROI Moyen</span>
            </div>
            <p className="text-2xl font-bold">310%</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center mb-2">
              <Users className="h-5 w-5 text-purple-200 mr-2" />
              <span className="text-sm font-medium">Taux de Conversion</span>
            </div>
            <p className="text-2xl font-bold">8.0%</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center mb-2">
              <Activity className="h-5 w-5 text-purple-200 mr-2" />
              <span className="text-sm font-medium">Campagnes Analysées</span>
            </div>
            <p className="text-2xl font-bold">47</p>
          </div>
        </div>
      </div>

      {/* Campaign Success Patterns */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Patterns de Campagnes Gagnantes</h2>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600">Trié par ROI</span>
          </div>
        </div>
        
        <div className="grid gap-6">
          {mockMarketingPatterns.campaignSuccess.map((campaign) => (
            <div key={campaign.id} className="border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{campaign.campaignType}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Award className="h-4 w-4 mr-1 text-green-500" />
                      Taux de succès: {campaign.successRate}%
                    </span>
                    <span className="flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1 text-blue-500" />
                      ROI moyen: {campaign.avgROI}%
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{campaign.avgROI}%</span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Context */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                    Contexte
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Canal:</span>
                      <span className="font-medium text-gray-900">{campaign.context.channel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Audience:</span>
                      <span className="font-medium text-gray-900">{campaign.context.targetAudience}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Durée:</span>
                      <span className="font-medium text-gray-900">{campaign.context.duration}</span>
                    </div>
                  </div>
                </div>

                {/* Conditions */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-purple-500" />
                    Conditions
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Budget:</span>
                      <span className="font-medium text-gray-900">{campaign.conditions.budgetRange}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Période:</span>
                      <span className="font-medium text-gray-900">{campaign.conditions.period}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type de contenu:</span>
                      <span className="font-medium text-gray-900">{campaign.conditions.contentType}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Patterns */}
              <div className="mt-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Activity className="h-4 w-4 mr-2 text-orange-500" />
                  Patterns Identifiés
                </h4>
                <div className="flex flex-wrap gap-2">
                  {campaign.patterns.map((pattern, index) => (
                    <span key={index} className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full font-medium">
                      {pattern}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channel Performance */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <PieChart className="h-5 w-5 mr-2 text-purple-500" />
            Performance par Canal
          </h3>
          <div className="space-y-4">
            {mockMarketingPatterns.channelPerformance.map((channel) => (
              <div key={channel.channel} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{channel.channel}</p>
                  <p className="text-sm text-gray-600">Taux de conversion: {channel.conversionRate}%</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{channel.avgCPL}€</p>
                  <p className="text-sm text-gray-600">Coût par lead</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audience Insights */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2 text-green-500" />
            Insights Audience
          </h3>
          <div className="space-y-4">
            {mockMarketingPatterns.audienceInsights.map((segment) => (
              <div key={segment.segment} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{segment.segment}</p>
                  <p className="text-sm text-gray-600">Engagement: {segment.engagement}%</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{segment.conversionRate}%</p>
                  <p className="text-sm text-gray-600">Taux de conversion</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actionable Insights */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-8 border border-purple-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Target className="h-6 w-6 mr-3 text-purple-600" />
          Recommandations Stratégiques
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-3">🚀 Campagne Recommandée</h4>
            <p className="text-gray-600 mb-4">Lancez une campagne de content marketing B2B sur LinkedIn ciblant les décideurs IT avec un budget de 120k€.</p>
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              ROI attendu: 420%
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-3">📊 Optimisation Canal</h4>
            <p className="text-gray-600 mb-4">Augmentez l'investissement sur les événements physiques et LinkedIn pour maximiser le ROI.</p>
            <div className="flex items-center text-sm text-blue-600">
              <BarChart3 className="h-4 w-4 mr-1" />
              Amélioration attendue: +52%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketingPatterns; 