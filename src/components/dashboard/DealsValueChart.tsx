import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Deal, DEAL_STAGES } from '@/hooks/useDeals';

interface DealsValueChartProps {
  deals: Deal[];
}

const DealsValueChart = ({ deals }: DealsValueChartProps) => {
  const chartData = DEAL_STAGES.map(stage => {
    const stageDeals = deals.filter(deal => deal.stage === stage);
    const totalValue = stageDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
    
    return {
      stage: stage.substring(0, 3), // Abbreviate for better display
      value: totalValue,
      count: stageDeals.length
    };
  }).filter(item => item.count > 0);

  const chartConfig = {
    value: {
      label: "Value",
      color: "hsl(var(--primary))",
    },
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Value by Stage</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis 
                dataKey="stage" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis hide />
              <ChartTooltip 
                content={<ChartTooltipContent 
                  formatter={(value) => [formatValue(Number(value)), 'Value']}
                />} 
              />
              <Bar 
                dataKey="value" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default DealsValueChart;