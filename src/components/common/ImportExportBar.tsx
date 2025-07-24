import { Button } from "@/components/common/ui/button";
import { Download, Upload } from "lucide-react";

interface ImportExportBarProps {
  onImport: () => void;
  onExport: () => void;
  type: string;
}

export const ImportExportBar = ({ onImport, onExport, type }: ImportExportBarProps) => {
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={onImport}>
        <Upload className="h-4 w-4 mr-2" />
        Import {type}
      </Button>
      <Button variant="outline" size="sm" onClick={onExport}>
        <Download className="h-4 w-4 mr-2" />
        Export {type}
      </Button>
    </div>
  );
};