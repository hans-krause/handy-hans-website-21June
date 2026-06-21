import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";
import ukCircle from "@/assets/uk-circle.png";

const links = [
  { href: "/about", label: "About" },
  { href: "/courses", label: "English Classes" },
  { href: "/free-pdf", label: "Free PDF" },
  { href: "/contact", label: "Contact" },
];

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-background/70 border-b border-border/50">
      <nav className="container flex h-16 items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-3 group min-w-0">
          <img src={ukCircle} alt="Union Jack" width={36} height={36} className="h-9 w-9 shrink-0 rounded-full object-cover shadow-soft" />
          <div className="flex flex-col leading-tight min-w-0">
            <span className="font-display text-lg font-semibold tracking-tight truncate">Handy Hans</span>
            <span className="text-xs text-muted-foreground truncate">Learn English</span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link key={l.href} to={l.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut}>Sign out</Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
          <Button variant="hero" size="sm" asChild>
            <Link to="/courses">Book a class</Link>
          </Button>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden flex items-center">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80%] sm:max-w-sm">
              <div className="mt-8 flex flex-col gap-1">
                {links.map((l) => (
                  <SheetClose asChild key={l.href}>
                    <Link
                      to={l.href}
                      className="px-3 py-3 rounded-md text-base text-foreground hover:bg-accent transition-colors"
                    >
                      {l.label}
                    </Link>
                  </SheetClose>
                ))}
                <div className="h-px bg-border my-3" />
                {user ? (
                  <>
                    <SheetClose asChild>
                      <Link to="/dashboard" className="px-3 py-3 rounded-md text-base text-foreground hover:bg-accent transition-colors">
                        Dashboard
                      </Link>
                    </SheetClose>
                    <button
                      onClick={() => { signOut(); setOpen(false); }}
                      className="px-3 py-3 rounded-md text-base text-left text-foreground hover:bg-accent transition-colors"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <SheetClose asChild>
                    <Link to="/auth" className="px-3 py-3 rounded-md text-base text-foreground hover:bg-accent transition-colors">
                      Sign in
                    </Link>
                  </SheetClose>
                )}
                <SheetClose asChild>
                  <Button variant="hero" className="mt-3" asChild>
                    <Link to="/courses">Book a class</Link>
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
};
