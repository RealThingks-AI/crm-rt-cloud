
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Calendar, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDeals } from '@/hooks/useDeals';
import DealsOverviewChart from '@/components/dashboard/DealsOverviewChart';
import DealsPipelineChart from '@/components/dashboard/DealsPipelineChart';
import DealsValueChart from '@/components/dashboard/DealsValueChart';
import WinRateMetric from '@/components/dashboard/WinRateMetric';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';

const Dashboard = () => {
  const navigate = useNavigate();
  const { deals, loading: dealsLoading } = useDeals();
  const [stats, setStats] = useState({
    leads: 0,
    contacts: 0,
    meetings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [leadsResult, contactsResult, meetingsResult] = await Promise.all([
          supabase.from('leads').select('*'),
          supabase.from('contacts').select('*'),
          supabase.from('meetings').select('*'),
        ]);

        setStats({
          leads: leadsResult.data?.length || 0,
          contacts: contactsResult.data?.length || 0,
          meetings: meetingsResult.data?.length || 0,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Calculate deals metrics
  const totalDeals = deals.length;
  const totalValue = deals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
  const avgDealSize = totalDeals > 0 ? totalValue / totalDeals : 0;
  const activePipeline = deals.filter(deal => !['Won', 'Lost', 'Dropped'].includes(deal.stage)).length;

  const widgets = [
    {
      title: 'Total Leads',
      count: stats.leads,
      icon: Users,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      route: '/leads'
    },
    {
      title: 'Total Contacts',
      count: stats.contacts,
      icon: Users,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
      route: '/contacts'
    },
    {
      title: 'Total Meetings',
      count: stats.meetings,
      icon: Calendar,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      route: '/meetings'
    }
  ];

  if (loading || dealsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to your CRM analytics overview</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardMetrics 
          totalDeals={totalDeals}
          totalValue={totalValue}
          avgDealSize={avgDealSize}
          activePipeline={activePipeline}
        />
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DealsOverviewChart deals={deals} />
        <WinRateMetric deals={deals} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DealsPipelineChart deals={deals} />
        <DealsValueChart deals={deals} />
      </div>

      {/* Additional Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {widgets.map((widget) => (
          <Card 
            key={widget.title}
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
            onClick={() => navigate(widget.route)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{widget.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{widget.count}</p>
                </div>
                <div className={`p-3 ${widget.bgColor} rounded-full`}>
                  <widget.icon className={`h-6 w-6 ${widget.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
