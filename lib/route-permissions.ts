// Centralized route permissions map
export const ROUTE_PERMISSIONS: Record<string, string[]> = {
    "/dashboard": ["admin", "rsvp", "cardholder"],
    "/dashboard/profile": ["admin", "rsvp", "cardholder"],
    "/dashboard/organization": ["admin"],
    "/dashboard/events": ["admin", "rsvp", "cardholder"],
    "/dashboard/invite": ["admin"],
    "/dashboard/participants": ["admin", "rsvp"],
    "/dashboard/donations": ["admin", "rsvp"],
    // Add more routes as needed
};
