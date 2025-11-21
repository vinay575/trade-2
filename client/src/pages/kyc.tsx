import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Upload, CheckCircle2, AlertCircle, Clock } from "lucide-react";

export default function KYC() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [kycStatus, setKycStatus] = useState<"pending" | "submitted" | "approved" | "rejected">("pending");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading]); // Removed toast from dependencies

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-primary text-xl font-condensed">Loading...</div>
      </div>
    );
  }

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-4xl font-condensed font-bold mb-2" data-testid="text-kyc-title">KYC Verification</h1>
        <p className="text-muted-foreground">Complete your verification to unlock full trading features</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        <GlassCard className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-condensed font-semibold">Verification Progress</h3>
              <Badge variant={
                kycStatus === "approved" ? "default" :
                kycStatus === "rejected" ? "destructive" :
                kycStatus === "submitted" ? "secondary" : "outline"
              } data-testid="badge-kyc-status">
                {kycStatus === "approved" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                {kycStatus === "rejected" && <AlertCircle className="w-3 h-3 mr-1" />}
                {kycStatus === "submitted" && <Clock className="w-3 h-3 mr-1" />}
                {kycStatus.toUpperCase()}
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {step} of {totalSteps}</span>
              <span>{progress.toFixed(0)}% Complete</span>
            </div>
          </div>
        </GlassCard>

        {kycStatus === "pending" && (
          <GlassCard className="p-6" neonBorder>
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-condensed font-semibold mb-2">Personal Information</h3>
                  <p className="text-sm text-muted-foreground">Provide your basic details</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <Input placeholder="John" data-testid="input-first-name" />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input placeholder="Doe" data-testid="input-last-name" />
                  </div>
                  <div>
                    <Label>Date of Birth</Label>
                    <Input type="date" data-testid="input-dob" />
                  </div>
                  <div>
                    <Label>Nationality</Label>
                    <Select>
                      <SelectTrigger data-testid="select-nationality">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="us">United States</SelectItem>
                        <SelectItem value="uk">United Kingdom</SelectItem>
                        <SelectItem value="in">India</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={() => setStep(2)} className="w-full" data-testid="button-next-step">
                  Next Step
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-condensed font-semibold mb-2">Address Information</h3>
                  <p className="text-sm text-muted-foreground">Enter your residential address</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Street Address</Label>
                    <Input placeholder="123 Main St" data-testid="input-address" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>City</Label>
                      <Input placeholder="New York" data-testid="input-city" />
                    </div>
                    <div>
                      <Label>Postal Code</Label>
                      <Input placeholder="10001" data-testid="input-postal" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1" data-testid="button-previous">
                    Previous
                  </Button>
                  <Button onClick={() => setStep(3)} className="flex-1" data-testid="button-next-step">
                    Next Step
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-condensed font-semibold mb-2">Document Upload</h3>
                  <p className="text-sm text-muted-foreground">Upload a valid government ID</p>
                </div>
                <div>
                  <Label>Document Type</Label>
                  <Select>
                    <SelectTrigger data-testid="select-document-type">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="driver_license">Driver's License</SelectItem>
                      <SelectItem value="national_id">National ID</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="border-2 border-dashed border-border rounded-md p-12 text-center hover-elevate active-elevate-2 cursor-pointer" data-testid="upload-area">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm font-medium mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG or PDF (max 5MB)</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1" data-testid="button-previous">
                    Previous
                  </Button>
                  <Button onClick={() => setStep(4)} className="flex-1" data-testid="button-next-step">
                    Next Step
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-condensed font-semibold mb-2">Review & Submit</h3>
                  <p className="text-sm text-muted-foreground">Verify your information before submitting</p>
                </div>
                <div className="space-y-4 p-4 bg-accent/50 rounded-md">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Name</p>
                      <p className="font-medium">John Doe</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Date of Birth</p>
                      <p className="font-medium">1990-01-01</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Address</p>
                      <p className="font-medium">123 Main St, New York 10001</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Document</p>
                      <p className="font-medium">Passport</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(3)} className="flex-1" data-testid="button-previous">
                    Previous
                  </Button>
                  <Button
                    onClick={() => {
                      setKycStatus("submitted");
                      toast({
                        title: "KYC Submitted",
                        description: "Your verification is under review. We'll notify you once approved.",
                      });
                    }}
                    className="flex-1"
                    data-testid="button-submit-kyc"
                  >
                    Submit for Review
                  </Button>
                </div>
              </div>
            )}
          </GlassCard>
        )}

        {kycStatus === "submitted" && (
          <GlassCard className="p-12 text-center" glow>
            <Clock className="w-16 h-16 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-condensed font-bold mb-2">Under Review</h3>
            <p className="text-muted-foreground mb-6">
              Your KYC documents are being reviewed. This usually takes 24-48 hours.
            </p>
            <Button variant="outline" data-testid="button-back-dashboard">
              Back to Dashboard
            </Button>
          </GlassCard>
        )}

        {kycStatus === "approved" && (
          <GlassCard className="p-12 text-center" glow>
            <CheckCircle2 className="w-16 h-16 text-teal mx-auto mb-4" />
            <h3 className="text-2xl font-condensed font-bold mb-2">Verification Complete</h3>
            <p className="text-muted-foreground mb-6">
              Your account has been verified. You now have full access to all trading features.
            </p>
            <Button data-testid="button-start-trading">
              Start Trading
            </Button>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
