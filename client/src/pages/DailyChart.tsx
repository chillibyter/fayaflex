import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Flame, Footprints, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { Capacitor } from "@capacitor/core";

type DailyData = {
  date: string;
  fullDate: string;
  value: number;
};

type CalorieDiagnostic = {
  dataType: string;
  value: number;
  status: string;
};

function useCalorieDiagnostics(isCalories: boolean) {
  const [diagnostics, setDiagnostics] = useState<CalorieDiagnostic[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isCalories) return;

    const runDiagnostics = async () => {
      setLoading(true);
      const results: CalorieDiagnostic[] = [];

      if (Capacitor.isNativePlatform()) {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        try {
          const { Health } = await import("capacitor-health");
          const dataTypes = ['active-calories', 'calories', 'total-calories'];

          for (const dataType of dataTypes) {
            try {
              const raw: any = await Health.queryAggregated({
                startDate: startOfDay.toISOString(),
                endDate: endOfDay.toISOString(),
                dataType,
                bucket: 'day'
              });
              const data = raw?.aggregatedData || raw?.data || raw || [];
              const total = data.reduce((sum: number, s: any) => sum + (s?.value ?? s?.quantity ?? 0), 0);
              results.push({ dataType, value: Math.round(total), status: 'ok' });
            } catch (err: any) {
              results.push({ dataType, value: 0, status: err.message || 'error' });
            }
          }
        } catch (err) {
          results.push({ dataType: 'plugin', value: 0, status: 'Health plugin not available' });
        }
      } else {
        try {
          const res = await apiRequest("GET", "/api/stats/calorie-diagnostics");
          const data = await res.json();
          if (data.diagnostics) {
            results.push(...data.diagnostics);
          }
        } catch {
          results.push(
            { dataType: 'active-calories', value: 0, status: 'web only' },
            { dataType: 'calories', value: 0, status: 'web only' },
            { dataType: 'total-calories', value: 0, status: 'web only' }
          );
        }
      }

      setDiagnostics(results);
      setLoading(false);
    };

    runDiagnostics();
  }, [isCalories]);

  return { diagnostics, loading };
}

export default function DailyChart() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const metric = searchParams.get('metric') || 'calories';
  
  const isCalories = metric === 'calories';
  const title = isCalories ? 'Daily Calories' : 'Daily Steps';
  const unit = isCalories ? 'kcal' : 'steps';
  const color = isCalories ? 'hsl(24, 95%, 53%)' : 'hsl(142, 76%, 36%)';
  const Icon = isCalories ? Flame : Footprints;

  const { diagnostics, loading: diagLoading } = useCalorieDiagnostics(isCalories);

  const { 
    data: dailyData = [], 
    isLoading,
    isError 
  } = useQuery<DailyData[]>({
    queryKey: ['/api/stats/daily-breakdown', metric],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/stats/daily-breakdown?metric=${metric}`);
      return res.json();
    }
  });

  const formattedData = dailyData.map(d => ({
    ...d,
    label: format(new Date(d.fullDate), 'MMM d'),
    shortLabel: format(new Date(d.fullDate), 'd')
  }));

  const total = dailyData.reduce((sum, d) => sum + d.value, 0);
  const average = dailyData.length > 0 ? Math.round(total / dailyData.length) : 0;
  const maxDay = dailyData.reduce((max, d) => d.value > max.value ? d : max, { date: '', fullDate: '', value: 0 });
  
  const lastWeek = formattedData.slice(-7);
  const previousWeek = formattedData.slice(-14, -7);
  const lastWeekTotal = lastWeek.reduce((sum, d) => sum + d.value, 0);
  const previousWeekTotal = previousWeek.reduce((sum, d) => sum + d.value, 0);
  const weeklyChange = previousWeekTotal > 0 ? Math.round(((lastWeekTotal - previousWeekTotal) / previousWeekTotal) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className={`px-4 pt-4 pb-6 ${isCalories ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-gradient-to-br from-green-500 to-green-600'} text-white rounded-b-3xl`}>
        <div className="flex items-center gap-3 mb-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 min-w-[44px] min-h-[44px]" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">{title}</h1>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-white/20 border-0 backdrop-blur">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-white/80">Monthly Total</p>
              <p className="text-xl font-bold text-white">{total.toLocaleString()}</p>
              <p className="text-xs text-white/80">{unit}</p>
            </CardContent>
          </Card>
          <Card className="bg-white/20 border-0 backdrop-blur">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-white/80">Daily Average</p>
              <p className="text-xl font-bold text-white">{average.toLocaleString()}</p>
              <p className="text-xs text-white/80">{unit}</p>
            </CardContent>
          </Card>
          <Card className="bg-white/20 border-0 backdrop-blur">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-white/80">Weekly Trend</p>
              <div className="flex items-center justify-center gap-1">
                {weeklyChange >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-white" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-white" />
                )}
                <p className="text-xl font-bold text-white">{weeklyChange >= 0 ? '+' : ''}{weeklyChange}%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {isCalories && diagnostics.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-3">
            {diagnostics.map((d) => (
              <Card key={d.dataType} className="bg-white/20 border-0 backdrop-blur">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-white/80 truncate" data-testid={`text-diag-label-${d.dataType}`}>{d.dataType}</p>
                  <p className="text-lg font-bold text-white" data-testid={`text-diag-value-${d.dataType}`}>
                    {d.status === 'ok' ? d.value.toLocaleString() : '--'}
                  </p>
                  <p className="text-xs text-white/80">
                    {d.status === 'ok' ? 'today' : d.status.substring(0, 15)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {isCalories && diagLoading && (
          <div className="mt-3">
            <p className="text-xs text-white/70 text-center">Reading health data...</p>
          </div>
        )}
      </header>

      <main className="px-4 py-6 space-y-6">
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : isError ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">Failed to load data</p>
          </Card>
        ) : dailyData.length === 0 ? (
          <Card className="p-6 text-center">
            <div className="space-y-3">
              <Icon className={`h-12 w-12 mx-auto ${isCalories ? 'text-orange-300' : 'text-green-300'}`} />
              <p className="text-muted-foreground">No {isCalories ? 'calories' : 'steps'} logged this month yet</p>
              <Link href="/track">
                <Button variant="default" data-testid="button-log-activity">
                  Log Your First Activity
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${isCalories ? 'text-orange-500' : 'text-green-500'}`} />
                  Daily Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formattedData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <XAxis 
                        dataKey="shortLabel" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        interval={Math.floor(formattedData.length / 10)}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                        }}
                        labelFormatter={(label, payload) => {
                          if (payload && payload[0]) {
                            return payload[0].payload.label;
                          }
                          return label;
                        }}
                        formatter={(value: number) => [`${value.toLocaleString()} ${unit}`, title]}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {formattedData.map((entry, index) => {
                          const isMaxDay = entry.fullDate === maxDay.fullDate;
                          const barColor = isCalories 
                            ? (isMaxDay ? 'hsl(24, 95%, 53%)' : 'hsl(24, 95%, 53%, 0.5)')
                            : (isMaxDay ? 'hsl(142, 76%, 36%)' : 'hsl(142, 76%, 36%, 0.5)');
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={barColor} 
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {maxDay.value > 0 && maxDay.fullDate && (
              <Card className={`border-${isCalories ? 'orange' : 'green'}-200 dark:border-${isCalories ? 'orange' : 'green'}-800`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full ${isCalories ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-green-100 dark:bg-green-900/30'} flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${isCalories ? 'text-orange-500' : 'text-green-500'}`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Best Day This Month</p>
                      <p className="font-semibold">
                        {format(new Date(maxDay.fullDate), 'MMMM d')} - {maxDay.value.toLocaleString()} {unit}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recent Days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {formattedData.slice(-7).reverse().map((day) => (
                    <div key={day.fullDate} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-sm">{day.label}</span>
                      <span className="font-medium">{day.value.toLocaleString()} {unit}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
