import { useParams, Link } from "wouter";
import { ShieldCheck, Star, MapPin, Phone, Bookmark, BookmarkCheck, ArrowLeft, Calendar, Briefcase, Award } from "lucide-react";
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

const HOMEOWNER_ID = 1;

export default function ContractorProfilePage() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0", 10);
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);

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

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <Button variant="ghost" asChild className="mb-6 -ml-2">
        <Link href="/contractors"><ArrowLeft className="h-4 w-4 mr-2" />Back to Directory</Link>
      </Button>

      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-24 w-24 border-4 border-primary/20">
              <AvatarImage src={contractor.avatarUrl ?? ""} alt={contractor.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">
                {contractor.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold">{contractor.name}</h1>
                    {contractor.verificationStatus === "verified" && (
                      <div className="flex items-center gap-1 text-primary text-sm font-medium bg-primary/10 px-2 py-0.5 rounded-full">
                        <ShieldCheck className="h-4 w-4" />Verified Pro
                      </div>
                    )}
                    {contractor.subscriptionTier === "pro" && (
                      <Badge>Pro Member</Badge>
                    )}
                  </div>
                  <p className="text-primary font-medium mt-1">{contractor.trade}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{contractor.location}</span>
                    <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{contractor.jobsCompleted} jobs completed</span>
                    {contractor.yearsExperience > 0 && (
                      <span className="flex items-center gap-1"><Award className="h-3.5 w-3.5" />{contractor.yearsExperience} years experience</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col md:items-end gap-3">
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className={`h-5 w-5 ${i <= Math.round(contractor.rating) ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
                    ))}
                    <span className="ml-2 font-semibold">{contractor.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground text-sm ml-1">({contractor.reviewCount} reviews)</span>
                  </div>
                  <div className="flex gap-2">
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
                    <Button asChild>
                      <Link href={`/jobs/new?contractorId=${id}`}>Book This Pro</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {contractor.bio && (
            <>
              <Separator className="my-6" />
              <p className="text-muted-foreground leading-relaxed">{contractor.bio}</p>
            </>
          )}

          {contractor.phone && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{contractor.phone}</span>
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
              {contractor.portfolioPhotos.map((url, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted">
                  <img src={url} alt={`Portfolio ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Verified Reviews ({reviews?.length ?? 0})</CardTitle>
          <p className="text-sm text-muted-foreground">All reviews are tied to confirmed completed jobs</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {reviews && reviews.length > 0 ? reviews.map((review) => (
            <div key={review.id} className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{review.homeownerName}</span>
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
                      ))}
                    </div>
                  </div>
                  {review.jobTitle && (
                    <p className="text-xs text-muted-foreground mt-0.5">Job: {review.jobTitle}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {new Date(review.createdAt).toLocaleDateString("en-KE", { month: "short", year: "numeric" })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
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
    </div>
  );
}
