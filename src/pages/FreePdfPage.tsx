import { Navbar } from "@/components/site/Navbar";
import { FreePdf } from "@/components/site/FreePdf";
import { Footer } from "@/components/site/Footer";
import { Seo } from "@/components/site/Seo";

const FreePdfPage = () => (
  <main className="min-h-screen bg-gradient-hero">
    <Seo
      title="Free English PDF — Hans's Top 20 Evil English Errors"
      description="Download Hans's free 6-page study sheet on the 20 most common English mistakes. Sent straight to your inbox — perfect for intermediate learners."
      path="/free-pdf"
    />
    <Navbar />
    <div className="pt-20">
      <FreePdf />
    </div>
    <Footer />
  </main>
);

export default FreePdfPage;
