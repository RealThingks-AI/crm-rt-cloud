
import { useState, useMemo } from 'react';

export const useBulkActions = <T extends { id: string }>(items: T[]) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const isAllSelected = useMemo(() => {
    return items.length > 0 && selectedItems.length === items.length;
  }, [items.length, selectedItems.length]);

  const toggleSelectAll = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedItems(items.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const toggleSelectItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  return {
    selectedItems,
    isAllSelected,
    toggleSelectAll,
    toggleSelectItem,
    clearSelection,
    hasSelection: selectedItems.length > 0
  };
};
