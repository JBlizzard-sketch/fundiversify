import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ArrowRight, ShieldCheck, CheckCircle, FileText, Upload } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateContractor } from "@workspace/api-client-react";

const TRADES = ["Plumbing", "Electrical", "Painting", "Tiling", "Roofing", "Carpentry", "Masonry", "Fundi", "HVAC", "Welding"];
const LOCATIONS = ["Westlands", "Kilimani", "Karen", "Kasarani", "Parklands", "Lavington", "Eastleigh", "South B", "Langata", "Ruaka", "Roysambu", "Thika Road"];
const STEPS = ["Personal Info", "Trade & Experience", "Documents", "About You", "Submit"];

async function requestUploadUrl(file: File): Promise<{ uploadURL: string; objectPath: string }> {
  const res = await fetch("/api/storage/uploads/request-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
  });
  return res.json();
}

async function uploadFile(file: File): Promise<string> {
  const { uploadURL, objectPath } = await requestUploadUrl(file);
  await fetch(uploadURL, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
  return `/api/storage/objects/${objectPath.replace(/^\/objects\//, "")}`;
}

function DocUploadField({
  label, hint, value, onChange,
}: { label: string; hint: string; value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");

  return (
    <div>
      <label className="text-sm font-medium mb-1.5 block">{label}</label>
      <p className="text-xs text-muted-foreground mb-2">{hint}</p>
      {value ? (
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
          <span className="text-sm text-green-700 truncate flex-1">{fileName || "Uploaded"}</span>
          <button
            type="button"
            onClick={() => { onChange(""); setFileName(""); }}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            Remove
          </button>
        </div>
      ) : (
        <label className={`flex items-center gap-3 p-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${uploading ? "border-primary/50 bg-primary/5" : "border-muted hover:border-primary/40 hover:bg-muted/30"}`}>
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            {uploading ? (
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="h-4 w-4 text-primary" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium">{uploading ? "Uploading..." : "Click to upload"}</p>
            <p className="text-xs text-muted-foreground">JPG, PNG or PDF · Max 10MB</p>
          </div>
          <input
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            disabled={uploading}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploading(true);
              setFileName(file.name);
              try {
                const url = await uploadFile(file);
                onChange(url);
              } catch {
                setFileName("");
              } finally {
                setUploading(false);
              }
            }}
          />
        </label>
      )}
    </div>
  );
}

export default function ApplyPage() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "", phone: "", trade: "", location: "", yearsExperience: "0",
    bio: "", specializations: "", idDocUrl: "", businessPermitUrl: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const createContractor = useCreateContractor({
    mutation: {
      onSuccess: () => setSubmitted(true),
    },
  });

  const handleSubmit = () => {
    if (!form.name || !form.phone || !form.trade || !form.location) return;
    createContractor.mutate({
      data: {
        name: form.name,
        phone: form.phone,
        trade: form.trade,
        location: form.location,
        bio: form.bio || undefined,
        yearsExperience: parseInt(form.yearsExperience, 10) || 0,
        specializations: form.specializations ? form.specializations.split(",").map(s => s.trim()) : [],
        idDocUrl: form.idDocUrl || undefined,
        businessPermitUrl: form.businessPermitUrl || undefined,
      },
    });
  };

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-primary/10 mb-6">
          <CheckCircle className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Application Submitted!</h1>
        <p className="text-muted-foreground mb-8">
          Thank you for applying. Our team will review your application and documents, verify your ID, and contact you within 2–3 business days. If approved, you'll receive your Verified Pro badge.
        </p>
        <div className="space-y-3">
          <Button asChild className="w-full"><Link href="/contractors">Browse Verified Pros</Link></Button>
          <Button asChild variant="outline" className="w-full"><Link href="/">Back Home</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-lg">
      <Button variant="ghost" asChild className="mb-6 -ml-2">
        <Link href="/"><ArrowLeft className="h-4 w-4 mr-2" />Back Home</Link>
      </Button>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="text-sm font-medium text-primary">Become a Verified Pro</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">Apply to Join FundiVerify</h1>
        <p className="text-muted-foreground">Get your Verified badge and start receiving qualified job leads in your area.</p>
      </div>

      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1">
            <div className={`h-1.5 rounded-full transition-all ${i <= step ? "bg-primary" : "bg-muted"}`} />
            <p className="text-xs mt-1.5 text-muted-foreground hidden sm:block">{s}</p>
          </div>
        ))}
      </div>

      {step === 0 && (
        <Card>
          <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Full Name *</label>
              <Input placeholder="Your full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Phone Number *</label>
              <Input placeholder="+254 7XX XXX XXX" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Working Area / Neighborhood *</label>
              <Select value={form.location} onValueChange={v => setForm(f => ({ ...f, location: v }))}>
                <SelectTrigger><SelectValue placeholder="Select your main area" /></SelectTrigger>
                <SelectContent>{LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>Trade & Experience</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Primary Trade *</label>
              <Select value={form.trade} onValueChange={v => setForm(f => ({ ...f, trade: v }))}>
                <SelectTrigger><SelectValue placeholder="What do you specialise in?" /></SelectTrigger>
                <SelectContent>{TRADES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Years of Experience</label>
              <Input type="number" min="0" max="50" placeholder="e.g. 5" value={form.yearsExperience} onChange={e => setForm(f => ({ ...f, yearsExperience: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Specializations (comma-separated)</label>
              <Input placeholder="e.g. Burst pipes, Borehole pumps, Solar water heaters" value={form.specializations} onChange={e => setForm(f => ({ ...f, specializations: e.target.value }))} />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>Identity Documents</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Upload your documents to speed up the verification process. All documents are securely stored and reviewed by our team only.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <DocUploadField
              label="National ID / Passport *"
              hint="Clear photo of the front of your ID. Must match the name on your application."
              value={form.idDocUrl}
              onChange={(url) => setForm(f => ({ ...f, idDocUrl: url }))}
            />
            <DocUploadField
              label="Business Permit (optional)"
              hint="County business permit or NCA certificate, if you have one. Speeds up verification."
              value={form.businessPermitUrl}
              onChange={(url) => setForm(f => ({ ...f, businessPermitUrl: url }))}
            />
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 flex-shrink-0 text-primary mt-0.5" />
              <span>Your documents are encrypted at rest and only accessible to the FundiVerify verification team. They are never shared with homeowners.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader><CardTitle>Tell Us About Yourself</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Professional Bio</label>
              <Textarea
                placeholder="Describe your work, your approach, what makes you reliable. This is what homeowners will read first..."
                rows={6}
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              />
            </div>
            <div className="p-4 bg-muted/50 rounded-xl text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">After submission, we will:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Verify your National ID against your application</li>
                <li>Call 2–3 references from past clients</li>
                <li>Review any uploaded business permits</li>
                <li>Complete within 2–3 business days</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 mt-6">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">
            <ArrowLeft className="h-4 w-4 mr-2" />Back
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button
            className="flex-1"
            onClick={() => setStep(s => s + 1)}
            disabled={
              (step === 0 && (!form.name || !form.phone || !form.location)) ||
              (step === 1 && !form.trade) ||
              (step === 2 && !form.idDocUrl)
            }
          >
            Next <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button className="flex-1" onClick={handleSubmit} disabled={createContractor.isPending}>
            {createContractor.isPending ? "Submitting..." : "Submit Application"}
          </Button>
        )}
      </div>
    </div>
  );
}
