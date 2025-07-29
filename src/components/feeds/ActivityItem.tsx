
import { Badge } from "@/components/ui/badge";
import { BarChart3, Calendar, User, Mail, Phone, FileText } from "lucide-react";

interface ActivityItemProps {
  type: string;
  title: string;
  description: string;
  user: string;
  time: string;
  details: string;
}

export const ActivityItem = ({ type, title, description, user, time, details }: ActivityItemProps) => {
  const getIcon = () => {
    switch (type) {
      case 'deal_update':
      case 'deal_created':
        return BarChart3;
      case 'meeting':
      case 'meeting_scheduled':
        return Calendar;
      case 'contact_added':
        return User;
      case 'email':
        return Mail;
      case 'call':
        return Phone;
      case 'document':
        return FileText;
      default:
        return FileText;
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'deal_update':
      case 'deal_created':
        return 'bg-green-100 text-green-600';
      case 'meeting':
      case 'meeting_scheduled':
        return 'bg-blue-100 text-blue-600';
      case 'contact_added':
        return 'bg-purple-100 text-purple-600';
      case 'email':
        return 'bg-orange-100 text-orange-600';
      case 'call':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getBadgeVariant = () => {
    switch (type) {
      case 'deal_update':
      case 'deal_created':
        return 'default';
      case 'meeting':
      case 'meeting_scheduled':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const Icon = getIcon();

  return (
    <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getIconColor()}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold">{title}</h3>
          <span className="text-xs text-muted-foreground">{time}</span>
        </div>
        <p className="text-sm text-muted-foreground mb-1">{description}</p>
        <p className="text-xs text-primary font-medium mb-2">{details}</p>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {user}
          </Badge>
          <Badge variant={getBadgeVariant()} className="text-xs">
            {type.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </div>
    </div>
  );
};
