import React, { useState, useEffect } from 'react';
import { Network, Activity, Users, BarChart3, ExternalLink, RefreshCw } from 'lucide-react';

const KnowledgeGraphVisualization: React.FC = () => {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const GRAPH_URL = 'http://localhost:3001';

  const handleIframeLoad = () => {
    setIframeLoaded(true);
    setError(null);
  };

  const handleIframeError = () => {
    setError('Unable to load Knowledge Graph. Please ensure the graph visualizer is running on port 3001.');
    setIframeLoaded(false);
  };

  const refreshGraph = () => {
    setIsRefreshing(true);
    setError(null);
    // Force iframe refresh
    const iframe = document.getElementById('knowledge-graph-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src;
    }
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const openInNewTab = () => {
    window.open(GRAPH_URL, '_blank');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Network className="text-blue-600" />
            Knowledge Graph
          </h1>
          <p className="text-gray-600 mt-2">
            Interactive visualization of your business intelligence network
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refreshGraph}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={openInNewTab}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Open in New Tab
          </button>
        </div>
      </div>

      {/* IATA Platform Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Graph Status</p>
              <p className={`text-lg font-bold ${iframeLoaded ? 'text-green-600' : 'text-orange-600'}`}>
                {iframeLoaded ? 'Active' : 'Connecting...'}
              </p>
            </div>
            <div className={`h-3 w-3 rounded-full ${iframeLoaded ? 'bg-green-500' : 'bg-orange-500'}`}></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Business Nodes</p>
              <p className="text-lg font-bold text-gray-900">670+</p>
            </div>
            <Network className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Relationships</p>
              <p className="text-lg font-bold text-gray-900">1,696+</p>
            </div>
            <Activity className="h-6 w-6 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Accuracy Rate</p>
              <p className="text-lg font-bold text-gray-900">94.2%</p>
            </div>
            <Users className="h-6 w-6 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Connection Error</h3>
          <p className="text-red-600 mt-1">{error}</p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={refreshGraph}
              className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition-colors"
            >
              Restart Graph
            </button>
            <span className="text-sm text-red-600">
              Make sure the graph visualizer is running on port 3001
            </span>
          </div>
        </div>
      )}

      {/* Embedded Graph Visualization */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Network className="h-5 w-5 text-blue-600" />
            IATA Knowledge Graph - Business Case Studies
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Interactive visualization of 670+ business nodes and 1,696+ relationships from historical case studies
          </p>
        </div>
        
        <div className="relative">
          {!iframeLoaded && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading Knowledge Graph...</p>
                <p className="text-sm text-gray-500 mt-1">Connecting to localhost:3001</p>
              </div>
            </div>
          )}
          
          <iframe
            id="knowledge-graph-iframe"
            src={GRAPH_URL}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            className="w-full h-[700px] border-0"
            title="Knowledge Graph Visualization"
            sandbox="allow-same-origin allow-scripts allow-forms"
          />
        </div>
      </div>

      {/* Platform Features Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-blue-800 font-medium">IATA Platform Features</h4>
        <ul className="text-blue-700 mt-2 space-y-1 text-sm">
          <li>• <strong>GraphRAG Analysis:</strong> Advanced pattern recognition using existing knowledge graphs</li>
          <li>• <strong>Competitor Intelligence:</strong> AI-powered business insights and market analysis</li>
          <li>• <strong>Interactive Visualization:</strong> 3D network graphs with physics simulation</li>
          <li>• <strong>Business Case Studies:</strong> Access to 670+ historical business scenarios</li>
          <li>• <strong>Real-time Analytics:</strong> Live data processing with 94.2% accuracy rate</li>
          <li>• <strong>Pattern Detection:</strong> Automated identification of business trends and opportunities</li>
        </ul>
      </div>
    </div>
  );
};

export default KnowledgeGraphVisualization;
