
import React from "react";

interface AnalysisData {
  condition: string;
  severity: string;
  recommendations: string[];
  disclaimer: string;
}

interface AnalysisResultsProps {
  analysis: AnalysisData;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ analysis }) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
      <div className="flex items-center mb-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
        <h3 className="font-semibold text-blue-900">AI Analysis Results</h3>
      </div>
      
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium text-gray-700">Condition:</span>
          <span className="ml-2 text-gray-900">{analysis.condition}</span>
        </div>
        
        <div>
          <span className="font-medium text-gray-700">Severity:</span>
          <span className="ml-2 text-gray-900">{analysis.severity}</span>
        </div>
        
        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <div>
            <span className="font-medium text-gray-700">Recommendations:</span>
            <ul className="ml-2 mt-1 space-y-1">
              {analysis.recommendations.map((rec, index) => (
                <li key={index} className="text-gray-900 text-xs">• {rec}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="mt-3 pt-2 border-t border-blue-200">
          <p className="text-xs text-gray-600 italic">{analysis.disclaimer}</p>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;
