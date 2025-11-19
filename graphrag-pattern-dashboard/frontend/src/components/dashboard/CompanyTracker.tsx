import React from 'react';
import { Upload, CheckCircle } from 'lucide-react';

const CompanyTracker: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Company Data Tracker</h2>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Data</h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Upload your data files</h4>
          <p className="text-gray-600 mb-4">Drag and drop files here or click to browse</p>
          <button className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors">
            Choose Files
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Uploads</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">sales_data_q4.csv</p>
                <p className="text-xs text-gray-600">Uploaded 2 hours ago • 2.4 MB</p>
              </div>
            </div>
            <span className="text-xs text-green-600 font-medium">Processed</span>
          </div>
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Upload className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">customer_data.xlsx</p>
                <p className="text-xs text-gray-600">Uploaded yesterday • 5.1 MB</p>
              </div>
            </div>
            <span className="text-xs text-blue-600 font-medium">Processing</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyTracker; 