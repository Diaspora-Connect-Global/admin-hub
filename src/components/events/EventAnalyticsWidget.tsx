import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Event } from "@/types/events";
import { useT } from "@/hooks/useT";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

function truncateLabel(s: string, max = 36): string {
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

export interface EventAnalyticsWidgetProps {
  events: Event[];
  loading?: boolean;
  error?: Error | null;
}

export function EventAnalyticsWidget({ events, loading, error }: EventAnalyticsWidgetProps) {
  const t = useT("events");

  const { topByRegistrations, statusSlices, eventsPerMonth, freePaidCounts } = useMemo(() => {
    const topByRegistrations = [...events]
      .sort((a, b) => b.registrationCount - a.registrationCount)
      .slice(0, 8)
      .map((e) => ({
        name: truncateLabel(e.title),
        fullTitle: e.title,
        registrations: e.registrationCount,
      }));

    const statusMap = new Map<string, number>();
    events.forEach((e) => {
      const key = (e.status ?? "unknown").toUpperCase();
      statusMap.set(key, (statusMap.get(key) ?? 0) + 1);
    });
    const statusSlices = Array.from(statusMap.entries()).map(([name, value], i) => ({
      name,
      value,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));

    let paid = 0;
    let free = 0;
    events.forEach((e) => {
      if (e.isPaid) paid += 1;
      else free += 1;
    });

    const monthCounts = new Map<string, number>();
    events.forEach((e) => {
      try {
        const key = format(parseISO(e.startAt), "yyyy-MM");
        monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
      } catch {
        /* invalid date */
      }
    });
    const sortedKeys = Array.from(monthCounts.keys()).sort();
    const last12 = sortedKeys.slice(-12);
    const eventsPerMonth = last12.map((k) => ({
      month: format(parseISO(`${k}-15`), "MMM yyyy"),
      count: monthCounts.get(k) ?? 0,
    }));

    return { topByRegistrations, statusSlices, eventsPerMonth, freePaidCounts: { paid, free } };
  }, [events]);

  const freePaidSlices = [
    { name: t.paid, value: freePaidCounts.paid, fill: "hsl(var(--chart-1))" },
    { name: t.free, value: freePaidCounts.free, fill: "hsl(var(--chart-3))" },
  ].filter((s) => s.value > 0);

  if (loading) {
    return (
      <div className="rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
        {t.analyticsLoading}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 py-12 text-center text-destructive">
        {t.analyticsError}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-16 text-center">
        <p className="text-foreground font-medium">{t.analyticsEmpty}</p>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">{t.analyticsEmptyHint}</p>
      </div>
    );
  }

  const hasRegistrationsChart = topByRegistrations.some((r) => r.registrations > 0);
  const showFreePaid = freePaidSlices.length > 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t.analyticsScopeNote}</p>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">{t.analyticsTopRegistrations}</CardTitle>
            <CardDescription>{t.analyticsTopRegistrationsDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {hasRegistrationsChart ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topByRegistrations} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                        maxWidth: 280,
                      }}
                      formatter={(value: number) => [value, t.registered]}
                      labelFormatter={(_, payload) =>
                        payload?.[0]?.payload?.fullTitle ?? payload?.[0]?.payload?.name
                      }
                    />
                    <Bar dataKey="registrations" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  {t.analyticsNoRegistrations}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">{t.analyticsByStatus}</CardTitle>
            <CardDescription>{t.analyticsByStatusDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] flex items-center justify-center">
              {statusSlices.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusSlices}
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={96}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {statusSlices.map((entry, index) => (
                        <Cell key={`status-${entry.name}`} fill={entry.fill ?? CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend verticalAlign="bottom" height={32} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">{t.analyticsFreeVsPaid}</CardTitle>
            <CardDescription>{t.analyticsFreeVsPaidDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] flex items-center justify-center">
              {showFreePaid ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={freePaidSlices}
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={96}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {freePaidSlices.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend verticalAlign="bottom" height={32} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">{t.analyticsEventsPerMonth}</CardTitle>
            <CardDescription>{t.analyticsEventsPerMonthDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {eventsPerMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={eventsPerMonth}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={0} angle={-35} textAnchor="end" height={56} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [value, t.events]}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">—</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
