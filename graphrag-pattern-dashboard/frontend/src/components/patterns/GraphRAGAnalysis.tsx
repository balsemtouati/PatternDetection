import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle, Upload, BarChart3 } from 'lucide-react';
import GraphRAGPatternService, { GraphRAGRequest, GraphRAGResponse, ParsedPattern } from '../../services/graphRagPatternService';

interface GraphRAGAnalysisProps {
  onPatternsDetected?: (patterns: ParsedPattern[]) => void;
}

const GraphRAGAnalysis: React.FC<GraphRAGAnalysisProps> = ({ onPatternsDetected }) => {
  const [service] = useState(new GraphRAGPatternService());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedQuery, setSelectedQuery] = useState('');
  const [customQuery, setCustomQuery] = useState('');
  const [analysisResult, setAnalysisResult] = useState<GraphRAGResponse | null>(null);
  const [parsedPatterns, setParsedPatterns] = useState<ParsedPattern[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('knowledge-graph');
  const [useKnowledgeGraph, setUseKnowledgeGraph] = useState(true);

  const defaultQueries = service.getDefaultQueries();

  useEffect(() => {
    checkHealth();
    // Temporary: Set to true for testing
    // setIsHealthy(true);
  }, []);

  useEffect(() => {
    if (onPatternsDetected) {
      onPatternsDetected(parsedPatterns);
    }
  }, [parsedPatterns, onPatternsDetected]);

  const checkHealth = async () => {
    try {
      console.log('Starting health check...');
      const healthy = await service.healthCheck();
      console.log('Health check result:', healthy);
      setIsHealthy(healthy);
    } catch (error) {
      console.error('Health check error:', error);
      setIsHealthy(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(event.target.files || []);
    setFiles(uploadedFiles);
    setError(null);
  };

  const analyzePatterns = async () => {
    // For knowledge graph analysis, we don't need files
    if (activeTab === 'knowledge-graph') {
      return analyzeWithKnowledgeGraph();
    }

    // For file upload analysis, we need files
    if (files.length === 0) {
      setError('Please upload at least one CSV file');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Prepare data sources
      const dataSources = await service.prepareDataSources(files);
      
      // Determine query to use
      const queryToUse = customQuery.trim() || selectedQuery || defaultQueries[0].query;

      const request: GraphRAGRequest = {
        dataSources,
        config: {
          analysisType: 'graphRAG',
          query: queryToUse,
          hops: 1,
          retrieval_k: 12,
          max_nodes: 1500
        }
      };

      // Perform analysis
      const result = await service.analyzePatterns(request);
      
      if (result.success) {
        setAnalysisResult(result);
        
        // Parse patterns from LLM response
        const patterns = service.parsePatterns(result.patterns);
        setParsedPatterns(patterns);
        
        // Switch to results tab
        setActiveTab('results');
      } else {
        setError(result.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred during analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeWithKnowledgeGraph = async () => {
    if (!selectedQuery && !customQuery.trim()) {
      setError('Please select a query or enter a custom query');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Determine query to use
      const queryToUse = customQuery.trim() || selectedQuery || defaultQueries[0].query;

      // Analyze using existing knowledge graph
      const result = await service.analyzeWithKnowledgeGraph(queryToUse, {
        hops: 1,
        retrieval_k: 12,
        max_nodes: 1000
      });
      
      if (result.success) {
        setAnalysisResult(result);
        
        // Parse patterns from LLM response
        const patterns = service.parsePatterns(result.patterns);
        setParsedPatterns(patterns);
        
        // Switch to results tab
        setActiveTab('results');
      } else {
        setError(result.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Knowledge graph analysis error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred during analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getPatternIcon = (type: string) => {
    return type === 'Winning configuration' ? (
      <TrendingUp className="h-5 w-5 text-green-600" />
    ) : (
      <TrendingDown className="h-5 w-5 text-red-600" />
    );
  };

  const getPatternColor = (type: string) => {
    return type === 'Winning configuration' 
      ? 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium' 
      : 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-6 w-6" />
          <h2 className="text-xl font-semibold">GraphRAG Pattern Analysis</h2>
          {isHealthy === false && (
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium ml-2">
              Service Unavailable
            </span>
          )}
          {isHealthy === true && (
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium ml-2">
              Ready
            </span>
          )}
        </div>

        {isHealthy === false && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                <span className="text-red-800">
                  GraphRAG service is not available. Please ensure the backend is running and properly configured.
                </span>
              </div>
              <button
                onClick={checkHealth}
                className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700"
              >
                Retry Connection
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'knowledge-graph', label: 'Knowledge Graph', icon: Brain },
              { id: 'upload', label: 'Data Upload', icon: Upload },
              { id: 'results', label: 'Results', icon: BarChart3 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Knowledge Graph Tab */}
        {activeTab === 'knowledge-graph' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <Brain className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800">Using Existing Knowledge Graph</h3>
                  <p className="text-sm text-blue-600 mt-1">
                    Analyzing patterns from 670+ nodes and 1,696+ edges of historical business case studies.
                    No file upload required - the system uses pre-built knowledge from past projects.
                  </p>
                </div>
              </div>
            </div>

            {/* Query Selection */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Analysis Query
                </label>
                <div className="space-y-2">
                  {defaultQueries.map((query, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <label className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="query"
                          value={query.query}
                          checked={selectedQuery === query.query}
                          onChange={(e) => setSelectedQuery(e.target.value)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{query.label}</div>
                          <div className="text-xs text-gray-600 mt-1">{query.description}</div>
                          <div className="text-xs text-gray-500 mt-1 italic">"{query.query}"</div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Query */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or Enter Custom Query
                </label>
                <textarea
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  placeholder="Enter your custom business analysis question..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>

              {/* Analyze Button */}
              <button
                onClick={analyzePatterns}
                disabled={isAnalyzing || isHealthy === false || (!selectedQuery && !customQuery.trim())}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Analyzing with Knowledge Graph...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4" />
                    Analyze Patterns
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Upload Business Data Files</h3>
                <p className="text-sm text-gray-600">
                  Upload CSV files containing your business data (projects, HR, tenders, CRM, financial, etc.)
                </p>
                <input
                  type="file"
                  multiple
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Uploaded Files:</h4>
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{file.name}</span>
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Query Tab */}
        {activeTab === 'query' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Analysis Focus
              </label>
              <select
                value={selectedQuery}
                onChange={(e) => setSelectedQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose an analysis focus...</option>
                {defaultQueries.map((query, index) => (
                  <option key={index} value={query.query}>
                    {query.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Custom Analysis Query (Optional)
              </label>
              <textarea
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder="Enter your specific business question or analysis request..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to use the selected focus above
              </p>
            </div>

            <button
              onClick={analyzePatterns}
              disabled={files.length === 0 || isAnalyzing || !isHealthy}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Analyzing Patterns...
                </>
              ) : (
                <>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analyze Business Patterns
                </>
              )}
            </button>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                  <span className="text-red-800">{error}</span>
                </div>
              </div>
            )}

            {analysisResult && (
              <div className="space-y-6">
                {/* Metadata */}
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">Analysis Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-gray-600">Patterns Detected</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {parsedPatterns.length}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-600">Total Nodes</div>
                      <div className="text-2xl font-bold text-green-600">
                        {analysisResult.analysisMetadata.graph_stats.total_nodes}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-600">Total Edges</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {analysisResult.analysisMetadata.graph_stats.total_edges}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-600">Method</div>
                      <div className="text-lg font-semibold">
                        {analysisResult.analysisMetadata.method}
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 pt-4 border-t text-sm">
                    <div>
                      <div className="font-medium text-gray-600">Retrieved Docs</div>
                      <div className="text-lg font-bold text-orange-600">
                        {analysisResult.analysisMetadata.retrieval_metadata.retrieved_docs}
                      </div>
                    </div>
                    {analysisResult.analysisMetadata.graph_stats.subgraph_nodes && (
                      <div>
                        <div className="font-medium text-gray-600">Subgraph Nodes</div>
                        <div className="text-lg font-bold text-teal-600">
                          {analysisResult.analysisMetadata.graph_stats.subgraph_nodes}
                        </div>
                      </div>
                    )}
                    {analysisResult.analysisMetadata.retrieval_metadata.seed_ids && (
                      <div>
                        <div className="font-medium text-gray-600">Seed IDs</div>
                        <div className="text-lg font-bold text-indigo-600">
                          {analysisResult.analysisMetadata.retrieval_metadata.seed_ids}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Patterns */}
                {parsedPatterns.map((pattern) => (
                  <div key={pattern.id} className="bg-white border-l-4 border-l-blue-500 rounded-lg shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4">
                      {getPatternIcon(pattern.type)}
                      <h3 className="text-lg font-semibold">Pattern {pattern.id} — {pattern.title}</h3>
                      <span className={getPatternColor(pattern.type)}>
                        {pattern.type}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Description</h4>
                        <p className="text-gray-700">{pattern.description}</p>
                      </div>

                      {pattern.keyVariables.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Key Variables</h4>
                          <div className="flex flex-wrap gap-2">
                            {pattern.keyVariables.map((variable, index) => (
                              <span
                                key={index}
                                className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm"
                              >
                                {variable}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {pattern.impact.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Impact</h4>
                          <div className="space-y-2">
                            {pattern.impact.map((impact, index) => (
                              <div key={index} className="flex items-center gap-2">
                                {impact.type === 'positive' ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4 text-red-600" />
                                )}
                                <span className={impact.type === 'positive' ? 'text-green-700' : 'text-red-700'}>
                                  {impact.description}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {pattern.confidence && (
                        <div>
                          <h4 className="font-medium mb-2">Confidence</h4>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                            {pattern.confidence}
                          </span>
                        </div>
                      )}

                      <div>
                        <h4 className="font-medium mb-2">Business Implication</h4>
                        <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                          <div className="flex items-start gap-2">
                            <Target className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span className="text-blue-800">{pattern.businessImplication}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!analysisResult && !error && (
              <div className="text-center py-8 text-gray-500">
                <Brain className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No analysis results yet. Upload data and run analysis to see patterns.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GraphRAGAnalysis;
