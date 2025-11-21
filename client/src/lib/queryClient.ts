import { QueryClient, QueryFunction } from "@tanstack/react-query";

export class ApiError extends Error {
  field?: string;
  status: number;

  constructor(message: string, status: number, field?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.field = field;
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const errorData = await res.json();
      throw new ApiError(
        errorData.message || res.statusText,
        res.status,
        errorData.field
      );
    } else {
      const text = (await res.text()) || res.statusText;
      throw new ApiError(text, res.status);
    }
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
    const url = queryKey.join("/") as string;
    const res = await fetch(url, {
      credentials: "include",
    });

    // Handle 401 gracefully - it's expected for unauthenticated users
    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      // Don't throw error, just return null silently
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false, // Never auto-refetch by default
      refetchOnWindowFocus: false, // Never refetch on window focus
      refetchOnMount: false, // Never refetch on mount
      refetchOnReconnect: false, // Never refetch on reconnect
      staleTime: Infinity, // Data never becomes stale
      gcTime: Infinity, // Keep in cache forever
      retry: false,
      // Prevent any automatic behavior that could cause refreshes
      notifyOnChangeProps: ['data', 'error'], // Only notify on data/error changes, not on status changes
      // Prevent refetching on network changes
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: false,
    },
  },
});
