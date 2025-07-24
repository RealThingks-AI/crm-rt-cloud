import { Button } from "@/components/common/ui/button";
import { Trash2, X } from "lucide-react";

interface BulkActionsBarProps {
  selectedCount: number;
  onDelete: () => void;
  onCancel: () => void;
}

export const BulkActionsBar = ({ selectedCount, onDelete, onCancel }: BulkActionsBarProps) => {
  return (
    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
      <span className="text-sm font-medium">
        {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Selected
        </Button>
      </div>
    </div>
  );
};