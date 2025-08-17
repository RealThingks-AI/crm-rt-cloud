
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Search, AlertTriangle, Info, CheckCircle } from "lucide-react";

const AuditLogsSettings = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [logType, setLogType] = useState("all");
  const { toast } = useToast();

  // Mock data for demonstration
  const [activityLogs] = useState([
    {
      id: "1",
      timestamp: "2024-01-17 10:30:25",
      user: "john.doe@company.com",
      action: "User Login",
      resource: "Authentication",
      status: "success",
      ip: "192.168.1.100",
    },
    {
      id: "2",
      timestamp: "2024-01-17 10:25:18",
      user: "jane.smith@company.com", 
      action: "Deal Created",
      resource: "Deal #1234",
      status: "success",
      ip: "192.168.1.101",
    },
    {
      id: "3",
      timestamp: "2024-01-17 10:20:45",
      user: "system",
      action: "Data Export",
      resource: "Contacts",
      status: "success",
      ip: "internal",
    },
  ]);

  const [errorLogs] = useState([
    {
      id: "1",
      timestamp: "2024-01-17 09:45:12",
      level: "error",
      message: "Database connection timeout",
      source: "DatabaseService",
      stack: "ConnectionError: timeout after 30s",
    },
    {
      id: "2",
      timestamp: "2024-01-17 09:30:05",
      level: "warning",
      message: "API rate limit approaching",
      source: "APIGateway",
      stack: "Rate: 95/100 requests per minute",
    },
  ]);

  // Filter logs based on search term and type
  const filteredActivityLogs = activityLogs.filter(log => {
    const matchesSearch = searchTerm === "" || 
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredErrorLogs = errorLogs.filter(log => {
    const matchesSearch = searchTerm === "" || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.level.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleExportAuditTrail = () => {
    const dataToExport = logType === "activity" ? filteredActivityLogs : 
                        logType === "error" ? filteredErrorLogs : 
                        [...filteredActivityLogs, ...filteredErrorLogs];
    
    // Create CSV content
    const csvContent = "data:text/csv;charset=utf-8," + 
      (logType === "activity" || logType === "all" ? 
        "Type,Timestamp,User,Action,Resource,Status,IP\n" +
        filteredActivityLogs.map(log => 
          `Activity,${log.timestamp},${log.user},${log.action},${log.resource},${log.status},${log.ip}`
        ).join("\n") : "") +
      (logType === "all" ? "\n" : "") +
      (logType === "error" || logType === "all" ? 
        (logType === "all" ? "" : "Type,Timestamp,Level,Message,Source,Details\n") +
        filteredErrorLogs.map(log => 
          `Error,${log.timestamp},${log.level},${log.message},${log.source},${log.stack}`
        ).join("\n") : "");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Complete",
      description: "Your audit trail has been exported successfully.",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getLevelBadge = (level: string) => {
    const variants = {
      error: "destructive",
      warning: "secondary",
      info: "default",
    } as const;
    
    return (
      <Badge variant={variants[level as keyof typeof variants] || "default"}>
        {level}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Audit & Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={logType} onValueChange={setLogType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Log type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Logs</SelectItem>
                <SelectItem value="activity">Activity Logs</SelectItem>
                <SelectItem value="error">Error Logs</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExportAuditTrail} className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs */}
      {(logType === "all" || logType === "activity") && (
        <Card>
          <CardHeader>
            <CardTitle>Activity Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivityLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {log.timestamp}
                      </TableCell>
                      <TableCell>{log.user}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.resource}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          <span className="capitalize">{log.status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.ip}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Logs */}
      {(logType === "all" || logType === "error") && (
        <Card>
          <CardHeader>
            <CardTitle>Error Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredErrorLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {log.timestamp}
                      </TableCell>
                      <TableCell>
                        {getLevelBadge(log.level)}
                      </TableCell>
                      <TableCell>{log.message}</TableCell>
                      <TableCell>{log.source}</TableCell>
                      <TableCell className="font-mono text-sm max-w-xs truncate">
                        {log.stack}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AuditLogsSettings;
