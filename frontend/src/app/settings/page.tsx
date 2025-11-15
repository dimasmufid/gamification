"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { updateTenant } from "@/lib/api/endpoints";
import { useAuthStore } from "@/lib/store/use-auth-store";
import { toast } from "sonner";
import Link from "next/link";

const settingsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  businessImage: z.string().url("Enter a valid URL").optional().or(z.literal("")),
});

type SettingsValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const organization = useAuthStore((state) => state.organization);
  const updateOrganization = useAuthStore((state) => state.updateOrganization);
  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: organization?.name ?? "",
      slug: organization?.slug ?? "",
      businessImage: organization?.businessImage ?? "",
    },
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (organization) {
      form.reset({
        name: organization.name,
        slug: organization.slug,
        businessImage: organization.businessImage ?? "",
      });
    }
  }, [organization, form]);

  if (!organization) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-white">
        <Card className="max-w-md space-y-4 bg-slate-900/70 p-6 text-center">
          <p>No active tenant selected.</p>
          <Link href="/" className="font-medium text-white">
            Return to dashboard
          </Link>
        </Card>
      </div>
    );
  }

  const onSubmit = async (values: SettingsValues) => {
    setIsSaving(true);
    try {
      const response = await updateTenant(organization.id, {
        name: values.name,
        slug: values.slug,
        businessImage: values.businessImage?.trim() ? values.businessImage.trim() : null,
      });
      updateOrganization({
        ...organization,
        name: response.name,
        slug: response.slug,
        businessImage: response.business_image,
      });
      toast.success("Tenant updated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update tenant";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Tenant settings</h1>
          <p className="text-sm text-white/70">Update workspace metadata for {organization.name}.</p>
        </div>
        <Card className="space-y-6 border-white/10 bg-slate-900/60 p-6">
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="name">Tenant name</Label>
              <Input id="name" {...form.register("name")} disabled={isSaving} />
              {form.formState.errors.name ? (
                <p className="text-xs text-red-400">{form.formState.errors.name.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" {...form.register("slug")} disabled={isSaving} />
              {form.formState.errors.slug ? (
                <p className="text-xs text-red-400">{form.formState.errors.slug.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessImage">Business image URL</Label>
              <Input
                id="businessImage"
                placeholder="https://..."
                {...form.register("businessImage")}
                disabled={isSaving}
              />
              {form.formState.errors.businessImage ? (
                <p className="text-xs text-red-400">
                  {form.formState.errors.businessImage.message}
                </p>
              ) : (
                <p className="text-xs text-white/50">Optional. Leave blank to remove image.</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
