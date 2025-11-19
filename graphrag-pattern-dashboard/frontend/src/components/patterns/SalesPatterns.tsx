import React, { useState, useEffect } from 'react';
import { 
  Award, 
  TrendingUp, 
  DollarSign, 
  Activity, 
  MapPin, 
  Calendar, 
  Filter, 
  PieChart, 
  BarChart3, 
  Target, 
  AlertTriangle,
  Upload,
  Play,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  FileText,
  FolderOpen,
  Database,
  Server,
  Wifi,
  WifiOff
} from 'lucide-react';
import PatternAnalysisAPI from '../../services/api/PatternAnalysisAPI';
import { PatternAnalysisConfig, PatternAnalysisResult, ScoredPattern } from '../../services/api/PatternAnalysisAPI';

interface DataSource {
  name: string;
  type: 'crm' | 'erp' | 'financial' | 'hr' | 'tenders' | 'projects';
  data: any[];
}

interface DataFile {
  name: string;
  type: string;
  data: any[];
  size: number;
  path?: string;
  lastModified?: Date;
}

const SalesPatterns: React.FC = () => {
  console.log('🎯 SalesPatterns component is loading...');
  
  const [analysisResult, setAnalysisResult] = useState<PatternAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<string>('');
  const [dataFiles, setDataFiles] = useState<DataFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [config, setConfig] = useState<PatternAnalysisConfig>({
    maxPatterns: 8,
    minConfidence: 0.6,
    minSupport: 0.1,
    complexityLevel: 'high',
    focusAreas: ['profitability', 'efficiency', 'risk', 'quality']
  });

  const patternAPI = new PatternAnalysisAPI();

  // Fonction pour lire un fichier CSV
  const readCSVFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          const data = lines.slice(1).filter(line => line.trim()).map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const row: any = {};
            headers.forEach((header, index) => {
              let value = values[index] || '';
              // Essayer de convertir en nombre si possible
              if (!isNaN(Number(value)) && value !== '') {
                value = Number(value) as any;
              }
              // Essayer de convertir en date si possible
              else if (value.match(/^\d{4}-\d{2}-\d{2}/) || value.match(/^\d{2}\/\d{2}\/\d{4}/)) {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                  value = date.toISOString();
                }
              }
              row[header] = value;
            });
            return row;
          });
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  // Fonction pour lire un fichier JSON
  const readJSONFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const data = JSON.parse(text);
          // Si c'est un objet avec des propriétés, le convertir en tableau
          if (Array.isArray(data)) {
            resolve(data);
          } else if (typeof data === 'object') {
            // Si c'est un objet, essayer de trouver un tableau de données
            const possibleArrays = Object.values(data).filter(val => Array.isArray(val));
            if (possibleArrays.length > 0) {
              resolve(possibleArrays[0]);
            } else {
              resolve([data]);
            }
          } else {
            resolve([]);
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  // Fonction pour détecter le type de données basé sur le nom du fichier
  const detectDataType = (fileName: string): string => {
    const lowerName = fileName.toLowerCase();
    if (lowerName.includes('crm') || lowerName.includes('sales') || lowerName.includes('deals')) {
      return 'crm';
    } else if (lowerName.includes('erp') || lowerName.includes('project') || lowerName.includes('tasks')) {
      return 'erp';
    } else if (lowerName.includes('financial') || lowerName.includes('finance') || lowerName.includes('revenue')) {
      return 'financial';
    } else if (lowerName.includes('hr') || lowerName.includes('employee') || lowerName.includes('personnel')) {
      return 'hr';
    } else if (lowerName.includes('tender') || lowerName.includes('bid') || lowerName.includes('proposal')) {
      return 'tenders';
    } else {
      return 'projects';
    }
  };

  // Fonction pour charger les fichiers CSV depuis le dossier data (fallback)
  const loadDataFiles = async () => {
    setIsLoading(true);
    setLoadProgress('Chargement des fichiers de données...');

    try {
      // Liste des fichiers CSV connus dans le dossier data
      const knownFiles = [
        'sample_crm_data.csv',
        'sample_erp_data.csv', 
        'sample_financial_data.csv'
      ];

      const loadedFiles: DataFile[] = [];

      for (const fileName of knownFiles) {
        setLoadProgress(`Chargement de ${fileName}...`);
        
        try {
          // Utiliser fetch pour charger le fichier CSV
          const response = await fetch(`/data/${fileName}`);
          if (response.ok) {
            const csvText = await response.text();
            const lines = csvText.split('\n');
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            
            const data = lines.slice(1).filter(line => line.trim()).map(line => {
              const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
              const row: any = {};
              headers.forEach((header, index) => {
                let value = values[index] || '';
                // Essayer de convertir en nombre si possible
                if (!isNaN(Number(value)) && value !== '') {
                  value = Number(value) as any;
                }
                // Essayer de convertir en date si possible
                else if (value.match(/^\d{4}-\d{2}-\d{2}/) || value.match(/^\d{2}\/\d{2}\/\d{4}/)) {
                  const date = new Date(value);
                  if (!isNaN(date.getTime())) {
                    value = date.toISOString();
                  }
                }
                row[header] = value;
              });
              return row;
            });

            if (data.length > 0) {
              const dataFile: DataFile = {
                name: fileName,
                type: detectDataType(fileName),
                data: data,
                size: csvText.length,
                path: `/data/${fileName}`
              };
              loadedFiles.push(dataFile);
            }
          }
        } catch (error) {
          console.warn(`Impossible de charger ${fileName}:`, error);
        }
      }

      setDataFiles(loadedFiles);
      setLoadProgress(`Chargement terminé. ${loadedFiles.length} fichiers chargés avec succès.`);
      
    } catch (error) {
      console.error('Erreur lors du chargement des fichiers:', error);
      setLoadProgress('Erreur lors du chargement des fichiers.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour uploader des fichiers
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress('Début du traitement des fichiers...');

    const newFiles: DataFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`Traitement de ${file.name}...`);

      try {
        let data: any[];
        
        if (file.name.endsWith('.csv')) {
          data = await readCSVFile(file);
        } else if (file.name.endsWith('.json')) {
          data = await readJSONFile(file);
        } else {
          console.warn(`Format de fichier non supporté: ${file.name}`);
          continue;
        }

        if (data.length > 0) {
          const uploadedFile: DataFile = {
            name: file.name,
            type: detectDataType(file.name),
            data: data,
            size: file.size,
            lastModified: new Date(file.lastModified)
          };
          newFiles.push(uploadedFile);
        }
      } catch (error) {
        console.error(`Erreur lors du traitement de ${file.name}:`, error);
      }
    }

    setDataFiles(prev => [...prev, ...newFiles]);
    setIsUploading(false);
    setUploadProgress(`Upload terminé. ${newFiles.length} fichiers traités avec succès.`);
    
    // Réinitialiser l'input
    event.target.value = '';
  };

  // Fonction pour supprimer un fichier
  const removeFile = (fileName: string) => {
    setDataFiles(prev => prev.filter(file => file.name !== fileName));
  };

  // Fonction pour recharger les fichiers par défaut
  const reloadDefaultDataFiles = () => {
    loadDataFiles();
  };

  // Fonction pour convertir les fichiers en DataSource
  const convertToDataSources = (): DataSource[] => {
    return dataFiles.map(file => ({
      name: file.name,
      type: file.type as any,
      data: file.data
    }));
  };

  const runPatternAnalysis = async () => {
    if (dataFiles.length === 0) {
      alert('Aucun fichier de données disponible. Veuillez uploader des fichiers CSV ou utiliser les données par défaut.');
      return;
    }

    console.log('🚀 Starting pattern analysis...');
    console.log('📁 Data files count:', dataFiles.length);
    console.log('⚙️ Current config:', config);
    
    setIsAnalyzing(true);
    setAnalysisProgress('Initialisation de l\'analyse...');
    
    // Add timeout protection
    const timeoutId = setTimeout(() => {
      if (isAnalyzing) {
        setAnalysisProgress('Analyse en cours (cela peut prendre quelques minutes)...');
      }
    }, 10000); // 10 seconds
    
    try {
      const dataSources = convertToDataSources();
      console.log('📊 Data sources being sent:', dataSources);
      console.log('⚙️ Configuration:', config);
      
      setAnalysisProgress('Fusion des sources de données...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAnalysisProgress('Nettoyage et transformation des données...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAnalysisProgress('Détection des règles d\'association...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAnalysisProgress('Analyse des patterns temporels...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAnalysisProgress('Scoring et filtrage des patterns...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAnalysisProgress('Finalisation de l\'analyse...');
      console.log('📞 Calling patternAPI.analyzePatterns...');
      
      // Add timeout to the API call
      const apiPromise = patternAPI.analyzePatterns(dataSources, config);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('API timeout - analysis taking too long')), 60000) // 60 second timeout
      );
      
      const result = await Promise.race([apiPromise, timeoutPromise]) as PatternAnalysisResult;
      console.log('✅ Analysis result received:', result);
      console.log('✅ Result type:', typeof result);
      console.log('✅ Has patterns:', !!result.patterns);
      console.log('✅ Patterns count:', result.patterns?.length || 0);
      console.log('✅ Has analysisMetadata:', !!result.analysisMetadata);
      console.log('✅ Has statistics:', !!result.statistics);
      
      if (!result || !result.patterns) {
        console.error('❌ Invalid response format from backend');
        throw new Error('Invalid response format from backend');
      }
      
      console.log('✅ Setting analysis result...');
      setAnalysisResult(result);
      console.log('✅ Analysis result set successfully');
      setAnalysisProgress('Analyse terminée avec succès !');
      
      // Clear timeout
      clearTimeout(timeoutId);
      
    } catch (error) {
      console.error('❌ Échec de l\'analyse:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Clear timeout
      clearTimeout(timeoutId);
      
      if (error.message.includes('timeout')) {
        setAnalysisProgress('Analyse interrompue - temps d\'attente dépassé. Veuillez réessayer.');
        alert('L\'analyse prend trop de temps. Veuillez:\n1. Vérifier que le backend fonctionne\n2. Réduire la taille des données\n3. Réessayer l\'analyse');
      } else {
        setAnalysisProgress(`Échec de l'analyse: ${error.message}`);
        alert(`Erreur d'analyse: ${error.message}\n\nVérifiez que:\n1. Le backend est en cours d'exécution\n2. Les données sont dans le bon format\n3. La console pour plus de détails`);
      }
    } finally {
      console.log('🏁 Analysis process finished, setting isAnalyzing to false');
      setIsAnalyzing(false);
    }
  };

  const exportPatterns = () => {
    if (!analysisResult) return;
    
    const jsonData = patternAPI.exportPatternsToJSON(analysisResult.patterns);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_patterns_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Load data files on component mount
  useEffect(() => {
    const initializeComponent = async () => {
      setIsInitializing(true);
      try {
        await loadDataFiles();
      } catch (error) {
        console.error('Error loading data files:', error);
      } finally {
        setIsInitializing(false);
      }
    };
    
    initializeComponent();
  }, []);

  // Debug effect to track analysis result changes
  useEffect(() => {
    console.log('🔄 Analysis result changed:', {
      hasResult: !!analysisResult,
      patternsCount: analysisResult?.patterns?.length || 0,
      isAnalyzing,
      analysisProgress
    });
  }, [analysisResult, isAnalyzing, analysisProgress]);

  // Show loading screen while initializing
  if (isInitializing) {
    console.log('🔄 Component is initializing...');
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Initializing Pattern Analysis...</p>
          <p className="text-sm text-gray-500 mt-2">Loading data files and preparing analysis tools</p>
        </div>
      </div>
    );
  }

  console.log('✅ Component initialized, rendering main content...');

  try {
    return (
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-[#7D3083] to-[#E94B87] rounded-3xl p-8 text-white">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mr-4">
                <Award className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">Advanced Sales Pattern Analysis</h1>
                <p className="text-white/90">AI-powered pattern discovery engine for sales optimization</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={runPatternAnalysis}
                disabled={isAnalyzing || dataFiles.length === 0}
                className="flex items-center px-6 py-3 bg-white/20 rounded-xl hover:bg-white/30 transition-colors disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Play className="h-5 w-5 mr-2" />
                )}
                {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
              </button>
              {analysisResult && (
                <button
                  onClick={exportPatterns}
                  className="flex items-center px-6 py-3 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Export
                </button>
              )}
            </div>
          </div>
        
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center mb-2">
                <TrendingUp className="h-5 w-5 text-white mr-2" />
                <span className="text-sm font-medium">Patterns Detected</span>
              </div>
              <p className="text-2xl font-bold">
                {analysisResult ? analysisResult.patterns.length : '0'}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center mb-2">
                <DollarSign className="h-5 w-5 text-white mr-2" />
                <span className="text-sm font-medium">Avg Impact</span>
              </div>
              <p className="text-2xl font-bold">
                {analysisResult ? `${Math.round(analysisResult.patterns.reduce((sum, p) => sum + (Number(p.impact) || 0), 0) / analysisResult.patterns.length)}%` : '0%'}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center mb-2">
                <Activity className="h-5 w-5 text-white mr-2" />
                <span className="text-sm font-medium">Confidence</span>
              </div>
              <p className="text-2xl font-bold">
                {analysisResult ? `${analysisResult.analysisMetadata.confidence}%` : '0%'}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center mb-2">
                <Target className="h-5 w-5 text-white mr-2" />
                <span className="text-sm font-medium">Data Files</span>
              </div>
              <p className="text-2xl font-bold">
                {dataFiles.length}
              </p>
            </div>
          </div>
        </div>

        {/* Data Management Section */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <Database className="h-5 w-5 mr-2 text-blue-500" />
              Data Management
            </h3>
            <div className="flex space-x-3">
              <button
                onClick={reloadDefaultDataFiles}
                disabled={isLoading}
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Loading...' : 'Load Default Data'}
              </button>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Upload className="h-4 w-4 mr-2 text-blue-500" />
              Upload Your CSV Files
            </h4>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                multiple
                accept=".csv,.json"
                onChange={handleFileUpload}
                className="hidden"
                id="fileUpload"
                disabled={isUploading}
              />
              <label htmlFor="fileUpload" className="cursor-pointer">
                <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  {isUploading ? 'Uploading...' : 'Click to upload files or drag and drop'}
                </p>
                <p className="text-sm text-gray-500">
                  Supports CSV and JSON files from your data folder
                </p>
                {isUploading && (
                  <p className="text-sm text-blue-600 mt-2">{uploadProgress}</p>
                )}
              </label>
            </div>
          </div>

          {/* Loading Progress */}
          {isLoading && (
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center mb-2">
                  <RefreshCw className="h-4 w-4 text-blue-600 mr-2 animate-spin" />
                  <span className="text-sm font-medium text-blue-900">Loading Default Data Files</span>
                </div>
                <p className="text-sm text-blue-700">{loadProgress}</p>
              </div>
            </div>
          )}

          {/* Data Files List */}
          {dataFiles.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Available Data Files ({dataFiles.length})</h4>
              <div className="grid gap-3">
                {dataFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-blue-500 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {file.data.length} records • {file.type} • {(file.size / 1024).toFixed(1)} KB
                          {file.lastModified && ` • Uploaded: ${file.lastModified.toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        file.type === 'crm' ? 'bg-green-100 text-green-800' :
                        file.type === 'erp' ? 'bg-blue-100 text-blue-800' :
                        file.type === 'financial' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {file.type.toUpperCase()}
                      </span>
                      <button
                        onClick={() => removeFile(file.name)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isLoading && !isUploading && dataFiles.length === 0 && (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No Data Files Available</h4>
              <p className="text-gray-600 mb-4">
                Please upload your CSV files or load the default sample data to begin analysis.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={reloadDefaultDataFiles}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Load Sample Data
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Analysis Progress */}
        {isAnalyzing && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <RefreshCw className="h-5 w-5 text-blue-600 mr-2 animate-spin" />
              <h3 className="text-lg font-semibold text-blue-900">Analysis in Progress</h3>
            </div>
            <p className="text-blue-700 mb-3">{analysisProgress}</p>
            
            {/* Progress bar with better animation */}
            <div className="mt-4 w-full bg-blue-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-1000 ease-in-out" 
                style={{ 
                  width: analysisProgress.includes('terminée') ? '100%' : 
                         analysisProgress.includes('Finalisation') ? '90%' :
                         analysisProgress.includes('Scoring') ? '80%' :
                         analysisProgress.includes('temporels') ? '70%' :
                         analysisProgress.includes('association') ? '60%' :
                         analysisProgress.includes('transformation') ? '40%' :
                         analysisProgress.includes('Fusion') ? '20%' : '10%'
                }}
              ></div>
            </div>
            
            {/* Additional info */}
            <div className="mt-3 text-sm text-blue-600">
              <p>⏱️ This may take a few moments depending on data size</p>
              <p>📊 Processing {dataFiles.length} data files</p>
            </div>
            
            {/* Cancel button */}
            <button
              onClick={() => {
                setIsAnalyzing(false);
                setAnalysisProgress('');
              }}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
            >
              Cancel Analysis
            </button>
          </div>
        )}

        {/* Configuration Panel */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Analysis Configuration</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Patterns</label>
              <select
                value={config.maxPatterns}
                onChange={(e) => setConfig({ ...config, maxPatterns: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={4}>4 Patterns</option>
                <option value={6}>6 Patterns</option>
                <option value={8}>8 Patterns</option>
                <option value={10}>10 Patterns</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Confidence</label>
              <select
                value={config.minConfidence}
                onChange={(e) => setConfig({ ...config, minConfidence: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={0.5}>50%</option>
                <option value={0.6}>60%</option>
                <option value={0.7}>70%</option>
                <option value={0.8}>80%</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Complexity Level</label>
              <select
                value={config.complexityLevel}
                onChange={(e) => setConfig({ ...config, complexityLevel: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="expert">Expert</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Support</label>
              <select
                value={config.minSupport}
                onChange={(e) => setConfig({ ...config, minSupport: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={0.05}>5%</option>
                <option value={0.1}>10%</option>
                <option value={0.15}>15%</option>
                <option value={0.2}>20%</option>
              </select>
            </div>
          </div>
        </div>

        {/* Detected Patterns */}
        {(() => {
          console.log('🎨 Rendering patterns section:', {
            hasAnalysisResult: !!analysisResult,
            hasPatterns: !!analysisResult?.patterns,
            patternsLength: analysisResult?.patterns?.length || 0,
            shouldShowPatterns: !!(analysisResult && analysisResult.patterns && analysisResult.patterns.length > 0)
          });
          return null;
        })()}
        
        {analysisResult && analysisResult.patterns && analysisResult.patterns.length > 0 ? (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Detected Patterns</h2>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm text-green-600">
                  {analysisResult.statistics?.validation?.valid || 0} valid patterns
                </span>
              </div>
            </div>
            
            <div className="grid gap-6">
              {analysisResult.patterns.map((pattern, index) => (
                <div key={pattern.id} className="border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {index + 1}. {pattern.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Award className="h-4 w-4 mr-1 text-purple-500" />
                          Impact: {(Number(pattern.impact) || 0).toFixed(1)}%
                        </span>
                        <span className="flex items-center">
                          <Target className="h-4 w-4 mr-1 text-blue-500" />
                          Confidence: {((Number(pattern.scores?.confidence) || 0) * 100).toFixed(1)}%
                        </span>
                        <span className="flex items-center">
                          <Activity className="h-4 w-4 mr-1 text-orange-500" />
                          Score: {((Number(pattern.scores?.overallScore) || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {((Number(pattern.scores?.overallScore) || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          (pattern.complexity || 'Medium') === 'Very High' ? 'bg-red-100 text-red-800' :
                          (pattern.complexity || 'Medium') === 'High' ? 'bg-orange-100 text-orange-800' :
                          (pattern.complexity || 'Medium') === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {pattern.complexity || 'Medium'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4">{pattern.description || 'No description available'}</p>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                        Key Variables
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(pattern.variables || []).map((variable, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {variable}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 text-green-500" />
                        Business Value
                      </h4>
                      <ul className="space-y-1 text-sm text-gray-700">
                        {(pattern.businessValue || []).slice(0, 3).map((value, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-green-500 mr-2">•</span>
                            {value}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-purple-500" />
                      Implementation Steps
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      {(pattern.implementation || []).slice(0, 4).map((step, idx) => (
                        <div key={idx} className="flex items-start">
                          <span className="text-purple-500 mr-2 text-sm font-medium">Phase {idx + 1}:</span>
                          <span className="text-sm text-gray-700">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center py-12">
            <h3 className="text-xl font-bold text-gray-900 mb-4">No Patterns Detected</h3>
            <p className="text-gray-600 mb-4">
              No sales patterns were detected based on the provided data. Please ensure your data is in the correct format and contains sufficient transactions.
            </p>
            <p className="text-gray-600">
              You can try:
              <ul className="list-disc list-inside text-left mt-2 text-gray-700">
                <li>Uploading more data files</li>
                <li>Adjusting the analysis configuration (e.g., min confidence, support)</li>
                <li>Checking the data files for any potential issues</li>
              </ul>
            </p>
          </div>
        )}

        {/* Analysis Statistics */}
        {analysisResult && analysisResult.statistics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <PieChart className="h-5 w-5 mr-2 text-blue-500" />
                Pattern Quality Distribution
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Excellent (≥80%)</span>
                  <span className="font-semibold text-green-600">
                    {analysisResult.statistics.scoring?.scoreDistribution?.excellent || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Good (60-80%)</span>
                  <span className="font-semibold text-blue-600">
                    {analysisResult.statistics.scoring?.scoreDistribution?.good || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Fair (40-60%)</span>
                  <span className="font-semibold text-yellow-600">
                    {analysisResult.statistics.scoring?.scoreDistribution?.fair || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Poor (&lt;40%)</span>
                  <span className="font-semibold text-red-600">
                    {analysisResult.statistics.scoring?.scoreDistribution?.poor || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-purple-500" />
                Complexity Distribution
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Very High</span>
                  <span className="font-semibold text-red-600">
                    {analysisResult.statistics.scoring?.complexityDistribution?.veryHigh || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">High</span>
                  <span className="font-semibold text-orange-600">
                    {analysisResult.statistics.scoring?.complexityDistribution?.high || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Medium</span>
                  <span className="font-semibold text-yellow-600">
                    {analysisResult.statistics.scoring?.complexityDistribution?.medium || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Low</span>
                  <span className="font-semibold text-green-600">
                    {analysisResult.statistics.scoring?.complexityDistribution?.low || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Error rendering SalesPatterns component:', error);
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Rendering Patterns</h3>
          <p className="text-gray-600 mb-4">
            An unexpected error occurred while trying to render the patterns section.
          </p>
          <p className="text-gray-600">
            Please check the console for more details and ensure your data is in the correct format.
          </p>
        </div>
      </div>
    );
  }
};

export default SalesPatterns; 