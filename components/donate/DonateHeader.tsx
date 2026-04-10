"use client";

import { GraduationCapIcon, UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DonateHeaderProps {
    eventTitle: string;
    eventDescription?: string;
    eventImage?: string;
    digitalCodeUserName?: string;
    organizationName?: string;
}

/**
 * High-fidelity Google Form-style Header for public donation pages.
 */
export function DonateHeader({ eventTitle, eventDescription, eventImage, digitalCodeUserName, organizationName }: DonateHeaderProps) {
    const scrollToRSVPs = () => {
        const element = document.getElementById('rsvp-section');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="bg-white border border-gray-200 overflow-hidden mb-6">
            <div className="h-0.55 bg-[#730303] w-full" />
            <div className="p-6 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                    <div className="space-y-4 flex-1">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#730303] rounded-lg flex items-center justify-center text-white shrink-0">
                                <GraduationCapIcon className="w-5 h-5" />
                            </div>
                            <span className="text-xl text-primary font-bold">{eventTitle}</span>
                        </div>

                        <div className="space-y-2">
                             {organizationName && (
                                <p className="text-[10px] text-[#730303] font-black uppercase tracking-[0.2em] mb-1">
                                    Organized by {organizationName}
                                </p>
                            )}
                            {eventDescription && (
                                <div 
                                    className="text-sm text-[#202124] leading-relaxed font-medium prose prose-sm max-w-none text-gray-700"
                                    dangerouslySetInnerHTML={{ __html: eventDescription }}
                                />
                            )}
                        </div>
                    </div>

                    <div className="flex-shrink-0 md:hidden">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full text-[10px] uppercase font-bold tracking-widest border-primary/20 hover:bg-primary/5"
                            onClick={scrollToRSVPs}
                        >
                            <UsersIcon className="h-3 w-3 mr-2" />
                            Contact Organizers
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
