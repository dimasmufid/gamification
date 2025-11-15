import Link from "next/link";
import { Metadata } from "next";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Create account · Nesra Town",
};

export default function SignUpPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold">Create your workspace</h1>
        <p className="text-sm text-white/70">
          Launch a new tenant and invite your team in minutes.
        </p>
      </div>
      <SignUpForm />
      <p className="text-center text-sm text-white/70">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-white">
          Sign in
        </Link>
      </p>
    </div>
  );
}
