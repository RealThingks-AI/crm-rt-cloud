import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/common/ui/dialog";
import { Button } from "@/components/common/ui/button";
import { Checkbox } from "@/components/common/ui/checkbox";
import { Label } from "@/components/common/ui/label";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical } from "lucide-react";

interface Column {
  key: string;
  label: string;
  visible: boolean;
}

interface ColumnCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  columns: Column[];
  onSave: (columns: Column[]) => void;
  title?: string;
}

export const ColumnCustomizer = ({ 
  isOpen, 
  onClose, 
  columns, 
  onSave, 
  title = "Customize Columns" 
}: ColumnCustomizerProps) => {
  const [localColumns, setLocalColumns] = useState<Column[]>(columns);

  const handleVisibilityChange = (columnKey: string, visible: boolean) => {
    setLocalColumns(prev => 
      prev.map(col => 
        col.key === columnKey ? { ...col, visible } : col
      )
    );
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(localColumns);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setLocalColumns(items);
  };

  const handleSave = () => {
    onSave(localColumns);
    onClose();
  };

  const handleReset = () => {
    setLocalColumns(columns);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Drag to reorder columns and check/uncheck to show/hide them.
          </p>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="columns">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {localColumns.map((column, index) => (
                    <Draggable key={column.key} draggableId={column.key} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="flex items-center space-x-3 p-2 bg-muted rounded-md"
                        >
                          <div {...provided.dragHandleProps}>
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <Checkbox
                            id={column.key}
                            checked={column.visible}
                            onCheckedChange={(checked) => 
                              handleVisibilityChange(column.key, checked as boolean)
                            }
                          />
                          <Label 
                            htmlFor={column.key}
                            className="flex-1 cursor-pointer"
                          >
                            {column.label}
                          </Label>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};