import { useParams, Link } from "wouter";
import { ShieldCheck, Star, MapPin, Phone, Bookmark, BookmarkCheck, ArrowLeft, Briefcase, Award, MessageCircle, Share2, Clock, ThumbsUp, Zap, Droplets, Paintbrush, Hammer, Cpu, Layers, HardHat, Wind, Flame, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import {
  useGetContractor,
  useGetContractorReviews,
  useSaveContractor,
  useUnsaveContractor,
  getGetContractorQueryKey,
  getGetContractorReviewsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AvailabilityWidget } from "@/components/availability-widget";
import { EstimateWidget } from "@/components/estimate-widget";

const HOMEOWNER_ID = 1;

const TRADE_ICONS: Record<string, React.ElementType> = {
  Plumbing: Droplets,
  Electrical: Zap,
  Painting: Paintbrush,
  Carpentry: Hammer,
  Tiling: Layers,
  Roofing: HardHat,
  Masonry: HardHat,
  Fundi: Wrench,
  HVAC: Wind,
  Welding: Flame,
  default: Briefcase,
};

function TrustBadge({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-muted/50 text-center min-w-[90px]">
      <div className="text-primary">{icon}</div>
      <p className="text-base font-bold">{value}</p>
      <p className="text-xs text-muted-foreground leading-tight">{label}</p>
    </div>
  );
}

function RatingBar({ rating, count, total }: { rating: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-4 text-right text-muted-foreground">{rating}</span>
      <Star className="h-3 w-3 fill-amber-400 text-amber-400 flex-shrink-0" />
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-5 text-muted-foreground">{count}</span>
    </div>
  );
}

export default function ContractorProfilePage() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0", 10);
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const { data: contractor, isLoading } = useGetContractor(id, {
    query: { enabled: !!id, queryKey: getGetContractorQueryKey(id) },
  });

  const { data: reviews } = useGetContractorReviews(id, {
    query: { enabled: !!id, queryKey: getGetContractorReviewsQueryKey(id) },
  });

  const saveContractor = useSaveContractor({
    mutation: {
      onSuccess: () => { setSaved(true); queryClient.invalidateQueries(); },
    },
  });

  const unsaveContractor = useUnsaveContractor({
    mutation: {
      onSuccess: () => { setSaved(false); queryClient.invalidateQueries(); },
    },
  });

  const handleShare = () => {
    const url = window.location.href;
    const text = `Check out ${contractor?.name ?? "this contractor"} on FundiVerify — ${contractor?.trade} in ${contractor?.location}. ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <Skeleton className="h-64 w-full rounded-xl mb-6" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (!contractor) {
    return (
      <div className="container mx-auto px-4 py-10 text-center">
        <p className="text-muted-foreground">Contractor not found.</p>
        <Button asChild variant="ghost" className="mt-4"><Link href="/contractors">Back to directory</Link></Button>
      </div>
    );
  }

  const TradeIcon = TRADE_ICONS[contractor.trade] ?? TRADE_ICONS.default;

  // Rating breakdown
  const ratingCounts = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    count: reviews?.filter((rev) => rev.rating === r).length ?? 0,
  }));

  // Simulated trust signals (demo values)
  const responseRate = 94;
  const avgResponseHours = 2;

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl pb-28 md:pb-10">
      <Button variant="ghost" asChild className="mb-6 -ml-2">
        <Link href="/contractors"><ArrowLeft className="h-4 w-4 mr-2" />Back to Directory</Link>
      </Button>

      {/* Profile Header */}
      <Card className="mb-6 overflow-hidden">
        {/* Header gradient banner */}
        <div className="h-20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
        <CardContent className="px-6 pb-6 -mt-10">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex items-end gap-4">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src={contractor.avatarUrl ?? ""} alt={contractor.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">
                  {contractor.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h1 className="text-2xl font-bold">{contractor.name}</h1>
                    {contractor.verificationStatus === "verified" && (
                      <div className="flex items-center gap-1 text-primary text-xs font-semibold bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                        <ShieldCheck className="h-3.5 w-3.5" />Verified Pro
                      </div>
                    )}
                    {contractor.subscriptionTier === "pro" && (
                      <Badge className="text-xs">Pro Member</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-primary font-medium mb-2">
                    <TradeIcon className="h-4 w-4" />
                    {contractor.trade}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{contractor.location}</span>
                    <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{contractor.jobsCompleted} jobs</span>
                    {contractor.yearsExperience > 0 && (
                      <span className="flex items-center gap-1"><Award className="h-3.5 w-3.5" />{contractor.yearsExperience} yrs exp</span>
                    )}
                    <span className="flex items-center gap-1 text-green-600"><Clock className="h-3.5 w-3.5" />Responds in ~{avgResponseHours}h</span>
                  </div>
                </div>

                <div className="flex flex-col md:items-end gap-3">
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className={`h-5 w-5 ${i <= Math.round(contractor.rating) ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
                    ))}
                    <span className="ml-2 font-bold text-lg">{contractor.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground text-sm ml-1">({contractor.reviewCount})</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (saved) {
                          unsaveContractor.mutate({ contractorId: id, params: { homeownerId: HOMEOWNER_ID } });
                        } else {
                          saveContractor.mutate({ data: { homeownerId: HOMEOWNER_ID, contractorId: id } });
                        }
                      }}
                    >
                      {saved ? <BookmarkCheck className="h-4 w-4 mr-2 text-primary" /> : <Bookmark className="h-4 w-4 mr-2" />}
                      {saved ? "Saved" : "Save"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShare}
                      title="Share via WhatsApp"
                    >
                      <MessageCircle className="h-4 w-4 mr-1.5 text-green-500" />
                      WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyLink}
                      title="Copy link"
                      className="hidden md:flex"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {shareCopied && <p className="text-xs text-primary">Link copied!</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex gap-3 mt-6 overflow-x-auto pb-1 scrollbar-none">
            <TrustBadge icon={<ThumbsUp className="h-5 w-5" />} label="Response Rate" value={`${responseRate}%`} />
            <TrustBadge icon={<Clock className="h-5 w-5" />} label="Avg Response" value={`${avgResponseHours}h`} />
            <TrustBadge icon={<Briefcase className="h-5 w-5" />} label="Jobs Done" value={`${contractor.jobsCompleted}`} />
            <TrustBadge icon={<Star className="h-5 w-5" />} label="Rating" value={`${contractor.rating.toFixed(1)}/5`} />
            {contractor.yearsExperience > 0 && (
              <TrustBadge icon={<Award className="h-5 w-5" />} label="Experience" value={`${contractor.yearsExperience} yrs`} />
            )}
          </div>

          {/* Availability */}
          <div className="mt-5 pt-4 border-t">
            <AvailabilityWidget readOnly compact />
          </div>

          {contractor.bio && (
            <>
              <Separator className="my-5" />
              <p className="text-muted-foreground leading-relaxed">{contractor.bio}</p>
            </>
          )}

          {/* Specializations */}
          {contractor.specializations && contractor.specializations.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Specializations</p>
              <div className="flex flex-wrap gap-2">
                {contractor.specializations.map((spec: string) => (
                  <span
                    key={spec}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/8 text-primary border border-primary/20"
                  >
                    <TradeIcon className="h-3 w-3" />
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}

          {contractor.phone && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{contractor.phone}</span>
              <a
                href={`https://wa.me/${contractor.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Chat on WhatsApp
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Portfolio */}
      {contractor.portfolioPhotos && contractor.portfolioPhotos.length > 0 && (
        <Card className="mb-6">
          <CardHeader><CardTitle>Portfolio</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {contractor.portfolioPhotos.map((url: string, i: number) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted group cursor-pointer">
                  <img src={url} alt={`Portfolio ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost estimate widget */}
      <div className="mb-6">
        <EstimateWidget trade={contractor.trade} location={contractor.location} />
      </div>

      {/* Reviews with rating breakdown */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Verified Reviews ({reviews?.length ?? 0})</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">All reviews are tied to confirmed completed jobs</p>
            </div>
            {contractor.reviewCount > 0 && (
              <div className="flex-shrink-0 text-center">
                <p className="text-4xl font-bold">{contractor.rating.toFixed(1)}</p>
                <div className="flex gap-0.5 justify-center my-1">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i <= Math.round(contractor.rating) ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{contractor.reviewCount} reviews</p>
              </div>
            )}
          </div>

          {/* Rating bars */}
          {contractor.reviewCount > 0 && (
            <div className="mt-3 space-y-1.5">
              {ratingCounts.map(({ rating, count }) => (
                <RatingBar key={rating} rating={rating} count={count} total={contractor.reviewCount} />
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {reviews && reviews.length > 0 ? reviews.map((review) => (
            <div key={review.id} className="p-4 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {review.homeownerName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="font-medium text-sm">{review.homeownerName}</span>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
                      ))}
                    </div>
                    {review.jobTitle && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {review.jobTitle}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {new Date(review.createdAt).toLocaleDateString("en-KE", { month: "short", year: "numeric" })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{review.comment}</p>
              {review.photos && review.photos.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {review.photos.slice(0, 3).map((p, i) => (
                    <div key={i} className="h-16 w-16 rounded overflow-hidden bg-muted flex-shrink-0">
                      <img src={p} alt="" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )) : (
            <p className="text-muted-foreground text-sm py-4 text-center">No reviews yet for this contractor.</p>
          )}
        </CardContent>
      </Card>

      {/* Sticky Book CTA — mobile only */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t bg-background/95 backdrop-blur p-4 flex gap-3">
        <Button variant="outline" className="flex-1" onClick={handleShare}>
          <MessageCircle className="h-4 w-4 mr-2 text-green-500" />
          WhatsApp
        </Button>
        <Button asChild className="flex-1">
          <Link href={`/jobs/new?contractorId=${id}`}>Book This Pro</Link>
        </Button>
      </div>
    </div>
  );
}
