"use client";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell
} from "recharts";
import {
    ChartContainer,
    ChartTooltipContent,
    type ChartConfig
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreditCardIcon, AwardIcon } from "lucide-react";
import { formatAmount } from "@/lib/utils";

interface DigitalImpactChartProps {
    data: { name: string; amount: number }[];
}

const chartConfig: ChartConfig = {
    amount: {
        label: "Impact",
        color: "#DAA520",
    },
};

export function DigitalImpactChart({ data }: DigitalImpactChartProps) {
    if (!data.length) return null;

    return (
        <Card className=" overflow-hidden flex flex-col group">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                            <CreditCardIcon className="h-4 w-4 text-[#DAA520]" />
                            <CardTitle className="text-sm font-bold">Digital Card Impact</CardTitle>
                        </div>
                        <CardDescription className="text-[10px] uppercase ">
                            Donation Ranking by Cardholder
                        </CardDescription>
                    </div>
                    <AwardIcon className="h-5 w-5 text-[#DAA520] opacity-30 transition-transform group-hover:scale-110 duration-500" />
                </div>
            </CardHeader>
            <CardContent className="flex-1 pt-6">
                <ChartContainer config={chartConfig} className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="name"
                                tickLine={false}
                                axisLine={false}
                                fontSize={10}
                                tickFormatter={(val) => val.length > 10 ? `${val.slice(0, 10)}…` : val}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                fontSize={10}
                                tickFormatter={(v) =>
                                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                                }
                            />
                            <Tooltip
                                content={
                                    <ChartTooltipContent
                                        labelFormatter={(val) => val}
                                        formatter={(value) => formatAmount(Number(value))}
                                    />
                                }
                            />
                            <Bar
                                dataKey="amount"
                                radius={[6, 6, 0, 0]}
                                barSize={40}
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={index === 0 ? "#730303" : "#DAA520"}
                                        fillOpacity={1 - (index * 0.1)}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
