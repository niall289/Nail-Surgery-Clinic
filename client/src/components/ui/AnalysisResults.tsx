import React from 'react';
import { cn } from '@/lib/utils';
import { 
  Card,
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface AnalysisResultsProps {
  analysis: {
    condition: string;
    severity: string;
    recommendations: string[];
    disclaimer: string;
  };
  className?: string;
}

/**
 * Component to display foot image analysis results in a structured card format
 */
export default function AnalysisResults({ analysis, className }: AnalysisResultsProps) {
  // Determine if this is an actual analysis or a fallback
  const isFallback = analysis.condition === "Unable to analyze image at this time" || 
                    analysis.severity === "unknown" ||
                    analysis.condition === "Image analysis completed";

  // Determine severity badge color
  const severityColor = () => {
    if (isFallback) return 'bg-gray-100 text-gray-800 hover:bg-gray-100';

    switch (analysis.severity.toLowerCase()) {
      case 'mild':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'severe':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  return (
    <Card className={cn("w-full bg-white shadow-sm border-l-4", 
      isFallback ? "border-l-gray-400" : 
      analysis.severity.toLowerCase() === 'mild' ? "border-l-green-500" : 
      analysis.severity.toLowerCase() === 'moderate' ? "border-l-yellow-500" : 
      analysis.severity.toLowerCase() === 'severe' ? "border-l-red-500" : "border-l-primary",
      className)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-md font-medium">AI Preliminary Assessment</CardTitle>
            <CardDescription>Based on the image you've provided</CardDescription>
          </div>
          {isFallback && (
            <div className="text-gray-400">
              <AlertTriangle size={20} />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-1">Potential Condition</h4>
          <p className={cn(
            "font-medium", 
            isFallback ? "text-gray-600" : "text-primary"
          )}>
            {analysis.condition}
          </p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-1">Apparent Severity</h4>
          <Badge className={severityColor()}>
            {analysis.severity === 'unknown' ? 'Undetermined' : 
             analysis.severity.charAt(0).toUpperCase() + analysis.severity.slice(1)}
          </Badge>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-1">Recommendations</h4>
          <ul className="list-disc pl-5 space-y-1">
            {analysis.recommendations.map((rec, index) => (
              <li key={index} className="text-sm">{rec}</li>
            ))}
          </ul>
        </div>
      </CardContent>

      <CardFooter className="pt-1 text-xs text-gray-500 italic">
        {analysis.disclaimer}
      </CardFooter>
    </Card>
  );
}