
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Download, 
  Search,
  Calendar,
  User,
  Activity,
  AlertCircle
} from "lucide-react";

const AuditLogsSettings = () => {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState("7days");
  const [logType, setLogType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const handleExportLogs = () => {
    toast({
      title: "Exporting Logs",
      description: "Your audit trail export will be ready shortly.",
    });
  };

  const activityLogs = [
    {
      id: 1,
      action: "Deal Created",
      user: "John Smith",
      details: "Created deal 'Enterprise Solution' worth $50,000",
      timestamp: "2024-01-17 14:30:22",
      type: "success"
    },
    {
      id: 2,
      action: "Contact Updated",
      user: "Sarah Johnson",
      details: "Updated contact information for 'Acme Corp'",
      timestamp: "2024-01-17 13:45:18",
      type: "info"
    },
    {
      id: 3,
      action: "Login Failed",
      user: "unknown@example.com",
      details: "Failed login attempt from IP 192.168.1.100",
      timestamp: "2024-01-17 12:15:33",
      type: "warning"
    },
    {
      id: 4,
      action: "Data Export",
      user: "Mike Davis",
      details: "Exported contacts data (2,456 records)",
      timestamp: "2024-01-17 11:20:45",
      type: "info"
    },
    {
      id: 5,
      action: "User Role Changed",
      user: "Admin System",
      details: "Changed role for user 'jane.doe@company.com' from User to Manager",
      timestamp: "2024-01-17 10:05:12",
      type: "success"
    }
  ];

  const errorLogs = [
    {
      id: 1,
      error: "Database Connection Timeout",
      details: "Connection to database failed after 30 seconds",
      timestamp: "2024-01-17 14:25:30",
      severity: "high"
    },
    {
      id: 2,
      error: "Email Delivery Failed",
      details: "Failed to send notification email to user@example.com",
      timestamp: "2024-01-17 13:40:15",
      severity: "medium"
    },
    {
      id: 3,
      error: "API Rate Limit Exceeded",
      details: "Microsoft Teams API rate limit exceeded",
      timestamp: "2024-01-17 12:10:22",
      severity: "low"
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Log Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-range">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1day">Last 24 hours</SelectItem>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="90days">Last 90 days</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="log-type">Log Type</Label>
              <Select value={logType} onValueChange={setLogType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Logs</SelectItem>
                  <SelectItem value="activity">Activity Logs</SelectItem>
                  <SelectItem value="security">Security Logs</SelectItem>
                  <SelectItem value="errors">Error Logs</SelectItem>
                  <SelectItem value="api">API Logs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <Button onClick={handleExportLogs} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Audit Trail
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Activity Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activityLogs.map((log) => (
              <div key={log.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  log.type === 'success' ? 'bg-green-500' :
                  log.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{log.action}</p>
                      <p className="text-sm text-muted-foreground">{log.details}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{log.user}</span>
                        <Calendar className="w-3 h-3 text-muted-foreground ml-2" />
                        <span className="text-xs text-muted-foreground">{log.timestamp}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-center mt-4">
            <Button variant="outline">Load More Logs</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Error Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {errorLogs.map((log) => (
              <div key={log.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                <AlertCircle className={`w-5 h-5 mt-1 ${
                  log.severity === 'high' ? 'text-red-500' :
                  log.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                }`} />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{log.error}</p>
                      <p className="text-sm text-muted-foreground">{log.details}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 rounded text-xs ${
                          log.severity === 'high' ? 'bg-red-100 text-red-800' :
                          log.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {log.severity.toUpperCase()}
                        </span>
                        <Calendar className="w-3 h-3 text-muted-foreground ml-2" />
                        <span className="text-xs text-muted-foreground">{log.timestamp}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-center mt-4">
            <Button variant="outline">Load More Errors</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogsSettings;
