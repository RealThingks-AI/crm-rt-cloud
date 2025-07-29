
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, ArrowUpDown } from "lucide-react";
import { useUserDisplayNames } from "@/hooks/useUserDisplayNames";
import { ContactColumnConfig } from "../ContactColumnCustomizer";

interface Contact {
  id: string;
  contact_name: string;
  company_name?: string;
  position?: string;
  email?: string;
  phone_no?: string;
  country?: string;
  contact_owner?: string;
  lead_status?: string;
  created_by?: string;
  [key: string]: any;
}

interface ContactTableBodyProps {
  loading: boolean;
  pageContacts: Contact[];
  visibleColumns: ContactColumnConfig[];
  selectedContacts: string[];
  setSelectedContacts: React.Dispatch<React.SetStateAction<string[]>>;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
  searchTerm: string;
}

export const ContactTableBody = ({
  loading,
  pageContacts,
  visibleColumns,
  selectedContacts,
  setSelectedContacts,
  onEdit,
  onDelete,
  searchTerm
}: ContactTableBodyProps) => {
  const createdByIds = [...new Set(pageContacts.map(c => c.created_by).filter(Boolean))];
  const { displayNames } = useUserDisplayNames(createdByIds);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pageContactIds = pageContacts.slice(0, 50).map(c => c.id);
      setSelectedContacts(pageContactIds);
    } else {
      setSelectedContacts([]);
    }
  };

  const handleSelectContact = (contactId: string, checked: boolean) => {
    if (checked) {
      setSelectedContacts(prev => [...prev, contactId]);
    } else {
      setSelectedContacts(prev => prev.filter(id => id !== contactId));
    }
  };

  if (loading) {
    return (
      <Table>
        <TableBody>
          <TableRow>
            <TableCell colSpan={visibleColumns.length + 2} className="text-center py-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
                Loading contacts...
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  if (pageContacts.length === 0) {
    return (
      <Table>
        <TableBody>
          <TableRow>
            <TableCell colSpan={visibleColumns.length + 2} className="text-center py-8">
              <div className="flex flex-col items-center gap-2">
                <p className="text-muted-foreground">No contacts found</p>
                {searchTerm && (
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search terms
                  </p>
                )}
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox
              checked={selectedContacts.length > 0 && selectedContacts.length === Math.min(pageContacts.length, 50)}
              onCheckedChange={handleSelectAll}
            />
          </TableHead>
          {visibleColumns.map((column) => (
            <TableHead key={column.field}>
              <div className="flex items-center gap-2">
                {column.label}
                <ArrowUpDown className="w-4 h-4" />
              </div>
            </TableHead>
          ))}
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pageContacts.map((contact) => (
          <TableRow key={contact.id}>
            <TableCell>
              <Checkbox
                checked={selectedContacts.includes(contact.id)}
                onCheckedChange={(checked) => handleSelectContact(contact.id, checked as boolean)}
              />
            </TableCell>
            {visibleColumns.map((column) => (
              <TableCell key={column.field}>
                {column.field === 'contact_name' ? (
                  <button
                    onClick={() => onEdit(contact)}
                    className="text-primary hover:underline font-medium"
                  >
                    {contact[column.field as keyof Contact]}
                  </button>
                ) : column.field === 'contact_owner' ? (
                  contact.created_by 
                    ? displayNames[contact.created_by] || "Unknown"
                    : '-'
                ) : column.field === 'lead_status' && contact.lead_status ? (
                  <Badge variant={contact.lead_status === 'Converted' ? 'default' : 'secondary'}>
                    {contact.lead_status}
                  </Badge>
                ) : (
                  contact[column.field as keyof Contact] || '-'
                )}
              </TableCell>
            ))}
            <TableCell>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(contact)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(contact.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
