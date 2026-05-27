import { createFileRoute } from "@tanstack/react-router";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthForm } from "@/components/auth/AuthForm";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — Colliq Workspace" },
      {
        name: "description",
        content: "Log in to Colliq Workspace and pick up where your team left off.",
      },
      { property: "og:title", content: "Log in — Colliq Workspace" },
      {
        property: "og:description",
        content: "Log in to Colliq Workspace and pick up where your team left off.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <AuthLayout
      side="login"
      title="Welcome back."
      subtitle="Log in to continue collaborating with your team."
    >
      <AuthForm mode="login" />
    </AuthLayout>
  );
}
