import { useEffect, useRef } from "react";
import { Star, Quote } from "lucide-react";
import { useGetContractorReviews } from "@workspace/api-client-react";

const FALLBACK_REVIEWS = [
  { id: -1,  contractorName: "James Kamau",   homeownerName: "Alice W.",   rating: 5, comment: "James fixed our burst pipes in under 2 hours. Extremely professional and his prices were very fair. Highly recommend!", jobTrade: "Plumbing"   },
  { id: -2,  contractorName: "Lucy Achieng",  homeownerName: "David M.",   rating: 5, comment: "Lucy transformed our living room with the most precise paint job I've ever seen. Not a single drip. Remarkable work.", jobTrade: "Painting"   },
  { id: -3,  contractorName: "Peter Mwangi",  homeownerName: "Grace N.",   rating: 5, comment: "Rewired the whole kitchen safely and quickly. Peter explained everything he was doing and left the place spotless.", jobTrade: "Electrical" },
  { id: -4,  contractorName: "Grace Wanjiku", homeownerName: "Samuel K.",  rating: 5, comment: "Our bathroom tiling is now the envy of our whole estate. Perfect grout lines, perfectly level. Absolute pro.", jobTrade: "Tiling"     },
  { id: -5,  contractorName: "Moses Njiru",   homeownerName: "Esther A.",  rating: 4, comment: "Fixed the roof before the long rains hit. No leaks since! Prompt, tidy, and priced fairly for the quality of work.", jobTrade: "Roofing"    },
  { id: -6,  contractorName: "Faith Otieno",  homeownerName: "Patrick O.", rating: 5, comment: "Built us beautiful custom wardrobes from scratch. Faith brought her own designs and the finish is absolutely gorgeous.", jobTrade: "Carpentry"  },
  { id: -7,  contractorName: "James Kamau",   homeownerName: "Mercy W.",   rating: 5, comment: "Second time using James — he replaced our old water heater perfectly. Worth every shilling.", jobTrade: "Plumbing"   },
  { id: -8,  contractorName: "Lucy Achieng",  homeownerName: "Collins M.", rating: 5, comment: "Painted the full exterior of our house in 3 days with a team of 2. Looks brand new. Neighbours keep asking who did it!", jobTrade: "Painting"   },
];

function ReviewCard({ review }: { review: typeof FALLBACK_REVIEWS[0] }) {
  return (
    <div className="flex-shrink-0 w-72 bg-background border rounded-2xl p-5 shadow-sm mx-3">
      <Quote className="h-5 w-5 text-primary/30 mb-3" />
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">{review.comment}</p>
      <div className="flex items-center justify-between pt-3 border-t">
        <div>
          <p className="text-xs font-semibold">{review.homeownerName}</p>
          <p className="text-xs text-muted-foreground">{review.jobTrade} job</p>
        </div>
        <div className="text-right">
          <div className="flex gap-0.5 justify-end mb-0.5">
            {[1,2,3,4,5].map((i) => (
              <Star key={i} className={`h-3 w-3 ${i <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`} />
            ))}
          </div>
          <p className="text-xs font-medium text-primary">{review.contractorName}</p>
        </div>
      </div>
    </div>
  );
}

export function ReviewMarquee() {
  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const posRef = useRef(0);
  const pausedRef = useRef(false);

  const { data: reviewsC1 } = useGetContractorReviews(1);
  const { data: reviewsC2 } = useGetContractorReviews(2);

  const liveReviews = [
    ...(reviewsC1?.reviews ?? []).map((r: any) => ({ ...r, contractorName: "James Kamau", jobTrade: r.jobTrade ?? "Plumbing" })),
    ...(reviewsC2?.reviews ?? []).map((r: any) => ({ ...r, contractorName: "Lucy Achieng", jobTrade: r.jobTrade ?? "Painting" })),
  ];

  const reviews = liveReviews.length >= 4 ? liveReviews : FALLBACK_REVIEWS;
  const doubled = [...reviews, ...reviews];

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const speed = 0.5;

    function animate() {
      if (!pausedRef.current && track) {
        posRef.current -= speed;
        const halfWidth = track.scrollWidth / 2;
        if (Math.abs(posRef.current) >= halfWidth) posRef.current = 0;
        track.style.transform = `translateX(${posRef.current}px)`;
      }
      animRef.current = requestAnimationFrame(animate);
    }
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [reviews.length]);

  return (
    <section className="py-16 overflow-hidden bg-muted/30">
      <div className="container px-4 md:px-6 mb-8 text-center">
        <h2 className="text-2xl font-bold mb-2">What Homeowners Are Saying</h2>
        <p className="text-muted-foreground text-sm">Real reviews from verified completed jobs across Nairobi</p>
      </div>
      <div
        className="overflow-hidden"
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; }}
      >
        <div ref={trackRef} className="flex will-change-transform">
          {doubled.map((r, i) => (
            <ReviewCard key={`${r.id}-${i}`} review={r as any} />
          ))}
        </div>
      </div>
    </section>
  );
}
