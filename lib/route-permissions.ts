// Centralized route permissions map
export const ROUTE_PERMISSIONS: Record<string, string[]> = {
    "/dashboard": ["admin", "rsvp", "cardholder"],
    "/dashboard/profile": ["admin", "rsvp", "cardholder"],
    "/dashboard/organization": ["admin"],
    "/dashboard/events": ["admin", "rsvp", "cardholder"],
    "/dashboard/invite": ["admin", "rsvp", "cardholder"],
    "/dashboard/participants": ["admin", "rsvp", "cardholder"],
    "/dashboard/donations": ["admin", "rsvp", "cardholder"],
    // Add more routes as needed
};
