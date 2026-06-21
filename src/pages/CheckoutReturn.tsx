import { useSearchParams, Link } from "react-router-dom";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

const CheckoutReturn = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-20">
        <div className="container max-w-xl text-center">
          {sessionId ? (
            <>
              <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-6" />
              <h1 className="font-display text-3xl md:text-4xl font-semibold mb-4">
                You're all set!
              </h1>
              <p className="text-muted-foreground text-lg mb-8">
                Thanks for subscribing to the weekly group classes. You'll receive a confirmation
                email shortly with your Zoom link and what to expect for your first class.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild variant="hero" size="lg">
                  <Link to="/dashboard">Go to dashboard</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/">Back to home</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <h1 className="font-display text-3xl font-semibold mb-4">No session found</h1>
              <p className="text-muted-foreground mb-6">
                We couldn't find your checkout information.
              </p>
              <Button asChild variant="hero">
                <Link to="/courses/group-class/overview">Back to subscription</Link>
              </Button>
            </>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default CheckoutReturn;
