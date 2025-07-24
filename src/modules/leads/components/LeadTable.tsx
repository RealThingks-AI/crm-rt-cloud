import { useState, useEffect } from "react";
import { supabase } from "@/supabase/client";
import { useAuth } from "@/supabase/auth";
import { Button } from "@/components/common/ui/button";
import { Input } from "@/components/common/ui/input";
import { Badge } from "@/components/common/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/common/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/common/ui/dropdown-menu";
import { Plus, MoreHorizontal, Search, Download, Upload, Settings } from "lucide-react";
import { LeadModal } from "./LeadModal";
import { LeadColumnCustomizer } from "./LeadColumnCustomizer";
import { ImportExportBar } from "@/components/common/ImportExportBar";
import { BulkActionsBar } from "@/components/common/BulkActionsBar";
import { InlineEditCell } from "@/components/common/InlineEditCell";
import { ColumnCustomizer } from "@/components/common/ColumnCustomizer";
import { toast } from "@/hooks/use-toast";

interface Lead {
  id: string;
  lead_name: string;
  company_name: string;
  position: string;
  email: string;
  phone_no: string;
  mobile_no: string;
  linkedin: string;
  industry: string;
  city: string;
  country: string;
  website: string;
  lead_status: string;
  contact_source: string;
  description: string;
  contact_owner: string;
  created_by: string;
  modified_by: string;
  created_time: string;
  modified_time: string;
}

const defaultColumns = [
  { key: "lead_name", label: "Lead Name", visible: true },
  { key: "company_name", label: "Company", visible: true },
  { key: "position", label: "Position", visible: true },
  { key: "email", label: "Email", visible: true },
  { key: "phone_no", label: "Phone", visible: true },
  { key: "mobile_no", label: "Mobile", visible: false },
  { key: "linkedin", label: "LinkedIn", visible: false },
  { key: "industry", label: "Industry", visible: true },
  { key: "city", label: "City", visible: false },
  { key: "country", label: "Country", visible: false },
  { key: "website", label: "Website", visible: false },
  { key: "lead_status", label: "Status", visible: true },
  { key: "contact_source", label: "Source", visible: true },
  { key: "description", label: "Description", visible: false },
  { key: "created_time", label: "Created", visible: false },
];

export const LeadTable = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [columns, setColumns] = useState(defaultColumns);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_time", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast({
        title: "Error",
        description: "Failed to fetch leads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", leadId);

      if (error) throw error;

      await fetchLeads();
      toast({
        title: "Success",
        description: "Lead deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast({
        title: "Error",
        description: "Failed to delete lead",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    try {
      const { error } = await supabase
        .from("leads")
        .delete()
        .in("id", selectedLeads);

      if (error) throw error;

      await fetchLeads();
      setSelectedLeads([]);
      toast({
        title: "Success",
        description: `${selectedLeads.length} leads deleted successfully`,
      });
    } catch (error) {
      console.error("Error deleting leads:", error);
      toast({
        title: "Error",
        description: "Failed to delete leads",
        variant: "destructive",
      });
    }
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    }
  };

  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleInlineEdit = async (leadId: string, field: string, value: string) => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({ 
          [field]: value,
          modified_by: user?.id,
          modified_time: new Date().toISOString()
        })
        .eq("id", leadId);

      if (error) throw error;

      await fetchLeads();
      toast({
        title: "Success",
        description: "Lead updated successfully",
      });
    } catch (error) {
      console.error("Error updating lead:", error);
      toast({
        title: "Error",
        description: "Failed to update lead",
        variant: "destructive",
      });
    }
  };

  const filteredLeads = leads.filter(lead =>
    Object.values(lead).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const visibleColumns = columns.filter(col => col.visible);

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'hot':
        return 'destructive';
      case 'warm':
        return 'default';
      case 'cold':
        return 'secondary';
      case 'qualified':
        return 'default';
      case 'converted':
        return 'default';
      default:
        return 'outline';
    }
  };

  const renderCellContent = (lead: Lead, column: any) => {
    const value = lead[column.key as keyof Lead];
    
    if (column.key === 'lead_status') {
      return (
        <Badge variant={getStatusBadgeVariant(value as string)}>
          {value || 'Unknown'}
        </Badge>
      );
    }

    if (column.key === 'email' && value) {
      return <a href={`mailto:${value}`} className="text-primary hover:underline">{value}</a>;
    }

    if (column.key === 'website' && value) {
      return <a href={value as string} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{value}</a>;
    }

    if (column.key === 'linkedin' && value) {
      return <a href={value as string} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">LinkedIn</a>;
    }

    if (column.key === 'created_time' || column.key === 'modified_time') {
      return value ? new Date(value as string).toLocaleDateString() : '';
    }

    return (
      <InlineEditCell
        value={value as string || ''}
        onSave={(newValue) => handleInlineEdit(lead.id, column.key, newValue)}
        className="max-w-[200px]"
      />
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-muted rounded w-32 animate-pulse"></div>
          <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
        </div>
        <div className="h-96 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2">
          <ImportExportBar 
            onImport={() => {}} 
            onExport={() => {}}
            type="leads"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCustomizerOpen(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Columns
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedLeads.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedLeads.length}
          onDelete={handleBulkDelete}
          onCancel={() => setSelectedLeads([])}
        />
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                  onChange={handleSelectAll}
                  className="rounded"
                />
              </TableHead>
              {visibleColumns.map((column) => (
                <TableHead key={column.key}>{column.label}</TableHead>
              ))}
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedLeads.includes(lead.id)}
                    onChange={() => handleSelectLead(lead.id)}
                    className="rounded"
                  />
                </TableCell>
                {visibleColumns.map((column) => (
                  <TableCell key={column.key}>
                    {renderCellContent(lead, column)}
                  </TableCell>
                ))}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingLead(lead);
                          setIsModalOpen(true);
                        }}
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(lead.id)}
                        className="text-destructive"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredLeads.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? "No leads found matching your search." : "No leads found. Add your first lead to get started."}
          </div>
        )}
      </div>

      {/* Modals */}
      <LeadModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLead(null);
        }}
        lead={editingLead}
        onSuccess={fetchLeads}
      />

      <LeadColumnCustomizer
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        columns={columns}
        onSave={setColumns}
      />
    </div>
  );
};