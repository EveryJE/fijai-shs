"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatAmount } from "@/lib/utils";
import { TrendingUpIcon, CalendarIcon } from "lucide-react";

interface RevenueChartProps {
    data: { month: string; revenue: number }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
    if (!data.length) return null;

    const maxRevenue = Math.max(...data.map(d => d.revenue), 1000);
    const chartHeight = 200;

    return (
        <Card className="border-none shadow-xl bg-white overflow-hidden group">
            <CardHeader className="border-b bg-muted/10 pb-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <TrendingUpIcon className="h-4 w-4 text-emerald-600" />
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-[#730303]">
                                Financial Performance
                            </CardTitle>
                        </div>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-wider">
                            Alumni Revenue Growth (Last 6 Months)
                        </CardDescription>
                    </div>
                    <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full flex items-center gap-1.5 border border-emerald-200">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                         <span className="text-[10px] font-black tracking-widest uppercase">Live Trends</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-10">
                <div className="h-[200px] w-full flex items-end justify-between gap-4 px-2">
                    {data.map((item, i) => {
                        const barHeight = (item.revenue / maxRevenue) * chartHeight;
                        return (
                            <div key={item.month} className="flex-1 flex flex-col items-center gap-3 group/bar">
                                <div className="relative w-full flex flex-col items-center">
                                    {/* Tooltip on hover */}
                                    <div className="absolute -top-10 opacity-0 group-hover/bar:opacity-100 transition-all scale-90 group-hover/bar:scale-100 bg-[#730303] text-white text-[10px] font-black px-2 py-1 rounded shadow-xl pointer-events-none z-10 whitespace-nowrap">
                                        {formatAmount(item.revenue)}
                                    </div>
                                    <div 
                                        className="w-full max-w-[40px] bg-gradient-to-t from-[#730303] via-[#730303]/80 to-[#DAA520] rounded-t-lg transition-all duration-700 ease-out group-hover/bar:shadow-[0_-8px_20px_rgba(218,165,32,0.3)] group-hover/bar:opacity-90"
                                        style={{ height: `${barHeight}px` }}
                                    />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover/bar:text-primary transition-colors">
                                    {item.month}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
