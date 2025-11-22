import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "./use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export function useWallet() {
  const { toast } = useToast();

  const { data: ledger, isLoading: isLoadingLedger } = useQuery({
    queryKey: ["/api/wallet/ledger"],
    refetchInterval: false, // Never auto-refetch
    refetchOnMount: false, // Don't refetch on mount
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
    staleTime: Infinity, // Data never becomes stale
  });

  const depositMutation = useMutation({
    mutationFn: async (data: { amount: string; method: string }) => {
      return await apiRequest("POST", "/api/wallet/topup", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/ledger"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/summary"] });
      toast({
        title: "Deposit successful",
        description: "Funds have been added to your wallet",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Deposit failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (data: { amount: string; method: string }) => {
      return await apiRequest("POST", "/api/wallet/withdraw", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/ledger"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/summary"] });
      toast({
        title: "Withdrawal initiated",
        description: "Your withdrawal is being processed",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Withdrawal failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    ledger: (ledger as any) || [],
    isLoadingLedger,
    deposit: depositMutation.mutate,
    withdraw: withdrawMutation.mutate,
    isDepositing: depositMutation.isPending,
    isWithdrawing: withdrawMutation.isPending,
  };
}
