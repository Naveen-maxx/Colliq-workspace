import { createFileRoute } from "@tanstack/react-router";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthForm } from "@/components/auth/AuthForm";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Get Started — Colliq Workspace" },
      {
        name: "description",
        content: "Create your free Colliq account and start collaborating in real time.",
      },
      { property: "og:title", content: "Get Started — Colliq Workspace" },
      {
        property: "og:description",
        content: "Create your free Colliq account and start collaborating in real time.",
      },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  return (
    <AuthLayout
      side="signup"
      title="Start collaborating."
      subtitle="Create your free Colliq account — no credit card required."
    >
      <AuthForm mode="signup" />
    </AuthLayout>
  );
}
