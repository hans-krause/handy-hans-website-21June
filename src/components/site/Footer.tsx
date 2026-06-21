import { Instagram, Youtube, Facebook } from "lucide-react";
import ukCircle from "@/assets/uk-circle.png";

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.93a8.16 8.16 0 0 0 4.77 1.52V7a4.85 4.85 0 0 1-1.84-.31z" />
  </svg>
);

const socials = [
  { href: "https://www.youtube.com/@handy_hans", label: "YouTube", icon: Youtube },
  { href: "https://www.instagram.com/handy_hans_/", label: "Instagram", icon: Instagram },
  { href: "https://www.facebook.com/handy.hansUK", label: "Facebook", icon: Facebook },
  { href: "https://www.tiktok.com/@handy_hans", label: "TikTok", icon: TikTokIcon },
];

export const Footer = () => {
  return (
    <footer id="contact" className="border-t border-border/60 bg-gradient-hero">
      <div className="container py-16">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={ukCircle} alt="Union Jack" width={36} height={36} className="h-9 w-9 rounded-full object-cover shadow-soft" />
              <span className="font-display text-lg font-semibold">Handy Hans</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Online British English coaching
            </p>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold mb-4 uppercase tracking-wider">Follow along</h4>
            <p className="text-sm text-muted-foreground mb-4">Daily English tips, lessons, and world exploration. ...</p>
            <div className="flex gap-3">
              {socials.map(({ href, label, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="h-11 w-11 rounded-full bg-primary-soft text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-soft"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold mb-4 uppercase tracking-wider">CONTACT</h4>
            <p className="text-sm text-muted-foreground mb-2">{"\n"}</p>
            <a href="mailto:hello@handyhansenglish.com" className="text-sm text-primary hover:underline">hello@handyhansenglish.com</a>
          </div>
        </div>

        <div className="pt-8 border-t border-border/60 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Handy Hans English. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-primary transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
