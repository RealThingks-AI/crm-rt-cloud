
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, Euro, TrendingUp, Calendar, Target } from "lucide-react";
import YearlyRevenueSummary from "@/components/YearlyRevenueSummary";
import { useDashboardStats } from "@/hooks/useYearlyRevenueData";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { stats, isLoading: statsLoading } = useDashboardStats();

  // Get recent deals
  const { data: recentDeals, isLoading: dealsLoading } = useQuery({
    queryKey: ['recent-deals'],
    queryFn: async () => {
      const { data } = await supabase
        .from('deals')
        .select('*')
        .order('modified_at', { ascending: false })
        .limit(4);
      return data || [];
    },
  });

  // Get team performance (using deals created by different users)
  const { data: teamPerformance, isLoading: teamLoading } = useQuery({
    queryKey: ['team-performance'],
    queryFn: async () => {
      const { data: deals } = await supabase
        .from('deals')
        .select('created_by, amount, stage');

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name');

      const performanceMap = new Map();
      
      deals?.forEach(deal => {
        const userId = deal.created_by;
        if (!performanceMap.has(userId)) {
          performanceMap.set(userId, {
            deals: 0,
            revenue: 0,
            name: profiles?.find(p => p.id === userId)?.full_name || 'Unknown User'
          });
        }
        
        const user = performanceMap.get(userId);
        user.deals += 1;
        if (deal.stage === 'Won') {
          user.revenue += Number(deal.amount || 0);
        }
      });

      return Array.from(performanceMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 4);
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

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Won': return 'text-green-600';
      case 'Qualified': return 'text-blue-600';
      case 'RFQ': return 'text-orange-600';
      case 'Offered': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Yearly Revenue Summary Section */}
      <YearlyRevenueSummary />

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Live Dashboard Content */}
      <div className="space-y-6">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
              <BarChart3 className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.totalDeals || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">All pipeline stages</p>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <Euro className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
              )}
              <p className="text-xs text-muted-foreground">From all deals</p>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Won Deals</CardTitle>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-2xl font-bold">{stats?.wonDeals || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Closed successfully</p>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Meetings Today</CardTitle>
              <Calendar className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-8" />
              ) : (
                <div className="text-2xl font-bold">{stats?.todayMeetings || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Scheduled for today</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Recent Deals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dealsLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentDeals?.map((deal, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{deal.project_name || deal.deal_name}</p>
                        <p className={`text-sm ${getStageColor(deal.stage)}`}>{deal.stage}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {formatCurrency(deal.amount || 0)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teamLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {teamPerformance?.map((member, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.deals} deals</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(member.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
