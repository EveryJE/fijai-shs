"use client";

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from "recharts";
import {
    ChartContainer,
    ChartTooltipContent,
    type ChartConfig
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChartIcon } from "lucide-react";
import { formatAmount } from "@/lib/utils";

interface CategoryPieChartProps {
    data: { name: string; value: number; fill: string }[];
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
    const hasData = data.length > 0;

    const chartConfig: ChartConfig = {};
    data.forEach((item, index) => {
        chartConfig[item.name] = {
            label: item.name,
            color: item.fill,
        };
    });

    return (
        <Card className=" overflow-hidden flex flex-col">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 text-amber-600" />
                    <CardTitle className="text-sm font-bold">Category Distribution</CardTitle>
                </div>
                <CardDescription className="text-[10px] uppercase ">
                    Donations by Category
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center pt-4">
                {hasData ? (
                    <ChartContainer config={chartConfig} className="h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    nameKey="name"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={
                                        <ChartTooltipContent
                                            hideLabel
                                            formatter={(value) => formatAmount(Number(value))}
                                        />
                                    }
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    content={({ payload }) => (
                                        <div className="flex flex-wrap justify-center gap-4 mt-4">
                                            {payload?.map((entry: any, index: number) => (
                                                <div key={`item-${index}`} className="flex items-center gap-1.5">
                                                    <div
                                                        className="w-2 h-2 rounded-full"
                                                        style={{ backgroundColor: entry.color }}
                                                    />
                                                    <span className="text-[10px] font-medium text-muted-foreground uppercase ">
                                                        {entry.value}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                ) : (
                    <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                        No category data yet
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
