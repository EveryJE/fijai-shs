"use client";

import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";
import {
    ChartContainer,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUpIcon } from "lucide-react";

interface RevenueChartProps {
    data: { month: string; revenue: number }[];
}

const chartConfig: ChartConfig = {
    revenue: {
        label: "Revenue",
        color: "#730303",
    },
};

export function RevenueChart({ data }: RevenueChartProps) {
    const hasData = data.some((d) => d.revenue > 0);

    return (
        <Card className=" overflow-hidden">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                            <TrendingUpIcon className="h-4 w-4 text-emerald-600" />
                            <CardTitle className="text-sm font-bold">Revenue Trend</CardTitle>
                        </div>
                        <CardDescription className="text-[10px] uppercase tracking-wider">
                            Last 6 Months
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Live</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-4">
                {hasData ? (
                    <ChartContainer config={chartConfig} className="h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                                <defs>
                                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#730303" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#730303" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="month"
                                    tickLine={false}
                                    axisLine={false}
                                    fontSize={11}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    fontSize={11}
                                    tickFormatter={(v) =>
                                        v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                                    }
                                />
                                <Tooltip
                                    content={
                                        <ChartTooltipContent
                                            formatter={(value) =>
                                                Number(value).toLocaleString(undefined, {
                                                    style: "currency",
                                                    currency: "GHS",
                                                    minimumFractionDigits: 0,
                                                })
                                            }
                                        />
                                    }
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#730303"
                                    strokeWidth={2}
                                    fill="url(#revenueGrad)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                ) : (
                    <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                        No revenue data yet
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
