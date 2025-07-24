import { LeadTable } from "../components/LeadTable";

const Leads = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Leads</h1>
          <p className="text-muted-foreground">Manage your sales prospects and opportunities</p>
        </div>
      </div>

      {/* Lead Table */}
      <LeadTable />
    </div>
  );
};

export default Leads;