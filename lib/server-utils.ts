import { headers } from "next/headers";

/**
 * Get the base URL dynamically based on the request headers or environment.
 * This should only be called on the server (Server Components, Server Actions, Route Handlers).
 */
export async function getBaseUrl() {
  // If we are on the server but somehow window is defined (shouldn't happen in Next server context)
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  try {
    const headersList = await headers();
    const host = headersList.get("host");
    if (host) {
      const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
      return `${protocol}://${host}`;
    }
  } catch (error) {
    console.warn("getBaseUrl: Could not get headers, falling back to NEXT_PUBLIC_DOMAIN_URL", error);
  }

  return process.env.NEXT_PUBLIC_DOMAIN_URL || "http://localhost:3000";
}
