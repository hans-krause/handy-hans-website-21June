import { Button } from "@/components/ui/button";
import { Check, Volume2, VolumeX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { courses } from "@/data/courses";
import sampleVideoAsset from "@/assets/handyhans-1to1-sample.mp4.asset.json";

export const Courses = () => {
  const navigate = useNavigate();
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
    if (video.paused) video.play().catch(() => {});
  };

  return (
    <section id="courses" className="py-24 bg-gradient-hero">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <span className="text-sm font-medium text-primary uppercase tracking-wider">English Classes</span>
          <h1 className="font-display text-3xl md:text-5xl font-semibold mt-3 mb-5">
            One-to-one or Group Classes
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Live coaching sessions with Hans – learn to communicate clearly<br />using the natural English you'll need for daily life.
          </p>
        </div>

        <div className="max-w-3xl mx-auto mb-16">
          <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-elevated bg-black">
            <video
              ref={videoRef}
              src={sampleVideoAsset.url}
              className="absolute inset-0 w-full h-full object-cover object-bottom"
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
              className="absolute top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold shadow-elevated hover:bg-primary/90 transition-all"
            >
              {muted ? (
                <>
                  <VolumeX className="h-4 w-4" />
                  Tap to listen
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4" />
                  Mute
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {courses.map((c) => (
            <div
              key={c.id}
              className={`relative p-8 rounded-3xl border transition-all hover:-translate-y-1 ${
                c.highlight
                  ? "bg-gradient-primary text-primary-foreground border-transparent shadow-glow"
                  : "bg-gradient-card border-border/60 shadow-soft hover:shadow-elevated"
              }`}
            >
              {c.id === "group-class" && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-background text-primary text-xs font-semibold uppercase tracking-wider shadow-soft border border-border/60">
                  Save my seat
                </span>
              )}
              <h2 className="font-display text-2xl font-semibold mb-1">{c.name}</h2>
              <p className={`text-sm mb-6 ${c.highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{c.tagline}</p>
              <div className="mb-6">
                {c.id === "group-class" ? (
                  <span className="font-display text-3xl font-semibold">$30 per month</span>
                ) : (
                  <span className="font-display text-5xl font-semibold">{c.price}</span>
                )}
              </div>
              <ul className="space-y-3 mb-8">
                {c.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className={`h-4 w-4 mt-0.5 shrink-0 ${c.highlight ? "text-primary-foreground" : "text-primary"}`} />
                    <span className={c.highlight ? "text-primary-foreground/95" : "text-foreground/80"}>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant={c.highlight ? "secondary" : "hero"}
                size="lg"
                className="w-full"
                onClick={() => navigate(c.id === "group-class" ? "/courses/group-class/overview" : `/courses/${c.id}`)}
              >
                Book now
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
