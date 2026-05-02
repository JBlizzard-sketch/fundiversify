import { useState } from "react";
import { Gift, Copy, CheckCircle, Share2, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ReferralCardProps {
  contractorId: number;
  contractorName?: string;
}

export function ReferralCard({ contractorId, contractorName }: ReferralCardProps) {
  const [copied, setCopied] = useState(false);
  const [sharedWA, setSharedWA] = useState(false);

  const refCode = `FV-PRO-${contractorId.toString().padStart(4, "0")}`;
  const domain = window.location.host;
  const refLink = `https://${domain}/jobs/new?ref=${refCode}`;

  function copyLink() {
    navigator.clipboard.writeText(refLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function shareWhatsApp() {
    const msg = `Looking for a reliable ${contractorName ? contractorName + "'s" : ""} trusted service? Post your job on FundiVerify and get competing quotes from verified pros in Nairobi. Use my link: ${refLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    setSharedWA(true);
    setTimeout(() => setSharedWA(false), 3000);
  }

  return (
    <Card className="border-dashed border-2 border-primary/30 bg-primary/3">
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Gift className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">Refer a Homeowner</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Share your link — every homeowner who posts a job through it boosts your visibility in search.
            </p>
          </div>
        </div>

        {/* Link box */}
        <div className="flex items-center gap-2 bg-background border rounded-lg px-3 py-2 mb-3">
          <p className="text-xs text-muted-foreground flex-1 truncate font-mono">{refLink}</p>
          <button
            onClick={copyLink}
            className={`flex-shrink-0 flex items-center gap-1 text-xs font-medium transition-colors ${copied ? "text-green-600" : "text-primary hover:text-primary/80"}`}
          >
            {copied ? <><CheckCircle className="h-3.5 w-3.5" />Copied!</> : <><Copy className="h-3.5 w-3.5" />Copy</>}
          </button>
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={shareWhatsApp} className="gap-1.5 flex-1">
            <Share2 className="h-3.5 w-3.5 text-green-500" />
            {sharedWA ? "Shared!" : "Share on WhatsApp"}
          </Button>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2">
            <Users className="h-3.5 w-3.5" />
            <span>Ref code: <span className="font-mono font-semibold">{refCode}</span></span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
