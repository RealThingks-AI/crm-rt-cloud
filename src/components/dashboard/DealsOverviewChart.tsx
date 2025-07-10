import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Deal } from '@/hooks/useDeals';

interface DealsOverviewChartProps {
  deals: Deal[];
}

const DealsOverviewChart = ({ deals }: DealsOverviewChartProps) => {
  // Generate monthly data for the last 6 months
  const generateMonthlyData = () => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      const monthDeals = deals.filter(deal => {
        const dealDate = new Date(deal.created_at);
        return dealDate.getMonth() === date.getMonth() && 
               dealDate.getFullYear() === date.getFullYear();
      });
      
      months.push({
        month: monthName,
        deals: monthDeals.length,
        value: monthDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0)
      });
    }
    
    return months;
  };

  const chartData = generateMonthlyData();

  const chartConfig = {
    deals: {
      label: "Deals",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Deals Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis hide />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line 
                type="monotone" 
                dataKey="deals" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default DealsOverviewChart;