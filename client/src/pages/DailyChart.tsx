import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Flame, Footprints, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";

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
  const [todayDiag, setTodayDiag] = useState<CalorieDiagnostic[]>([]);
  const [march5Diag, setMarch5Diag] = useState<CalorieDiagnostic[]>([]);
  const [exerciseDiag, setExerciseDiag] = useState<CalorieDiagnostic[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isCalories) return;

    const queryDay = async (Health: any, startOfDay: Date, endOfDay: Date): Promise<CalorieDiagnostic[]> => {
      const results: CalorieDiagnostic[] = [];
      const dataTypes = ['active-calories', 'total-calories'];

      for (const dataType of dataTypes) {
        try {
          console.log(`[CalorieDiag] Querying ${dataType} for ${startOfDay.toDateString()}`);
          const raw: any = await Health.queryAggregated({
            startDate: startOfDay.toISOString(),
            endDate: endOfDay.toISOString(),
            dataType,
            bucket: 'day'
          });
          console.log(`[CalorieDiag] Raw result for ${dataType}:`, JSON.stringify(raw));
          const data = raw?.aggregatedData || raw?.data || raw || [];
          const arr = Array.isArray(data) ? data : [data];
          const total = arr.reduce((sum: number, s: any) => sum + (s?.value ?? s?.quantity ?? 0), 0);
          results.push({ dataType, value: Math.round(total), status: 'ok' });
        } catch (err: any) {
          console.log(`[CalorieDiag] Error for ${dataType}:`, err.message);
          results.push({ dataType, value: 0, status: err.message?.substring(0, 20) || 'error' });
        }
      }
      return results;
    };

    const queryExerciseCalories = async (Health: any, startOfDay: Date, endOfDay: Date): Promise<CalorieDiagnostic[]> => {
      const results: CalorieDiagnostic[] = [];
      try {
        console.log(`[CalorieDiag] Querying workouts for ${startOfDay.toDateString()}`);
        const workoutsRaw: any = await Health.queryWorkouts({
          startDate: startOfDay.toISOString(),
          endDate: endOfDay.toISOString(),
          includeHeartRate: false,
          includeRoute: false,
          includeSteps: false
        });
        const workouts = workoutsRaw?.workouts || [];
        console.log(`[CalorieDiag] Found ${workouts.length} workouts`);

        let workoutCaloriesFromPlugin = 0;
        let workoutCaloriesFromTotalCal = 0;
        let workoutCount = 0;

        for (const w of workouts) {
          workoutCount++;
          const wCal = w?.calories || 0;
          workoutCaloriesFromPlugin += wCal;
          console.log(`[CalorieDiag] Workout ${workoutCount}: type=${w.workoutType}, calories=${wCal}, start=${w.startDate}, end=${w.endDate}`);

          if (w.startDate && w.endDate) {
            try {
              const tcRaw: any = await Health.queryAggregated({
                startDate: w.startDate,
                endDate: w.endDate,
                dataType: 'total-calories',
                bucket: 'day'
              });
              const tcData = tcRaw?.aggregatedData || tcRaw?.data || tcRaw || [];
              const tcArr = Array.isArray(tcData) ? tcData : [tcData];
              const tcTotal = tcArr.reduce((sum: number, s: any) => sum + (s?.value ?? s?.quantity ?? 0), 0);
              workoutCaloriesFromTotalCal += tcTotal;
              console.log(`[CalorieDiag] Workout ${workoutCount} total-cal overlap: ${Math.round(tcTotal)}`);
            } catch (tcErr: any) {
              console.log(`[CalorieDiag] total-cal overlap query failed:`, tcErr.message);
            }
          }
        }

        results.push({
          dataType: 'workout-cal',
          value: Math.round(workoutCaloriesFromPlugin),
          status: workoutCount > 0 ? 'ok' : 'no workouts'
        });
        results.push({
          dataType: 'exercise-overlap',
          value: Math.round(workoutCaloriesFromTotalCal),
          status: workoutCount > 0 ? 'ok' : 'no workouts'
        });

        console.log(`[CalorieDiag] Exercise summary: ${workoutCount} workouts, plugin-cal=${Math.round(workoutCaloriesFromPlugin)}, overlap-cal=${Math.round(workoutCaloriesFromTotalCal)}`);
      } catch (err: any) {
        console.log(`[CalorieDiag] Workout query error:`, err.message);
        results.push(
          { dataType: 'workout-cal', value: 0, status: err.message?.substring(0, 20) || 'error' },
          { dataType: 'exercise-overlap', value: 0, status: err.message?.substring(0, 20) || 'error' }
        );
      }
      return results;
    };

    const runDiagnostics = async () => {
      setLoading(true);
      const platform = Capacitor.getPlatform();
      console.log('[CalorieDiag] Platform:', platform, 'isNative:', Capacitor.isNativePlatform());

      if (Capacitor.isNativePlatform()) {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayEnd.getDate() + 1);
        const march5Start = new Date(2026, 2, 5);
        const march5End = new Date(2026, 2, 6);

        try {
          const { Health } = await import("capacitor-health");
          const todayResults = await queryDay(Health, todayStart, todayEnd);
          const march5Results = await queryDay(Health, march5Start, march5End);
          const march5Exercise = await queryExerciseCalories(Health, march5Start, march5End);

          console.log('[CalorieDiag] Today:', JSON.stringify(todayResults));
          console.log('[CalorieDiag] March 5:', JSON.stringify(march5Results));
          console.log('[CalorieDiag] March 5 Exercise:', JSON.stringify(march5Exercise));
          setTodayDiag(todayResults);
          setMarch5Diag(march5Results);
          setExerciseDiag(march5Exercise);
        } catch (err: any) {
          console.log('[CalorieDiag] Plugin import error:', err.message);
          const fallback = [
            { dataType: 'active-calories', value: 0, status: 'no plugin' },
            { dataType: 'total-calories', value: 0, status: 'no plugin' }
          ];
          setTodayDiag(fallback);
          setMarch5Diag(fallback);
          setExerciseDiag([
            { dataType: 'workout-cal', value: 0, status: 'no plugin' },
            { dataType: 'exercise-overlap', value: 0, status: 'no plugin' }
          ]);
        }
      } else {
        const webFallback = [
          { dataType: 'active-calories', value: 0, status: 'web n/a' },
          { dataType: 'total-calories', value: 0, status: 'web n/a' }
        ];
        setTodayDiag(webFallback);
        setMarch5Diag(webFallback);
        setExerciseDiag([
          { dataType: 'workout-cal', value: 0, status: 'web n/a' },
          { dataType: 'exercise-overlap', value: 0, status: 'web n/a' }
        ]);
      }

      setLoading(false);
    };

    runDiagnostics();
  }, [isCalories]);

  return { todayDiag, march5Diag, exerciseDiag, loading };
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

  const { todayDiag, march5Diag, exerciseDiag, loading: diagLoading } = useCalorieDiagnostics(isCalories);

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

  // Build today's local date string without any Date object construction, to
  // avoid UTC-midnight timezone shifts (new Date('2026-04-03') is April 2 in UTC-1).
  const todayLocalStr = (() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
  })();

  const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const formattedData = dailyData.map(d => {
    // Parse date components directly from 'YYYY-MM-DD' — avoids all UTC/local shifts.
    const [, mm, dd] = d.fullDate.split('-');
    const dayNum  = parseInt(dd, 10);
    const monthIdx = parseInt(mm, 10) - 1;
    return {
      ...d,
      label: `${MONTH_ABBR[monthIdx]} ${dayNum}`,
      shortLabel: String(dayNum),
      isToday: d.fullDate === todayLocalStr,
    };
  });

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
      <header className={`px-4 pt-4 pb-6 ${isCalories ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-gradient-to-br from-green-600 to-green-700'} text-white rounded-b-3xl`}>
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

        {isCalories && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-white/70 font-medium">Today - Raw Data</p>
            <div className="grid grid-cols-2 gap-2">
              {(todayDiag.length > 0 ? todayDiag : ['active-calories', 'total-calories'].map(dt => ({ dataType: dt, value: 0, status: diagLoading ? 'loading' : '--' }))).map((d) => (
                <Card key={`today-${d.dataType}`} className="bg-white/20 border-0 backdrop-blur">
                  <CardContent className="p-2 text-center">
                    <p className="text-[10px] text-white/70 truncate" data-testid={`text-diag-today-${d.dataType}`}>{d.dataType}</p>
                    <p className="text-lg font-bold text-white" data-testid={`text-diag-today-val-${d.dataType}`}>
                      {d.status === 'ok' ? d.value.toLocaleString() : (diagLoading ? '...' : '--')}
                    </p>
                    <p className="text-[10px] text-white/70">
                      {d.status === 'ok' ? 'today' : d.status.substring(0, 15)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
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
                  <Icon className={`h-5 w-5 ${isCalories ? 'text-orange-500' : 'text-green-700'}`} />
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
                          // Today gets a solid accent; max day (if not today) gets the base
                          // colour; all others get a dimmed version.
                          let barColor: string;
                          if (entry.isToday) {
                            barColor = isCalories ? 'hsl(24, 95%, 53%)' : 'hsl(142, 76%, 36%)';
                          } else if (isMaxDay) {
                            barColor = isCalories ? 'hsl(24, 80%, 65%)' : 'hsl(142, 60%, 48%)';
                          } else {
                            barColor = isCalories ? 'hsl(24, 95%, 53%, 0.35)' : 'hsl(142, 76%, 36%, 0.35)';
                          }
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
                      <Icon className={`h-5 w-5 ${isCalories ? 'text-orange-500' : 'text-green-700'}`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Best Day This Month</p>
                      <p className="font-semibold">
                        {(() => {
                          const [, mm, dd] = maxDay.fullDate.split('-');
                          const fullMonths = ['January','February','March','April','May','June','July','August','September','October','November','December'];
                          return `${fullMonths[parseInt(mm,10)-1]} ${parseInt(dd,10)}`;
                        })()} - {maxDay.value.toLocaleString()} {unit}
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
