// Centralized route permissions map
export const ROUTE_PERMISSIONS: Record<string, string[]> = {
    "/dashboard": ["admin", "rsvp"],
    "/dashboard/profile": ["admin", "rsvp", "cardholder"],
    "/dashboard/organization": ["admin"],
    "/dashboard/events": ["admin", "rsvp"],
    // Add more routes as needed
};
