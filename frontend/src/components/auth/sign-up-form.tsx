"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signup } from "@/lib/api/endpoints";
import { useAuthStore } from "@/lib/store/use-auth-store";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const signUpSchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  organizationName: z.string().min(1, "Organization name is required"),
});

type SignUpValues = z.infer<typeof signUpSchema>;

export function SignUpForm() {
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      organizationName: "",
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();
  const queryClient = useQueryClient();

  const onSubmit = async (values: SignUpValues) => {
    setIsSubmitting(true);
    try {
      const response = await signup({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        organizationName: values.organizationName,
      });
      setAuth(response);
      await queryClient.invalidateQueries();
      router.push("/");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to sign up. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          placeholder="Alex Builder"
          {...form.register("fullName")}
          disabled={isSubmitting}
        />
        {form.formState.errors.fullName ? (
          <p className="text-xs text-red-400">{form.formState.errors.fullName.message}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          {...form.register("email")}
          disabled={isSubmitting}
        />
        {form.formState.errors.email ? (
          <p className="text-xs text-red-400">{form.formState.errors.email.message}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="organizationName">Workspace name</Label>
        <Input
          id="organizationName"
          placeholder="Focus Labs"
          {...form.register("organizationName")}
          disabled={isSubmitting}
        />
        {form.formState.errors.organizationName ? (
          <p className="text-xs text-red-400">
            {form.formState.errors.organizationName.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="********"
          {...form.register("password")}
          disabled={isSubmitting}
        />
        {form.formState.errors.password ? (
          <p className="text-xs text-red-400">{form.formState.errors.password.message}</p>
        ) : null}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
