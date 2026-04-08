"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatAmount } from "@/lib/utils";
import { CreditCardIcon, AwardIcon } from "lucide-react";

interface DigitalImpactChartProps {
    data: { name: string; amount: number }[];
}

export function DigitalImpactChart({ data }: DigitalImpactChartProps) {
    if (!data.length) return null;

    const maxAmount = Math.max(...data.map(d => d.amount), 500);
    const chartHeight = 200;

    return (
        <Card className="border-none shadow-xl bg-white overflow-hidden group">
            <CardHeader className="border-b bg-muted/10 pb-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <CreditCardIcon className="h-4 w-4 text-[#DAA520]" />
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-[#730303]">
                                Digital Card Impact
                            </CardTitle>
                        </div>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-wider">
                            Donation Ranking by Card ID / Holder
                        </CardDescription>
                    </div>
                    <AwardIcon className="h-5 w-5 text-[#DAA520] opacity-50 transition-transform group-hover:scale-125 duration-500" />
                </div>
            </CardHeader>
            <CardContent className="pt-10">
                <div className="h-[200px] w-full flex items-end justify-between gap-4 px-2">
                    {data.map((item, i) => {
                        const barHeight = (item.amount / maxAmount) * chartHeight;
                        return (
                            <div key={item.name} className="flex-1 flex flex-col items-center gap-3 group/bar">
                                <div className="relative w-full flex flex-col items-center">
                                    {/* Tooltip on hover */}
                                    <div className="absolute -top-10 opacity-0 group-hover/bar:opacity-100 transition-all scale-90 group-hover/bar:scale-100 bg-[#DAA520] text-white text-[10px] font-black px-2 py-1 rounded shadow-xl pointer-events-none z-10 whitespace-nowrap">
                                        {formatAmount(item.amount)}
                                    </div>
                                    <div 
                                        className="w-full max-w-[40px] bg-gradient-to-t from-[#DAA520] via-[#DAA520]/80 to-[#730303] rounded-t-lg transition-all duration-700 ease-out group-hover/bar:shadow-[0_-8px_20px_rgba(115,3,3,0.15)] group-hover/bar:opacity-90"
                                        style={{ height: `${barHeight}px` }}
                                    />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[1px] text-muted-foreground group-hover/bar:text-primary transition-colors truncate max-w-[60px] text-center">
                                    {item.name}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
