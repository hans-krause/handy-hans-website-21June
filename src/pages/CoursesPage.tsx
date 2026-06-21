import { Navbar } from "@/components/site/Navbar";
import { Courses } from "@/components/site/Courses";
import { Footer } from "@/components/site/Footer";
import { Seo } from "@/components/site/Seo";

const CoursesPage = () => (
  <main className="min-h-screen bg-gradient-hero">
    <Seo
      title="English Classes — 1:1, 10-session packs & group classes | Handy Hans"
      description="Book live online English coaching with Hans: one-to-one lessons, discounted 10-session packs and small weekly group classes for intermediate learners."
      path="/courses"
    />
    <Navbar />
    <div className="pt-20">
      <Courses />
    </div>
    <Footer />
  </main>
);

export default CoursesPage;
