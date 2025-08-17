
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  HardDrive, 
  FileText,
  Archive
} from "lucide-react";

const DataStorageSettings = () => {
  const { toast } = useToast();
  const [storageUsed] = useState(65); // 65% of storage used

  const handleExportData = (dataType: string) => {
    toast({
      title: `Exporting ${dataType}`,
      description: "Your data export will be ready shortly. You'll receive an email when it's complete.",
    });
  };

  const handleImportData = () => {
    toast({
      title: "Import started",
      description: "Data import process has begun. Please wait for completion.",
    });
  };

  const handleBackup = () => {
    toast({
      title: "Backup initiated",
      description: "Creating backup of your data. This may take a few minutes.",
    });
  };

  const handleRestore = () => {
    toast({
      title: "Restore process",
      description: "Please select a backup file to restore from.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Storage Usage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Storage Used</span>
              <span>{storageUsed}% of 10 GB</span>
            </div>
            <Progress value={storageUsed} className="h-2" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">2,456</div>
              <div className="text-sm text-muted-foreground">Contacts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">1,234</div>
              <div className="text-sm text-muted-foreground">Leads</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">892</div>
              <div className="text-sm text-muted-foreground">Deals</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Export your data in CSV format for backup or migration purposes.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              onClick={() => handleExportData('Contacts')}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Export Contacts
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleExportData('Leads')}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Export Leads
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleExportData('Deals')}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Export Deals
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleExportData('All Data')}
              className="flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              Export All Data
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Import data from CSV files. Make sure your files match the required format.
          </p>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <Label className="text-sm text-muted-foreground">
                Drop CSV files here or click to browse
              </Label>
            </div>
            
            <Button onClick={handleImportData} className="w-full">
              Start Import Process
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="w-5 h-5" />
            Backup & Restore
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Create backups of your data and restore from previous backups.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={handleBackup}
              className="flex items-center gap-2"
            >
              <Archive className="w-4 h-4" />
              Create Backup
            </Button>
            <Button 
              variant="outline"
              onClick={handleRestore}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Restore from Backup
            </Button>
          </div>

          <div className="mt-4">
            <Label className="text-sm font-medium">Recent Backups</Label>
            <div className="mt-2 space-y-2">
              <div className="flex justify-between items-center p-2 bg-muted rounded">
                <span className="text-sm">Backup_2024-01-15_10-30.zip</span>
                <Button variant="ghost" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted rounded">
                <span className="text-sm">Backup_2024-01-08_10-30.zip</span>
                <Button variant="ghost" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataStorageSettings;
