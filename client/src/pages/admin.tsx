import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Redirect to admin dashboard
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        const timeoutId = setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return () => clearTimeout(timeoutId);
      }

      // Redirect authenticated users to admin dashboard
      if (user?.role === "admin") {
        setLocation("/admin/dashboard");
      } else {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
        setLocation("/dashboard");
      }
    }
  }, [isAuthenticated, isLoading, user, setLocation]); // Removed toast from dependencies

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse text-primary text-xl font-condensed">Redirecting...</div>
    </div>
  );
}
