import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { CalEmbed } from "@/components/site/CalEmbed";
import { Check, ArrowLeft } from "lucide-react";
import { getCourseById } from "@/data/courses";
import NotFound from "./NotFound";
import hansCircle from "@/assets/hans-circle.png";
import hansCircleBig from "@/assets/hans-circle-big.png";
import hansCircleSingle from "@/assets/hans-circle-single.png";

const BookCoursePage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const course = courseId ? getCourseById(courseId) : undefined;

  if (!course) return <NotFound />;

  const calConfig: Record<string, { namespace: string; calLink: string; elementId: string }> = {
    "single-1on1": {
      namespace: "singleclass",
      calLink: "handyhans/singleclass",
      elementId: "my-cal-inline-singleclass",
    },
    "ten-pack": {
      namespace: "10-session-english-class-package",
      calLink: "handyhans/10-session-english-class-package",
      elementId: "my-cal-inline-10-session-english-class-package",
    },
  };
  const cal = calConfig[course.id] ?? calConfig["single-1on1"];

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-20">
        <div className="container max-w-6xl">
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to classes
          </Link>

          <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
            {/* LEFT: course details */}
            <div>
              <span className="text-sm font-medium text-primary uppercase tracking-wider">
                {course.tagline}
              </span>
              <div className="my-6 flex justify-center">
                <img
                  src={course.id === "ten-pack" ? hansCircleBig : course.id === "single-1on1" ? hansCircleSingle : hansCircle}
                  alt="Hans, your English teacher"
                  className="w-40 h-40 md:w-56 md:h-56 object-contain"
                  loading="lazy"
                />
              </div>
              <h1 className="font-display text-3xl md:text-5xl font-semibold mt-3 mb-4">
                {course.name}
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                {course.description}
              </p>

              <div className="mb-8">
                <h2 className="font-display text-xl font-semibold mb-4">What's included</h2>
                <ul className="space-y-3">
                  {course.details.map((d) => (
                    <li key={d} className="flex items-start gap-3 text-foreground/85">
                      <Check className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="font-display text-xl font-semibold mb-4">Who it's for</h2>
                <ul className="space-y-3">
                  {course.whoFor.map((w) => (
                    <li key={w} className="flex items-start gap-3 text-foreground/85">
                      <Check className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* RIGHT: Cal.com booking embed */}
            <div className="self-start">
              <div className="rounded-3xl border border-border/60 bg-card shadow-elevated p-3 md:p-4">
                <CalEmbed
                  namespace={cal.namespace}
                  calLink={cal.calLink}
                  elementId={cal.elementId}
                />
              </div>

              <div className="mt-4 text-sm text-muted-foreground text-center">
                Questions first?{" "}
                <Link to="/contact" className="text-primary hover:underline">
                  CONTACT
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default BookCoursePage;
