
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, Euro, TrendingUp, Calendar, Target } from "lucide-react";
import YearlyRevenueSummary from "@/components/YearlyRevenueSummary";
import { useDashboardStats } from "@/hooks/useYearlyRevenueData";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { stats, isLoading: statsLoading } = useDashboardStats();

  // Get current year's revenue data for additional metrics
  const currentYear = new Date().getFullYear();
  const { data: currentYearData, isLoading: yearDataLoading } = useQuery({
    queryKey: ['current-year-revenue', currentYear],
    queryFn: async () => {
      // Get yearly target
      const { data: targetData } = await supabase
        .from('yearly_revenue_targets')
        .select('total_target')
        .eq('year', currentYear)
        .single();

      // Get all deals for current year
      const { data: deals } = await supabase
        .from('deals')
        .select('*')
        .or(`closing_date.gte.${currentYear}-01-01,closing_date.lte.${currentYear}-12-31`);

      let projectedRevenue = 0;
      let totalForecast = 0;

      deals?.forEach(deal => {
        // Projected Revenue: Sum of Total Contract Value from RFQ stage deals
        if (deal.stage === 'RFQ' && deal.total_contract_value) {
          projectedRevenue += Number(deal.total_contract_value);
        }
        
        // Total Forecast: Sum of Won + RFQ deals
        if ((deal.stage === 'Won' && deal.total_revenue) || (deal.stage === 'RFQ' && deal.total_contract_value)) {
          if (deal.stage === 'Won' && deal.total_revenue) {
            totalForecast += Number(deal.total_revenue);
          } else if (deal.stage === 'RFQ' && deal.total_contract_value) {
            totalForecast += Number(deal.total_contract_value);
          }
        }
      });

      return {
        annualTarget: targetData?.total_target || 0,
        projectedRevenue,
        totalForecast
      };
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isDataLoading = statsLoading || yearDataLoading;

  return (
    <div className="p-6 space-y-8">
      {/* Dashboard Cards - Single Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Annual Target</CardTitle>
            <Target className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            {isDataLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(currentYearData?.annualTarget || 0)}</div>
            )}
            <p className="text-xs text-muted-foreground">{currentYear} target</p>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Euro className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {isDataLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
            )}
            <p className="text-xs text-muted-foreground">From Won deals</p>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Projected Revenue</CardTitle>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {isDataLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(currentYearData?.projectedRevenue || 0)}</div>
            )}
            <p className="text-xs text-muted-foreground">From RFQ deals</p>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Forecast</CardTitle>
            <BarChart3 className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            {isDataLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(currentYearData?.totalForecast || 0)}</div>
            )}
            <p className="text-xs text-muted-foreground">Won + RFQ total</p>
          </CardContent>
        </Card>

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

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Yearly Revenue Summary Section */}
      <YearlyRevenueSummary />
    </div>
  );
};

export default Dashboard;
