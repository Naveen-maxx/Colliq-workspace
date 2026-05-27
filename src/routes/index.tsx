import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { SocialProof } from "@/components/landing/SocialProof";
import { Features } from "@/components/landing/Features";
import { Templates } from "@/components/landing/Templates";
import { WhyColliq } from "@/components/landing/WhyColliq";
import { Testimonials } from "@/components/landing/Testimonials";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Colliq Workspace — Work Together. Instantly." },
      {
        name: "description",
        content:
          "Colliq Workspace is a real-time collaborative workspace built for fast-moving teams to think, write, edit, collaborate, and share — all in one place.",
      },
      { property: "og:title", content: "Colliq Workspace — Work Together. Instantly." },
      {
        property: "og:description",
        content:
          "A real-time collaborative workspace for fast-moving teams. Live cursors, instant sync, beautifully calm.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <SocialProof />
      <Features />
      <Templates />
      <WhyColliq />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </main>
  );
}
