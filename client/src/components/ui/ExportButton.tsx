import React from 'react';
import { Button } from './ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExportButtonProps {
  consultationId?: number;
  className?: string;
}

/**
 * Button component for exporting consultation data to CSV
 */
export default function ExportButton({ consultationId, className }: ExportButtonProps) {
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      // Determine the appropriate URL based on whether we're exporting a single consultation or all
      const url = consultationId 
        ? `/api/consultations/${consultationId}/export/csv` 
        : `/api/consultations/export/csv`;

      // Open the URL in a new window/tab to trigger the download
      window.open(url, '_blank');

      toast({
        title: "Export Started",
        description: "Your CSV file is being downloaded.",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export Failed",
        description: "There was a problem exporting the data. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  return (
    <Button 
      onClick={handleExport} 
      variant="outline" 
      className={className}
      title="Export to spreadsheet"
    >
      <Download className="mr-2 h-4 w-4" /> 
      Export to CSV
    </Button>
  );
}