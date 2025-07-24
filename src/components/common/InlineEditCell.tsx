import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/common/ui/input";
import { cn } from "@/lib/utils";

interface InlineEditCellProps {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export const InlineEditCell = ({ value, onSave, className, placeholder }: InlineEditCellProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editValue !== value) {
      onSave(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={cn("h-8 text-sm", className)}
        placeholder={placeholder}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn(
        "cursor-pointer hover:bg-muted/50 rounded px-2 py-1 min-h-[2rem] flex items-center truncate",
        className
      )}
      title={value || "Click to edit"}
    >
      {value || <span className="text-muted-foreground">{placeholder || "Click to edit"}</span>}
    </div>
  );
};