"use client";

import { GraduationCapIcon } from "lucide-react";

interface DonateHeaderProps {
    eventTitle: string;
    eventDescription?: string;
    eventImage?: string;
    digitalCodeUserName?: string;
    organizationName?: string;
}

/**
 * High-fidelity Google Form-style Header for public donation pages.
 * Replaces the previous DonateHeader with a consistent institutional banner.
 */
export function DonateHeader({ eventTitle, eventDescription, eventImage, digitalCodeUserName, organizationName = "Fosa 26 Fund raising" }: DonateHeaderProps) {
    return (
        <div className="bg-white  border border-gray-200 overflow-hidden  mb-6">
            <div className="h-0.55 bg-[#730303] w-full" />
            <div className="p-6 md:p-8 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#730303] rounded-lg flex items-center justify-center text-white shrink-0">
                        <GraduationCapIcon className="w-5 h-5" />
                    </div>
                    <span className="text-xl text-primary">{eventTitle}</span>
                </div>

                <div className="space-y-2">
                    {eventDescription && (
                        <div 
                            className="text-sm text-[#202124] leading-relaxed font-medium prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: eventDescription }}
                        />
                    )}
                </div>

            </div>
        </div>
    );
}
