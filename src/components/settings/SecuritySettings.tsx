
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Smartphone, 
  Key, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Lock
} from "lucide-react";

const SecuritySettings = () => {
  const { toast } = useToast();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleEnable2FA = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    toast({
      title: twoFactorEnabled ? "2FA Disabled" : "2FA Enabled",
      description: twoFactorEnabled 
        ? "Two-factor authentication has been disabled." 
        : "Two-factor authentication has been enabled for enhanced security.",
    });
  };

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Password Updated",
      description: "Your password has been changed successfully.",
    });
    
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleTerminateAllSessions = () => {
    toast({
      title: "Sessions Terminated",
      description: "All active sessions have been terminated. You will need to log in again on other devices.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account with 2FA.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {twoFactorEnabled ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              )}
              <Switch
                checked={twoFactorEnabled}
                onCheckedChange={handleEnable2FA}
              />
            </div>
          </div>
          
          {twoFactorEnabled && (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium">2FA Setup Complete</h4>
              <p className="text-sm text-muted-foreground">
                Your account is protected with two-factor authentication using your authenticator app.
              </p>
              <div className="space-y-2">
                <p className="text-sm font-medium">Recovery Codes:</p>
                <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                  <span className="p-2 bg-background rounded border">ABC1-2DE3</span>
                  <span className="p-2 bg-background rounded border">FGH4-5IJ6</span>
                  <span className="p-2 bg-background rounded border">KLM7-8NO9</span>
                  <span className="p-2 bg-background rounded border">PQR0-1ST2</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Save these recovery codes in a safe place. You can use them to access your account if you lose your phone.
                </p>
              </div>
            </div>
          )}
          
          {!twoFactorEnabled && (
            <Button onClick={handleEnable2FA}>
              Set Up Two-Factor Authentication
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>
          
          <Button onClick={handlePasswordChange}>
            Update Password
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Session Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Manage your active sessions across different devices and browsers.
          </p>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <div>
                <p className="font-medium">Current Session</p>
                <p className="text-sm text-muted-foreground">Chrome on Windows • Active now</p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <div>
                <p className="font-medium">Mobile App</p>
                <p className="text-sm text-muted-foreground">iOS App • Last active 2 hours ago</p>
              </div>
              <Button variant="ghost" size="sm">
                <Lock className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <div>
                <p className="font-medium">Safari on macOS</p>
                <p className="text-sm text-muted-foreground">Last active yesterday</p>
              </div>
              <Button variant="ghost" size="sm">
                <Lock className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <Button 
            variant="destructive" 
            onClick={handleTerminateAllSessions}
          >
            Terminate All Other Sessions
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Login Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Recent login attempts and security events.
          </p>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-muted rounded">
              <span className="text-sm">Successful login from Chrome</span>
              <span className="text-xs text-muted-foreground">2 minutes ago</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-muted rounded">
              <span className="text-sm">Password changed</span>
              <span className="text-xs text-muted-foreground">1 day ago</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-muted rounded">
              <span className="text-sm">Successful login from Mobile App</span>
              <span className="text-xs text-muted-foreground">2 days ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecuritySettings;
