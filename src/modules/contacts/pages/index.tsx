import { ContactTable } from "../components/ContactTable";

const Contacts = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Contacts</h1>
          <p className="text-muted-foreground">Manage your business contacts and relationships</p>
        </div>
      </div>

      {/* Contact Table */}
      <ContactTable />
    </div>
  );
};

export default Contacts;