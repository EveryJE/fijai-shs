import React from 'react';
import { GoogleFormCard } from '@/components/ui/google-form/base';
import { UserIcon, PhoneIcon, MailIcon, BriefcaseIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getPublicUrlSync } from "@/lib/storage-utils";

export interface RSVP {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  position?: string | null;
  avatarUrl?: string | null;
  classYear?: string | null;
}

interface RSVPListProps {
  rsvps: RSVP[];
  organizationName?: string;
  id?: string;
}

export const RSVPList: React.FC<RSVPListProps> = ({ rsvps, organizationName, id }) => {
  return (
    <div id={id} className="space-y-6 @container  sticky top-4">
      <GoogleFormCard
      className='rounded-lg'
        title={"RSVP List"}
        description="Connect with registered alumni and project leads for this campaign."
      >
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20">
          {rsvps.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No registered representatives yet.
            </p>
          ) : (
            <div className='grid grid-cols-1 gap-4 @md:grid-cols-2'>              
            {rsvps.map((rsvp) => {
              const avatarSrc = rsvp.avatarUrl?.startsWith("http")
                ? rsvp.avatarUrl
                : getPublicUrlSync("avatars", rsvp.avatarUrl);

              return (
                <div key={rsvp.id} className="flex gap-4 p-3 rounded-xl border border-gray-100 bg-[#E5DFD3]/50 hover:bg-[#E5DFD3]/80 transition-colors group">
                  <Avatar className="h-12 w-12 border-2 border-primary/10">
                    <AvatarImage src={avatarSrc || ""} />
                    <AvatarFallback className="bg-primary/5 text-primary">
                      <UserIcon className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 truncate flex items-center gap-1.5">
                      {rsvp.name}
                      {rsvp.classYear && (
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase ">
                          {rsvp.classYear}
                        </span>
                      )}
                    </h4>

                    {rsvp.position && (
                      <p className="text-[11px] text-[#730303] uppercase font-black tracking-widest mt-0.5 flex items-center gap-1">
                        <BriefcaseIcon className="h-2.5 w-2.5 shrink-0" />
                        {rsvp.position}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap gap-3">
                      {rsvp.phone && (
                        <a href={`tel:${rsvp.phone}`} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors">
                          <PhoneIcon className="h-3 w-3" />
                          {rsvp.phone}
                        </a>
                      )}
                      {rsvp.email && (
                        <a href={`mailto:${rsvp.email}`} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors">
                          <MailIcon className="h-3 w-3" />
                          <span className="truncate max-w-[120px]">{rsvp.email}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      </GoogleFormCard>
    </div>
  );
};
