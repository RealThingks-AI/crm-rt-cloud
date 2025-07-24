import { useState, useEffect } from "react";
import { supabase } from "@/supabase/client";
import { useAuth } from "@/supabase/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/common/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/common/ui/tabs";
import { Button } from "@/components/common/ui/button";
import { Badge } from "@/components/common/ui/badge";
import { Calendar, Users, DollarSign, TrendingUp, Phone, Mail, Clock, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    totalLeads: 0,
    totalContacts: 0,
    totalDeals: 0,
    totalMeetings: 0,
    recentLeads: [],
    recentContacts: [],
    upcomingMeetings: [],
    dealsPipeline: [],
    monthlyRevenue: [],
    leadsBySource: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch counts and recent data
      const [leadsResponse, contactsResponse, dealsResponse, meetingsResponse] = await Promise.all([
        supabase.from("leads").select("*", { count: "exact" }),
        supabase.from("contacts").select("*", { count: "exact" }),
        supabase.from("deals").select("*", { count: "exact" }),
        supabase.from("meetings").select("*", { count: "exact" }),
      ]);

      const [recentLeadsResponse, recentContactsResponse, upcomingMeetingsResponse] = await Promise.all([
        supabase.from("leads").select("*").order("created_time", { ascending: false }).limit(5),
        supabase.from("contacts").select("*").order("created_time", { ascending: false }).limit(5),
        supabase.from("meetings").select("*").order("date", { ascending: true }).limit(5),
      ]);

      // Process deals pipeline data
      const dealsPipelineData = dealsResponse.data?.reduce((acc, deal) => {
        const stage = deal.stage || "Unknown";
        const existingStage = acc.find(item => item.stage === stage);
        if (existingStage) {
          existingStage.count += 1;
          existingStage.value += Number(deal.amount) || 0;
        } else {
          acc.push({
            stage,
            count: 1,
            value: Number(deal.amount) || 0,
          });
        }
        return acc;
      }, []) || [];

      // Process leads by source
      const leadsBySourceData = leadsResponse.data?.reduce((acc, lead) => {
        const source = lead.contact_source || "Unknown";
        const existing = acc.find(item => item.source === source);
        if (existing) {
          existing.count += 1;
        } else {
          acc.push({ source, count: 1 });
        }
        return acc;
      }, []) || [];

      setDashboardData({
        totalLeads: leadsResponse.count || 0,
        totalContacts: contactsResponse.count || 0,
        totalDeals: dealsResponse.count || 0,
        totalMeetings: meetingsResponse.count || 0,
        recentLeads: recentLeadsResponse.data || [],
        recentContacts: recentContactsResponse.data || [],
        upcomingMeetings: upcomingMeetingsResponse.data || [],
        dealsPipeline: dealsPipelineData,
        monthlyRevenue: [], // Would need historical data
        leadsBySource: leadsBySourceData,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.user_metadata?.display_name || user?.email}</p>
        </div>
        <Button onClick={fetchDashboardData}>Refresh</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalLeads}</div>
            <p className="text-xs text-muted-foreground">Active prospects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalContacts}</div>
            <p className="text-xs text-muted-foreground">In your network</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalDeals}</div>
            <p className="text-xs text-muted-foreground">In pipeline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meetings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalMeetings}</div>
            <p className="text-xs text-muted-foreground">Scheduled</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Leads by Source */}
            <Card>
              <CardHeader>
                <CardTitle>Leads by Source</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dashboardData.leadsBySource}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ source, percent }) => `${source} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {dashboardData.leadsBySource.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pipeline Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Deals Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardData.dealsPipeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Value by Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dashboardData.dealsPipeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Value']} />
                  <Bar dataKey="value" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Leads */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Leads</CardTitle>
                <CardDescription>Latest prospects added to your pipeline</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.recentLeads.map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{lead.lead_name}</p>
                        <p className="text-sm text-muted-foreground">{lead.company_name}</p>
                      </div>
                      <Badge variant="outline">{lead.lead_status}</Badge>
                    </div>
                  ))}
                  {dashboardData.recentLeads.length === 0 && (
                    <p className="text-sm text-muted-foreground">No recent leads</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Meetings */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Meetings</CardTitle>
                <CardDescription>Your scheduled appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.upcomingMeetings.map((meeting) => (
                    <div key={meeting.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{meeting.meeting_title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(meeting.date).toLocaleDateString()} at {meeting.start_time}
                        </p>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        {meeting.duration}
                      </div>
                    </div>
                  ))}
                  {dashboardData.upcomingMeetings.length === 0 && (
                    <p className="text-sm text-muted-foreground">No upcoming meetings</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;