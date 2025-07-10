import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Deal } from '@/hooks/useDeals';

interface WinRateMetricProps {
  deals: Deal[];
}

const WinRateMetric = ({ deals }: WinRateMetricProps) => {
  const closedDeals = deals.filter(deal => ['Won', 'Lost'].includes(deal.stage));
  const wonDeals = deals.filter(deal => deal.stage === 'Won');
  const winRate = closedDeals.length > 0 ? (wonDeals.length / closedDeals.length) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-center">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="hsl(var(--muted))"
                strokeWidth="8"
                fill="transparent"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="hsl(var(--primary))"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2.51 * winRate} ${251.2 - 2.51 * winRate}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-foreground">
                {Math.round(winRate)}%
              </span>
            </div>
          </div>
        </div>
        <div className="text-center mt-2">
          <p className="text-xs text-muted-foreground">
            {wonDeals.length} won / {closedDeals.length} closed
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WinRateMetric;