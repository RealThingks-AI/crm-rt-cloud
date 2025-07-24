import { ContactTable } from "@/components/ContactTable";
import { Button } from "@/components/common/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/common/ui/dropdown-menu";
import { Settings, Download, Upload, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/common/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/supabase/client";
import { exportContactsToCSV, downloadCSV, parseCSVFile } from "@/utils/csvUtils";

const Contacts = () => {
  const { toast } = useToast();
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [handleExport, setHandleExport] = useState<(() => void) | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      console.log('Starting CSV import...');
      
      // Parse the CSV file
      const csvData = await parseCSVFile(file);
      
      if (csvData.length === 0) {
        toast({
          title: "Import Error",
          description: "No valid contacts found in the CSV file",
          variant: "destructive",
        });
        return;
      }

      console.log('Parsed CSV data:', csvData);

      // Convert CSV data to database format
      const user = await supabase.auth.getUser();
      const contactsToInsert = csvData.map(row => ({
        contact_name: row['Contact Name'],
        company_name: row['Company Name'] || null,
        position: row['Position'] || null,
        email: row['Email'] || null,
        phone_no: row['Phone'] || null,
        mobile_no: row['Mobile'] || null,
        country: row['Region'] || null,
        city: row['City'] || null,
        industry: row['Industry'] || null,
        contact_source: row['Contact Source'] || null,
        linkedin: row['LinkedIn'] || null,
        website: row['Website'] || null,
        description: row['Description'] || null,
        contact_owner: row['Contact Owner'] || user.data.user?.id, // Auto-map to current user if not specified
        created_by: user.data.user?.id
      })).filter(contact => contact.contact_name); // Only include contacts with names

      console.log('Contacts to insert:', contactsToInsert);

      // Insert into database
      const { error } = await supabase
        .from('contacts')
        .insert(contactsToInsert);

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }

      toast({
        title: "Import Successful",
        description: `Successfully imported ${contactsToInsert.length} contacts`,
      });
      
      // Reset the input and refresh data by triggering a page refresh
      event.target.value = '';
      window.location.reload();
      
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Error",
        description: "Failed to import contacts. Please check your CSV format.",
        variant: "destructive",
      });
    }
  };

  const handleExportContacts = async () => {
    try {
      console.log('Starting export process...');
      
      // Fetch all contacts from database
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_time', { ascending: false });

      if (error) {
        console.error('Database fetch error:', error);
        throw error;
      }

      if (!contacts || contacts.length === 0) {
        toast({
          title: "No Data",
          description: "No contacts available to export",
          variant: "destructive",
        });
        return;
      }

      console.log('Fetched contacts for export:', contacts.length);

      // Use the CSV utility function for consistent export
      const csvContent = exportContactsToCSV(contacts);

      console.log('CSV content created');

      const filename = `contacts_export_${new Date().toISOString().split('T')[0]}.csv`;
      
      // Open CSV content in new window (works reliably in iframes)
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>${filename}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .header { margin-bottom: 20px; }
                .download-btn { 
                  background: #007bff; 
                  color: white; 
                  padding: 10px 20px; 
                  border: none; 
                  border-radius: 5px; 
                  cursor: pointer; 
                  margin-right: 10px;
                }
                .copy-btn { 
                  background: #28a745; 
                  color: white; 
                  padding: 10px 20px; 
                  border: none; 
                  border-radius: 5px; 
                  cursor: pointer; 
                }
                pre { 
                  background: #f8f9fa; 
                  padding: 15px; 
                  border: 1px solid #ddd; 
                  border-radius: 5px; 
                  overflow: auto;
                  white-space: pre-wrap;
                  word-wrap: break-word;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h2>Contacts Export - ${filename}</h2>
                <p>Your CSV data is ready. Use the buttons below to download or copy the content:</p>
                <button class="download-btn" onclick="downloadCSV()">Download CSV File</button>
                <button class="copy-btn" onclick="copyToClipboard()">Copy to Clipboard</button>
              </div>
              <pre id="csvContent">${csvContent}</pre>
              <script>
                function downloadCSV() {
                  const blob = new Blob([\`${csvContent}\`], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = '${filename}';
                  a.click();
                  URL.revokeObjectURL(url);
                }
                
                function copyToClipboard() {
                  const content = document.getElementById('csvContent').textContent;
                  navigator.clipboard.writeText(content).then(() => {
                    alert('CSV content copied to clipboard!');
                  }).catch(() => {
                    // Fallback for older browsers
                    const textarea = document.createElement('textarea');
                    textarea.value = content;
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                    alert('CSV content copied to clipboard!');
                  });
                }
              </script>
            </body>
          </html>
        `);
        newWindow.document.close();
        
        toast({
          title: "Export Successful",
          description: `Opened ${contacts.length} contacts in new window. Use the download button to save as ${filename}`,
        });
      } else {
        // Fallback: copy to clipboard
        try {
          await navigator.clipboard.writeText(csvContent);
          toast({
            title: "Export Successful",
            description: `${contacts.length} contacts copied to clipboard as CSV format`,
          });
        } catch (clipboardError) {
          toast({
            title: "Export Ready",
            description: `CSV content prepared for ${contacts.length} contacts. Please check console for data.`,
          });
          console.log('CSV Content:');
          console.log(csvContent);
        }
      }
      
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Error",
        description: "Failed to export contacts. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedContacts.length === 0) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .in('id', selectedContacts);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedContacts.length} contacts deleted successfully`,
      });
      
      setSelectedContacts([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete contacts",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Contacts</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            onClick={() => setShowColumnCustomizer(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Column Customization
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default">
                <Download className="w-4 h-4 mr-2" />
                Action
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild>
                <label className="flex items-center cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Import CSV
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleImportCSV}
                    className="hidden"
                  />
                </label>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportContacts}>
                <Download className="w-4 h-4 mr-2" />
                Export All
              </DropdownMenuItem>
              {selectedContacts.length > 0 && (
                <DropdownMenuItem 
                  onClick={handleBulkDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected ({selectedContacts.length})
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Contact Table */}
      <ContactTable 
        showColumnCustomizer={showColumnCustomizer}
        setShowColumnCustomizer={setShowColumnCustomizer}
        showModal={showModal}
        setShowModal={setShowModal}
        onExportReady={() => {}} // No longer needed
        selectedContacts={selectedContacts}
        setSelectedContacts={setSelectedContacts}
      />
    </div>
  );
};

export default Contacts;