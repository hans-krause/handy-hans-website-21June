import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { Footer } from "@/components/site/Footer";
import { Seo } from "@/components/site/Seo";

const Index = () => {
  return (
    <main className="min-h-screen bg-gradient-soft">
      <Seo
        title="Handy Hans English — Online British English coaching"
        description="Learn English with Hans. 1:1 lessons, 10-session packs and weekly live group classes online. Friendly British English coaching for learners worldwide."
        path="/"
      />
      <Navbar />
      <Hero />
      <Footer />
    </main>
  );
};

export default Index;
