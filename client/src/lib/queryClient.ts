import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { parseApiError } from "./errorHandler";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Clone the response so we can read the body without consuming it
    const clonedRes = res.clone();
    const contentType = res.headers.get("content-type");
    let errorData: any;
    
    if (contentType && contentType.includes("application/json")) {
      try {
        errorData = await clonedRes.json();
      } catch {
        // If JSON parsing fails, read as text
        const textRes = res.clone();
        const errorText = (await textRes.text()) || res.statusText;
        errorData = { message: errorText };
      }
    } else {
      const errorText = (await clonedRes.text()) || res.statusText;
      // If it's HTML, provide a better error message
      if (errorText.trim().startsWith("<!DOCTYPE") || errorText.trim().startsWith("<html")) {
        errorData = { 
          message: `Server returned HTML error page (status ${res.status}). Please check server logs.` 
        };
      } else {
        errorData = { message: errorText };
      }
    }
    
    // Create error with structured data
    const error = new Error(`${res.status}: ${JSON.stringify(errorData)}`);
    (error as any).response = res;
    (error as any).data = errorData;
    throw error;
  }
}

/**
 * Get CSRF token from cookie
 */
function getCsrfTokenFromCookie(): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'X-CSRF-Token') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Check if this is an admin endpoint that requires CSRF protection
  const isAdminEndpoint = url.includes('/api/admin') || url.match(/\/api\/[^/]+\/admin/);
  
  // For state-changing methods on admin endpoints, include CSRF token
  const stateChangingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  const needsCsrfToken = isAdminEndpoint && stateChangingMethods.includes(method.toUpperCase());
  
  const headers: Record<string, string> = {};
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  // Add CSRF token header if needed
  if (needsCsrfToken) {
    const csrfToken = getCsrfTokenFromCookie();
    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
    }
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    
    // Check if response has content before parsing JSON
    const contentType = res.headers.get("content-type");
    const contentLength = res.headers.get("content-length");
    
    // If content-length is 0, return null
    if (contentLength === "0") {
      return null as T;
    }
    
    // Read response as text first to check if it's empty
    const text = await res.text();
    
    // If response is empty, return null
    if (!text || text.trim() === '') {
      return null as T;
    }
    
    // Try to parse JSON
    try {
      return JSON.parse(text) as T;
    } catch (error) {
      // If JSON parsing fails, log and throw with helpful message
      console.error("Failed to parse JSON response:", error, { 
        url: queryKey.join("/"),
        status: res.status,
        statusText: res.statusText,
        contentType,
        contentLength,
        responsePreview: text.substring(0, 200)
      });
      throw new Error(`Failed to parse JSON response: ${error instanceof Error ? error.message : String(error)}. Response was: ${text.substring(0, 100)}`);
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
