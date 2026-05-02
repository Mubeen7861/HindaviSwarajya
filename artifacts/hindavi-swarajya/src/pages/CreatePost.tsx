import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useCreatePost, getListPostsQueryKey, SevaCategory } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUserId } from "@/hooks/useCurrentUser";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Send, Users, MapPin, ImageIcon, Tag, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  content: z.string().min(10, "Description must be at least 10 characters").max(500, "Max 500 characters"),
  category: z.enum([SevaCategory.Food, SevaCategory.Education, SevaCategory.Health, SevaCategory.Shelter, SevaCategory.Other]),
  helpedPeople: z.coerce.number().min(1, "Must have helped at least 1 person"),
  // Tags: keep as raw string in form state so the controlled <Input> never receives an array.
  tags: z.string().default(""),
  location: z.string().optional(),
  image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

const STEP_FIELDS: Record<number, (keyof FormValues)[]> = {
  1: ["content", "category", "helpedPeople"],
  2: ["location", "image"],
  3: ["tags"],
};

const CATEGORY_KEYS: Record<SevaCategory, string> = {
  [SevaCategory.Food]: "share.cat.food",
  [SevaCategory.Education]: "share.cat.education",
  [SevaCategory.Health]: "share.cat.health",
  [SevaCategory.Shelter]: "share.cat.shelter",
  [SevaCategory.Other]: "share.cat.other",
};

function parseTags(raw: string): string[] {
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export default function CreatePost() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const currentUserId = useCurrentUserId();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const createPost = useCreatePost({
    mutation: {
      onSuccess: () => {
        toast({ title: t("share.submittedTitle"), description: t("share.submittedBody") });
        queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
        setLocation("/app");
      },
      onError: () => {
        toast({ title: t("share.failedTitle"), description: t("share.failedBody"), variant: "destructive" });
      },
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      content: "",
      category: SevaCategory.Other,
      helpedPeople: 1,
      tags: "",
      location: "",
      image: "",
    },
  });

  // Subscribe to all watched values once (stable, avoids brittle inline form.watch in deps).
  const watched = form.watch();

  const charCount = (watched.content ?? "").length;

  const progressPercent = useMemo(() => {
    let pts = 0;
    if (watched.content && watched.content.length >= 10) pts += 40;
    if (watched.category) pts += 15;
    if (watched.helpedPeople && Number(watched.helpedPeople) >= 1) pts += 15;
    if (watched.location && watched.location.length > 0) pts += 10;
    if (watched.image && watched.image.length > 0) pts += 10;
    if (watched.tags && watched.tags.length > 0) pts += 10;
    return Math.min(100, Math.max(10, pts));
  }, [watched.content, watched.category, watched.helpedPeople, watched.location, watched.image, watched.tags]);

  const goNext = async () => {
    const fields = STEP_FIELDS[step];
    const valid = await form.trigger(fields);
    if (!valid) return;
    if (step < 3) setStep((step + 1) as 1 | 2 | 3);
  };

  const onSubmit = (data: FormValues) => {
    if (currentUserId === undefined) {
      toast({ title: t("share.signInPrompt"), variant: "destructive" });
      return;
    }
    // Parse tags string -> string[] at submit time.
    const payload = { ...data, tags: parseTags(data.tags ?? "") };
    createPost.mutate({ data: payload });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Back link */}
      <Link href="/app">
        <Button variant="ghost" size="sm" className="mb-3 gap-2 text-muted-foreground -ml-2" data-testid="link-back">
          <ArrowLeft className="w-4 h-4" /> {t("share.back")}
        </Button>
      </Link>

      {/* Header + progress */}
      <div className="mb-5">
        <h1 className="text-2xl sm:text-[26px] font-semibold text-primary tracking-tight">
          {t("share.pageTitle")}
        </h1>
        <div className="mt-3 flex items-center gap-3">
          <div
            role="progressbar"
            aria-label={t("share.progressLabel")}
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden"
          >
            <div
              className="h-full bg-gradient-to-r from-primary to-orange-500 transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
              data-testid="progress-bar"
            />
          </div>
          <span className="text-[12.5px] text-orange-600 font-medium tabular-nums shrink-0">
            {t("share.progressComplete", { percent: progressPercent })}
          </span>
        </div>
      </div>

      {/* Marathi quote banner */}
      <div className="mb-5 rounded-2xl border border-orange-200 bg-orange-50/70 px-5 py-4 text-center">
        <p className="text-orange-700 font-medium text-[15px]" lang="mr">
          "जो वाढविल धर्म सकळांचा सो वाढविल राज्य आपणासि"
        </p>
        <p className="text-foreground/70 text-[13px] mt-1.5">
          {t("share.quote")}
        </p>
      </div>

      {/* Step card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        {/* Step header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("share.stepOf", { current: step, total: 3 })}
          </h2>
          <div
            role="group"
            aria-label={t("share.stepProgressLabel")}
            className="flex items-center gap-1.5"
          >
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                aria-hidden="true"
                className={cn(
                  "h-2 rounded-full transition-all",
                  n === step ? "bg-primary w-6" : n < step ? "bg-orange-300 w-2" : "bg-gray-200 w-2",
                )}
                data-testid={`step-dot-${n}`}
              />
            ))}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* ── Step 1 ── */}
            {step === 1 && (
              <>
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[14px] font-semibold text-gray-900">
                        {t("share.step1Q")} <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("share.step1Placeholder")}
                          className="min-h-32 resize-none bg-gray-50 border-gray-200 focus:bg-white"
                          maxLength={500}
                          data-testid="input-content"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-[11px] text-gray-500 text-right tabular-nums">
                        {t("share.chars", { count: charCount })}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid sm:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[14px] font-semibold text-gray-900">
                          {t("share.category")} <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-gray-50 border-gray-200" data-testid="select-category">
                              <SelectValue placeholder={t("share.categoryPlaceholder")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(SevaCategory).map((cat) => (
                              <SelectItem key={cat} value={cat}>{t(CATEGORY_KEYS[cat])}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="helpedPeople"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[14px] font-semibold text-gray-900">
                          {t("share.peopleHelped")} <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              type="number"
                              min={1}
                              className="pl-9 bg-gray-50 border-gray-200"
                              data-testid="input-helped"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <p className="text-[11.5px] text-orange-600 font-medium flex items-center gap-1 mt-1">
                          <Sparkles className="w-3 h-3" /> {t("share.earnHint")}
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            {/* ── Step 2 ── */}
            {step === 2 && (
              <>
                <h3 className="text-[14px] font-semibold text-gray-900 mb-1">{t("share.step2Q")}</h3>
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[14px] font-semibold text-gray-900">
                        {t("share.locationLabel")}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            placeholder={t("share.locationPlaceholder")}
                            className="pl-9 bg-gray-50 border-gray-200"
                            data-testid="input-location"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[14px] font-semibold text-gray-900">
                        {t("share.imageLabel")}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            placeholder={t("share.imagePlaceholder")}
                            className="pl-9 bg-gray-50 border-gray-200"
                            data-testid="input-image"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watched.image && (
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <img
                      src={watched.image}
                      alt="preview"
                      className="w-full h-48 object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                )}
              </>
            )}

            {/* ── Step 3 ── */}
            {step === 3 && (
              <>
                <h3 className="text-[14px] font-semibold text-gray-900 mb-1">{t("share.step3Q")}</h3>
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[14px] font-semibold text-gray-900">
                        {t("share.tagsLabel")}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            placeholder={t("share.tagsPlaceholder")}
                            className="pl-9 bg-gray-50 border-gray-200"
                            data-testid="input-tags"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Review summary */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-2.5">
                  <p className="text-[12px] uppercase tracking-wider font-semibold text-gray-500">
                    {t("share.reviewLabel")}
                  </p>
                  <p className="text-[13.5px] text-gray-800 line-clamp-3">{watched.content}</p>
                  <div className="flex flex-wrap gap-2 text-[12px] text-gray-700">
                    <span className="px-2.5 py-1 rounded-full bg-white border border-gray-200">
                      {t(CATEGORY_KEYS[watched.category])}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-white border border-gray-200 flex items-center gap-1">
                      <Users className="w-3 h-3" /> {t("share.helpedChip", { count: watched.helpedPeople })}
                    </span>
                    {watched.location && (
                      <span className="px-2.5 py-1 rounded-full bg-white border border-gray-200 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {watched.location}
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ── Step navigation ── */}
            <div className="pt-2 flex items-center gap-3">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep((step - 1) as 1 | 2 | 3)}
                  className="gap-2"
                  data-testid="button-back-step"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t("share.back")}
                </Button>
              )}

              {step < 3 ? (
                <Button
                  type="button"
                  onClick={goNext}
                  className="flex-1 h-12 gap-2 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white font-semibold rounded-xl"
                  data-testid="button-next-step"
                >
                  {step === 1 ? t("share.continueLocation") : t("share.continueTags")}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={createPost.isPending || currentUserId === undefined}
                  className="flex-1 h-12 gap-2 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white font-semibold rounded-xl"
                  data-testid="button-submit-post"
                >
                  <Send className="w-4 h-4" />
                  {createPost.isPending ? t("share.submitting") : t("share.submit")}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
