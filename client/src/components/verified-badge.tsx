import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Shield } from "lucide-react";

interface VerifiedBadgeProps {
  isVerified: boolean;
  className?: string;
  testId?: string;
}

export function VerifiedBadge({ isVerified, className = "", testId }: VerifiedBadgeProps) {
  return isVerified ? (
    <Badge variant="secondary" className={`gap-1 ${className}`} data-testid={testId}>
      <ShieldCheck className="w-3 h-3" /> Verified
    </Badge>
  ) : (
    <Badge variant="outline" className={`gap-1 ${className}`} data-testid={testId}>
      <Shield className="w-3 h-3" /> Unverified
    </Badge>
  );
}

