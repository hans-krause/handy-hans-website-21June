import { Navbar } from "@/components/site/Navbar";
import { About } from "@/components/site/About";
import { Footer } from "@/components/site/Footer";
import { Seo } from "@/components/site/Seo";

const AboutPage = () => (
  <main className="min-h-screen bg-gradient-hero">
    <Seo
      title="About Hans — British English coach with 10+ years' experience"
      description="Meet Hans (a.k.a. Handy Hans), a native British English teacher with over a decade of international experience. Patient, friendly, target-oriented online coaching."
      path="/about"
    />
    <Navbar />
    <div className="pt-20">
      <About />
    </div>
    <Footer />
  </main>
);

export default AboutPage;
