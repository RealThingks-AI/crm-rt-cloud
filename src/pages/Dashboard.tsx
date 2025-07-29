
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar } from "lucide-react";
import YearlyRevenueSummary from "@/components/YearlyRevenueSummary";
import { useDashboardStats } from "@/hooks/useYearlyRevenueData";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { stats, isLoading: statsLoading } = useDashboardStats();

  const isDataLoading = statsLoading;

  return (
    <div className="p-6 space-y-8">
      {/* Yearly Revenue Summary Section */}
      <YearlyRevenueSummary />

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Live Dashboard Content */}
      <div className="space-y-6">
        {/* Remaining Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
              <Users className="w-4 h-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              {isDataLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.totalDeals || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">All pipeline stages</p>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Won Deals</CardTitle>
              <Calendar className="w-4 h-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              {isDataLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-2xl font-bold">{stats?.wonDeals || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Closed successfully</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
