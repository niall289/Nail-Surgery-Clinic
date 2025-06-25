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
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-sm">
      <div className="flex items-start gap-2">
        <div className="text-blue-600 text-lg">🔍</div>
        <div className="flex-1">
          <h4 className="font-semibold text-blue-900 mb-2">AI Analysis Results</h4>

          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-gray-700">Condition:</span>
              <p className="text-gray-900">{analysis.condition}</p>
            </div>

            <div>
              <span className="font-medium text-gray-700">Severity:</span>
              <p className="text-gray-900">{analysis.severity}</p>
            </div>

            <div>
              <span className="font-medium text-gray-700">Recommendations:</span>
              <ul className="list-disc list-inside text-gray-900 ml-2">
                {analysis.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>

            <div className="text-xs text-gray-500 italic mt-3 pt-2 border-t border-blue-100">
              {analysis.disclaimer}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;