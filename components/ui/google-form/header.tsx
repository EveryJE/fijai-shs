"use client";

import { GraduationCapIcon } from "lucide-react";

interface GoogleFormHeaderProps {
    title: string;
    description?: string;
    organizationName?: string;
}

/**
 * Reusable Google Form-style Header
 * Features a thick colored top border and minimalist layout.
 */
export function GoogleFormHeader({ title, description, organizationName = "Fijai SHS Alumni" }: GoogleFormHeaderProps) {
    return (
        <div className="bg-white rounded-xl border border-[#dadce0] overflow-hidden shadow-sm">
            <div className="h-2.5 bg-[#730303] w-full" />
            <div className="p-6 md:p-8 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#730303] rounded-lg flex items-center justify-center text-white shrink-0">
                        <GraduationCapIcon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[3px] text-muted-foreground/60">{organizationName}</span>
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl md:text-4xl font-bold text-[#202124] ">{title}</h1>
                    {description && (
                        <p className="text-sm text-[#202124] leading-relaxed font-medium">
                            {description}
                        </p>
                    )}
                </div>

                <div className="pt-4 border-t border-muted-foreground/10 flex items-center justify-between">
                    <div className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
                        * Required
                    </div>
                </div>
            </div>
        </div>
    );
}
