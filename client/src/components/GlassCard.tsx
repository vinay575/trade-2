import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  neonBorder?: boolean;
  onClick?: () => void;
}

export function GlassCard({ children, className, glow = false, neonBorder = false, onClick }: GlassCardProps) {
  return (
    <Card
      className={cn(
        "backdrop-blur-glass bg-card/40 border-card-border",
        glow && "shadow-neon-sm",
        neonBorder && "border-primary/20",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      data-testid="glass-card"
    >
      {children}
    </Card>
  );
}
