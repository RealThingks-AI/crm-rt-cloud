
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, TrendingUp, Target, Award } from 'lucide-react';
import { Deal } from '@/hooks/useDeals';

interface DealsStatsProps {
  deals: Deal[];
}

const DealsStats = ({ deals }: DealsStatsProps) => {
  const totalValue = deals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
  const wonDeals = deals.filter(deal => deal.stage === 'Won');
  const wonValue = wonDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
  const averageDealSize = deals.length > 0 ? totalValue / deals.length : 0;
  const winRate = deals.length > 0 ? (wonDeals.length / deals.length) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pipeline Value</p>
              <p className="text-3xl font-bold text-gray-900">${totalValue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Won Deals Value</p>
              <p className="text-3xl font-bold text-gray-900">${wonValue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Award className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Deal Size</p>
              <p className="text-3xl font-bold text-gray-900">${averageDealSize.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Win Rate</p>
              <p className="text-3xl font-bold text-gray-900">{winRate.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Target className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DealsStats;
