import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Clone the response so we can read the body without consuming it
    const clonedRes = res.clone();
    const contentType = res.headers.get("content-type");
    let errorText: string;
    
    if (contentType && contentType.includes("application/json")) {
      try {
        const json = await clonedRes.json();
        errorText = json.message || JSON.stringify(json) || res.statusText;
      } catch {
        // If JSON parsing fails, read as text
        const textRes = res.clone();
        errorText = (await textRes.text()) || res.statusText;
      }
    } else {
      errorText = (await clonedRes.text()) || res.statusText;
      // If it's HTML, provide a better error message
      if (errorText.trim().startsWith("<!DOCTYPE") || errorText.trim().startsWith("<html")) {
        errorText = `Server returned HTML error page (status ${res.status}). Please check server logs.`;
      }
    }
    
    throw new Error(`${res.status}: ${errorText}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
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
    return await res.json();
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
