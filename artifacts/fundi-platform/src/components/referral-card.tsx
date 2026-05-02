import { useState } from "react";
import { Gift, Copy, CheckCircle, Share2, Users, DollarSign, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ReferralCardProps {
  contractorId?: number;
  contractorName?: string;
  homeownerId?: number;
  variant?: "contractor" | "homeowner";
}

const MOCK_PRO_REFERRALS = [
  { name: "James Mwangi", joined: "Apr 28", reward: 500, status: "paid" },
  { name: "Beatrice Achieng", joined: "Apr 12", reward: 500, status: "paid" },
  { name: "Samuel Otieno", joined: "—", reward: 0, status: "pending" },
];

const MOCK_HO_REFERRALS = [
  { name: "Grace Njeri", posted: "Apr 30", reward: 200, status: "credited" },
  { name: "Tom Kariuki", posted: "—", reward: 0, status: "pending" },
];

export function ReferralCard({
  contractorId,
  contractorName,
  homeownerId,
  variant = "contractor",
}: ReferralCardProps) {
  const [copied, setCopied] = useState(false);
  const [sharedWA, setSharedWA] = useState(false);

  const refCode = variant === "contractor"
    ? `FV-PRO-${(contractorId ?? 1).toString().padStart(4, "0")}`
    : `FV-HO-${(homeownerId ?? 1).toString().padStart(4, "0")}`;

  const domain = window.location.host;
  const refLink = `https://${domain}/jobs/new?ref=${refCode}`;

  const referrals = variant === "contractor" ? MOCK_PRO_REFERRALS : MOCK_HO_REFERRALS;
  const earnedKey = variant === "contractor" ? "paid" : "credited";
  const earned = referrals.filter((r) => r.status === earnedKey).reduce((s, r) => s + r.reward, 0);
  const pending = referrals.filter((r) => r.status === "pending").length;

  const rewardDesc = variant === "contractor"
    ? "Earn KES 500 for every new pro who joins FundiVerify using your link."
    : "Earn KES 200 credit for every friend who posts their first job.";

  const waMsg = variant === "contractor"
    ? `Hey! Join FundiVerify and get more leads for your trade business in Nairobi. Sign up with my referral link: ${refLink}`
    : `Hey! Need a reliable fundi in Nairobi? Use FundiVerify to get verified quotes fast. Sign up with my link and we both get rewards: ${refLink}`;

  function copyLink() {
    navigator.clipboard.writeText(refLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function shareWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(waMsg)}`, "_blank");
    setSharedWA(true);
    setTimeout(() => setSharedWA(false), 3000);
  }

  return (
    <Card className="mt-6 border-violet-200/70 bg-gradient-to-br from-violet-50/50 to-indigo-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
              <Gift className="h-4.5 w-4.5 text-violet-600 h-[18px] w-[18px]" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold leading-snug">Refer &amp; Earn</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{rewardDesc}</p>
            </div>
          </div>
          {earned > 0 && (
            <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-xs font-semibold flex-shrink-0">
              KES {earned.toLocaleString()} earned
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-white/70 border border-violet-100 py-2.5 px-1">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Users className="h-3.5 w-3.5 text-violet-500" />
            </div>
            <p className="text-lg font-bold">{referrals.length}</p>
            <p className="text-[10px] text-muted-foreground">Referred</p>
          </div>
          <div className="rounded-lg bg-white/70 border border-violet-100 py-2.5 px-1">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
            </div>
            <p className="text-lg font-bold">{referrals.filter((r) => r.status !== "pending").length}</p>
            <p className="text-[10px] text-muted-foreground">Joined</p>
          </div>
          <div className="rounded-lg bg-white/70 border border-violet-100 py-2.5 px-1">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <DollarSign className="h-3.5 w-3.5 text-violet-500" />
            </div>
            <p className="text-lg font-bold text-violet-700">
              {earned > 0 ? `${(earned / 1000).toFixed(1)}k` : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">KES earned</p>
          </div>
        </div>

        {/* Link box */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Your referral link</p>
          <div className="flex items-center gap-2 bg-background border rounded-lg px-3 py-2.5">
            <p className="text-xs text-muted-foreground flex-1 truncate font-mono">{refLink}</p>
            <button
              onClick={copyLink}
              className={`flex-shrink-0 flex items-center gap-1 text-xs font-medium transition-colors ${
                copied ? "text-green-600" : "text-primary hover:text-primary/80"
              }`}
            >
              {copied
                ? <><CheckCircle className="h-3.5 w-3.5" />Copied!</>
                : <><Copy className="h-3.5 w-3.5" />Copy</>}
            </button>
          </div>
        </div>

        {/* Share */}
        <Button
          size="sm"
          variant="outline"
          onClick={shareWhatsApp}
          className="w-full gap-2 border-green-200 text-green-700 hover:bg-green-50"
        >
          <Share2 className="h-3.5 w-3.5" />
          {sharedWA ? "Link shared!" : "Share on WhatsApp"}
        </Button>

        {/* Referral list */}
        {referrals.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Referral history</p>
            {referrals.map((ref, i) => (
              <div key={i} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-white/60 border border-violet-100/60">
                <div className="flex items-center gap-2">
                  {ref.status === "pending"
                    ? <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
                    : <CheckCircle className="h-3.5 w-3.5 text-green-500" />}
                  <span className="font-medium">{ref.name}</span>
                </div>
                {ref.status === "pending" ? (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">Pending</Badge>
                ) : (
                  <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200">
                    KES {ref.reward.toLocaleString()} {earnedKey}
                  </Badge>
                )}
              </div>
            ))}
            {pending > 0 && (
              <p className="text-[10px] text-muted-foreground text-center pt-1">
                {pending} referral{pending > 1 ? "s" : ""} pending — they'll appear here once they sign up.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
