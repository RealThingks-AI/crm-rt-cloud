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
import { Plus, MoreHorizontal, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Contact {
  id: string;
  contact_name: string;
  company_name: string;
  position: string;
  email: string;
  phone_no: string;
  mobile_no: string;
  industry: string;
  city: string;
  country: string;
  contact_source: string;
  lead_status: string;
  created_time: string;
}

export const ContactTable = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("created_time", { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast({
        title: "Error",
        description: "Failed to fetch contacts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    Object.values(contact).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) {
    return <div className="h-96 bg-muted rounded animate-pulse"></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell className="font-medium">{contact.contact_name}</TableCell>
                <TableCell>{contact.company_name}</TableCell>
                <TableCell>{contact.position}</TableCell>
                <TableCell>
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                      {contact.email}
                    </a>
                  )}
                </TableCell>
                <TableCell>{contact.phone_no}</TableCell>
                <TableCell>{contact.industry}</TableCell>
                <TableCell>
                  <Badge variant="outline">{contact.lead_status || 'Active'}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredContacts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? "No contacts found matching your search." : "No contacts found."}
          </div>
        )}
      </div>
    </div>
  );
};