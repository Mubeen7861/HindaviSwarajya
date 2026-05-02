import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useCreatePost, getListPostsQueryKey } from "@workspace/api-client-react";
import { SevaCategory } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUserId } from "@/hooks/useCurrentUser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { Link } from "wouter";

const formSchema = z.object({
  content: z.string().min(10, "Description must be at least 10 characters"),
  category: z.enum([SevaCategory.Food, SevaCategory.Education, SevaCategory.Health, SevaCategory.Shelter, SevaCategory.Other]),
  helpedPeople: z.coerce.number().min(1, "Must have helped at least 1 person"),
  tags: z.string().transform(str => str.split(',').map(s => s.trim()).filter(Boolean)),
  location: z.string().optional(),
  image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreatePost() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const currentUserId = useCurrentUserId();

  const createPost = useCreatePost({
    mutation: {
      onSuccess: () => {
        toast({
          title: "Seva posted successfully!",
          description: "Thank you for contributing to the community.",
        });
        queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
        setLocation("/app");
      },
      onError: () => {
        toast({
          title: "Failed to post",
          description: "Please try again later.",
          variant: "destructive"
        });
      }
    }
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
      category: SevaCategory.Other,
      helpedPeople: 1,
      tags: [],
      location: "",
      image: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    if (currentUserId === undefined) {
      toast({ title: "Please sign in to share seva", variant: "destructive" });
      return;
    }
    createPost.mutate({ data });
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <Link href="/app">
        <Button variant="ghost" size="sm" className="mb-4 gap-2 text-muted-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to Feed
        </Button>
      </Link>

      <Card className="border-orange-200 dark:border-orange-900/50 shadow-md">
        <CardHeader className="bg-primary/5 pb-6 border-b">
          <CardTitle className="text-2xl font-serif text-primary">Share Your Seva</CardTitle>
          <CardDescription className="text-base">
            Inspire others by sharing acts of community service. Every small effort counts.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">What did you do?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the act of service..."
                        className="min-h-32 resize-none"
                        data-testid="input-content"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={SevaCategory.Food}>Food</SelectItem>
                          <SelectItem value={SevaCategory.Education}>Education</SelectItem>
                          <SelectItem value={SevaCategory.Health}>Health</SelectItem>
                          <SelectItem value={SevaCategory.Shelter}>Shelter</SelectItem>
                          <SelectItem value={SevaCategory.Other}>Other</SelectItem>
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
                      <FormLabel className="font-semibold">People Helped</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          data-testid="input-helped"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Approximate number of beneficiaries</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Location (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Pune, Maharashtra"
                          data-testid="input-location"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field: { value, onChange, ...rest } }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Tags (Comma separated)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. education, children, rural"
                          data-testid="input-tags"
                          value={Array.isArray(value) ? value.join(", ") : value}
                          onChange={(e) => onChange(e.target.value)}
                          {...rest}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Image URL (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/image.jpg"
                        data-testid="input-image"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 border-t flex justify-end">
                <Button
                  type="submit"
                  size="lg"
                  disabled={createPost.isPending || currentUserId === undefined}
                  className="w-full sm:w-auto gap-2"
                  data-testid="button-submit-post"
                >
                  <Save className="w-5 h-5" />
                  {createPost.isPending ? "Posting..." : "Share Seva"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
