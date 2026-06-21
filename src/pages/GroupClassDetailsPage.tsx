import { Link } from "react-router-dom";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Seo } from "@/components/site/Seo";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check } from "lucide-react";

const modules = [
  {
    title: "Module 1 — British pronunciation foundations",
    points: [
      "Key British vowel sounds vs. American equivalents",
      "Connected speech, linking and weak forms",
      "Intonation patterns for natural-sounding speech",
    ],
  },
  {
    title: "Module 2 — Fixing common English errors",
    points: [
      "Articles (a / an / the) and countable vs. uncountable nouns",
      "Prepositions that learners get wrong most often",
      "Tense slip-ups: present perfect vs. past simple",
    ],
  },
  {
    title: "Module 3 — Vocabulary for confident conversation",
    points: [
      "High-frequency phrasal verbs in everyday British English",
      "Collocations that make you sound fluent",
      "Idioms and expressions you'll actually hear",
    ],
  },
  {
    title: "Module 4 — Speaking with clarity and confidence",
    points: [
      "Structuring opinions, agreeing and disagreeing politely",
      "Storytelling: keeping your listener engaged",
      "Small talk, work conversations and social situations",
    ],
  },
  {
    title: "Module 5 — Listening and real-world English",
    points: [
      "Understanding fast native speech and different accents",
      "Working with British TV, podcasts and interviews",
      "Note-taking and summarising what you hear",
    ],
  },
  {
    title: "Module 6 — Putting it all together",
    points: [
      "Mock conversations and role-plays",
      "Personalised feedback in your two 1-to-1 sessions",
      "A clear plan for continuing toward C1",
    ],
  },
];

const GroupClassDetailsPage = () => (
  <main className="min-h-screen bg-background">
    <Seo
      title="Group Class Details — Course modules & format | Handy Hans"
      description="What you'll cover in Hans's live group English class: British pronunciation, common-error fixes, conversation vocabulary and weekly speaking practice."
      path="/courses/group-class/details"
    />
    <Navbar />
    <div className="pt-28 pb-20">
      <div className="container max-w-4xl">
        <Link
          to="/courses/group-class/overview"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to overview
        </Link>

        <span className="text-sm font-medium text-primary uppercase tracking-wider">
          Course material
        </span>
        <h1 className="font-display text-3xl md:text-5xl font-semibold mt-3 mb-4">
          British English Intermediate — what you'll cover
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed mb-10">
          Eight live lessons designed to take you from a solid B1 to a confident B2 / C1.
          Each week builds on the last, mixing pronunciation, grammar fixes, vocabulary and
          plenty of speaking practice.
        </p>

        <div className="space-y-6">
          {modules.map((m) => (
            <div
              key={m.title}
              className="rounded-2xl border border-border/60 bg-gradient-card p-6 shadow-soft"
            >
              <h2 className="font-display text-xl font-semibold mb-4">{m.title}</h2>
              <ul className="space-y-2">
                {m.points.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-foreground/85">
                    <Check className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
          <Button asChild variant="hero" size="lg">
            <Link to="/courses/group-class">Book now</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/courses/group-class/overview">Back to overview</Link>
          </Button>
        </div>
      </div>
    </div>
    <Footer />
  </main>
);

export default GroupClassDetailsPage;
