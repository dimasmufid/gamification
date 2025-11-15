import Link from "next/link";
import { Metadata } from "next";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in · Nesra Town",
};

export default function SignInPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="text-sm text-white/70">
          Sign in to continue building your tenant workspace.
        </p>
      </div>
      <SignInForm />
      <p className="text-center text-sm text-white/70">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="font-medium text-white">
          Create one
        </Link>
      </p>
    </div>
  );
}
