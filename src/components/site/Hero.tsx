import { Button } from "@/components/ui/button";
import { ArrowRight, Volume2, VolumeX } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
const vinglishVideo = "https://gawyrzlzxfwrjfhbjdhw.supabase.co/storage/v1/object/public/videos/vinglish_2%20dollars-website.mp4";
import ryannPhoto from "@/assets/testimonial-ryann.png";
import muhammadPhoto from "@/assets/muhammad-testimonial.jpg.asset.json";
import trinhPhoto from "@/assets/testimonial-trinh.jpg";

export const Hero = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;

    const tryPlay = () => {
      void video.play().catch(() => {});
    };

    tryPlay();
    video.addEventListener("loadeddata", tryPlay);
    video.addEventListener("canplay", tryPlay);

    return () => {
      video.removeEventListener("loadeddata", tryPlay);
      video.removeEventListener("canplay", tryPlay);
    };
  }, []);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    if (!video.paused) return;
    video.play().catch(() => {});
  };

  return (
    <section id="top" className="relative pt-28 pb-16 md:pt-32 md:pb-20 overflow-hidden bg-gradient-hero">
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl" aria-hidden />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-accent/40 blur-3xl" aria-hidden />

      <div className="container relative">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 md:gap-12 items-center animate-fade-up">
            <div className="space-y-6 text-center md:text-left">
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.08] tracking-tight text-balance">
                <span className="block bg-gradient-to-r from-primary to-primary-deep bg-clip-text text-transparent">
                  Learn English
                </span>
                <span className="block text-primary-deep leading-tight">
                  1:1 lessons<br />
                  Group classes
                </span>
                <span className="block text-accent-foreground text-3xl sm:text-4xl md:text-5xl mt-2">
                  wherever you are in the world.
                </span>
              </h1>

              <div className="flex flex-wrap gap-3 justify-center md:justify-start pt-2">
                <Button variant="hero" size="lg" asChild>
                  <Link to="/courses">View available classes <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/free-pdf">Free English PDF download</Link>
                </Button>
              </div>

              <div className="flex items-center justify-center md:justify-start gap-6 pt-4 text-sm text-muted-foreground">
                <div>
                  <div className="font-display text-2xl text-primary-deep">10+</div>
                  <div>Years teaching experience</div>
                </div>
                <div className="h-10 w-px bg-border" />
                <div>
                  <div className="font-display text-2xl text-primary-deep">1M+</div>
                  <div>Audience across platforms</div>
                </div>
              </div>
            </div>

            <div className="relative w-full max-w-[220px] sm:max-w-[240px] md:w-[240px] aspect-[9/16] rounded-3xl overflow-hidden shadow-elevated bg-black mx-auto">
              <video
                ref={videoRef}
                src={vinglishVideo}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                muted
                playsInline
                loop
                preload="auto"
              />
              <button
                type="button"
                onClick={toggleMute}
                aria-label={muted ? "Tap to listen" : "Mute"}
                className="absolute top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 rounded-full bg-background/90 backdrop-blur px-3 py-1.5 text-xs font-medium text-foreground shadow-elevated hover:bg-background transition-all whitespace-nowrap"
              >
                {muted ? (
                  <>
                    <VolumeX className="h-3.5 w-3.5" />
                    Tap to listen
                  </>
                ) : (
                  <>
                    <Volume2 className="h-3.5 w-3.5" />
                    Mute
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="pt-12 space-y-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <figure className="max-w-md mx-auto bg-card border border-border/60 rounded-3xl p-6 shadow-soft text-left">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={ryannPhoto}
                  alt="Ryann, student from China"
                  className="h-14 w-14 rounded-full object-cover shrink-0"
                  loading="lazy"
                />
                <figcaption>
                  <div className="font-display text-lg font-semibold text-foreground">Ryann</div>
                  <div className="text-sm text-muted-foreground">China</div>
                </figcaption>
              </div>
              <blockquote className="text-sm md:text-base text-foreground/85 leading-relaxed">
                “Hans is the best teacher that I've ever had! My English improved quickly because of him. He gave me clear and understandable corrections on my grammar and pronunciation.”
              </blockquote>
            </figure>

            <figure className="max-w-md mx-auto bg-card border border-border/60 rounded-3xl p-6 shadow-soft text-left">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={muhammadPhoto.url}
                  alt="Muhammad, student from Pakistan"
                  className="h-14 w-14 rounded-full object-cover shrink-0"
                  loading="lazy"
                />
                <figcaption>
                  <div className="font-display text-lg font-semibold text-foreground">Muhammad</div>
                  <div className="text-sm text-muted-foreground">Pakistan</div>
                </figcaption>
              </div>
              <blockquote className="text-sm md:text-base text-foreground/85 leading-relaxed">
                “What I enjoy about the classes is not just learning English, but Hans helps me remember the words through real life examples. So I also learn interesting things about the world at the same time.”
              </blockquote>
            </figure>

            <figure className="max-w-md mx-auto bg-card border border-border/60 rounded-3xl p-6 shadow-soft text-left">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={trinhPhoto}
                  alt="Trinh, parent from Vietnam"
                  className="h-14 w-14 rounded-full object-cover object-top shrink-0"
                  loading="lazy"
                />
                <figcaption>
                  <div className="font-display text-lg font-semibold text-foreground">Trinh</div>
                  <div className="text-sm text-muted-foreground">Vietnam</div>
                </figcaption>
              </div>
              <blockquote className="text-sm md:text-base text-foreground/85 leading-relaxed">
                “Hans is an inspiring English teacher! He taught my 10-year-old sister and the impact was immediate. She is now much more confident speaking English and expressing herself. I highly recommend him!”
              </blockquote>
            </figure>
          </div>

        </div>
      </div>
    </section>
  );
};
