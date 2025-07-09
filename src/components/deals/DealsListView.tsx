import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import DealsColumnCustomizer, { type DealColumn } from './DealsColumnCustomizer';
import type { Deal } from '@/hooks/useDeals';

interface DealsListViewProps {
  deals: Deal[];
  onEdit: (deal: Deal) => void;
  onDelete: (dealId: string) => void;
}

const DEFAULT_COLUMNS: DealColumn[] = [
  { key: 'deal_name', label: 'Deal Title', required: true, visible: true },
  { key: 'company_name', label: 'Company', required: true, visible: true },
  { key: 'contact_owner', label: 'Contact Owner', required: false, visible: true },
  { key: 'stage', label: 'Stage', required: false, visible: true },
  { key: 'probability', label: 'Probability', required: false, visible: true },
  { key: 'closing_date', label: 'Close Date', required: false, visible: true },
  { key: 'amount', label: 'Value', required: false, visible: true },
  { key: 'modified_at', label: 'Last Updated', required: false, visible: true },
];

const DealsListView = ({ deals, onEdit, onDelete }: DealsListViewProps) => {
  const [columns, setColumns] = useState<DealColumn[]>(DEFAULT_COLUMNS);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
    key: '',
    direction: null
  });

  const visibleColumns = useMemo(() => columns.filter(col => col.visible), [columns]);

  const sortedDeals = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return deals;

    return [...deals].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof Deal];
      const bValue = b[sortConfig.key as keyof Deal];

      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return sortConfig.direction === 'asc' ? 1 : -1;
      if (bValue === null) return sortConfig.direction === 'asc' ? -1 : 1;

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [deals, sortConfig]);

  const handleSort = (columnKey: string) => {
    setSortConfig(prev => ({
      key: columnKey,
      direction: prev.key === columnKey && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="h-4 w-4 text-blue-600" /> : 
      <ArrowDown className="h-4 w-4 text-blue-600" />;
  };

  const formatCellValue = (deal: Deal, columnKey: string) => {
    const value = deal[columnKey as keyof Deal];

    switch (columnKey) {
      case 'stage':
        return (
          <Badge variant="outline" className="text-xs">
            {value as string}
          </Badge>
        );
      case 'probability':
        return value ? `${value}%` : '0%';
      case 'amount':
        return value ? `$${Number(value).toLocaleString()}` : '-';
      case 'closing_date':
        return value ? format(new Date(value as string), 'MMM d, yyyy') : '-';
      case 'modified_at':
        return value ? format(new Date(value as string), 'MMM d, yyyy') : '-';
      case 'company_name':
        return 'Company Name'; // This would need to be fetched from related lead
      case 'contact_owner':
        return 'Contact Owner'; // This would need to be fetched from related lead owner
      default:
        return value as string || '-';
    }
  };

  if (deals.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No deals found</h3>
        <p className="text-gray-600">Create your first deal to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Column Customizer */}
      <div className="flex justify-end">
        <DealsColumnCustomizer 
          columns={columns}
          onColumnsChange={setColumns}
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map((column) => (
                <TableHead 
                  key={column.key}
                  className="cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {getSortIcon(column.key)}
                  </div>
                </TableHead>
              ))}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedDeals.map((deal) => (
              <TableRow key={deal.id}>
                {visibleColumns.map((column) => (
                  <TableCell key={column.key}>
                    {formatCellValue(deal, column.key)}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(deal)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(deal.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DealsListView;