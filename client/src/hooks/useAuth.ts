import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import { useMemo } from "react";

export function useAuth() {
  const { data: user, isLoading, isFetching, status } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    refetchInterval: false, // Never auto-refetch
    refetchOnMount: false, // Don't refetch on mount - use cache
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
    staleTime: Infinity, // Data never becomes stale
    gcTime: Infinity, // Keep in cache forever
    // Suppress errors for 401 - it's expected for unauthenticated users
    throwOnError: false,
    // Use cached data if available to prevent unnecessary requests
    placeholderData: (previousData) => previousData,
    // Prevent refetching on network changes
    networkMode: 'offlineFirst',
    // Prevent structural sharing from causing re-renders
    structuralSharing: (oldData, newData) => {
      // If data hasn't actually changed, return old data
      if (oldData === newData) return oldData;
      // If both are null/undefined, return old
      if (!oldData && !newData) return oldData;
      return newData;
    },
  });

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({
    user: user ?? null,
    isLoading: isLoading || isFetching,
    isAuthenticated: !!user,
    // Auth is resolved when query has finished (success or error)
    // This prevents hanging on network/server errors while still distinguishing from pending state
    isResolved: status === 'success' || status === 'error',
  }), [user, isLoading, isFetching, status]);
}
