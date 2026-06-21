import { Heart, Globe, MessageCircle, Trophy } from "lucide-react";
import hansTeaching from "@/assets/hans-teaching.jpg";
import heroImage from "@/assets/hero-hans.jpeg";

const features = [
  { icon: Heart, title: "Patient & friendly", desc: "I keep my classes enjoyable yet target-oriented. Mistakes are part of learning – they are expected, inspected, and corrected." },
  { icon: MessageCircle, title: "Real conversations", desc: "Practice the English you'll actually use day-to-day, and learn useful natural phrases. Lots of speaking – practice makes perfect!" },
  { icon: Globe, title: "Learners worldwide", desc: "Join my global community of students from around the world – all time zones welcome." },
  { icon: Trophy, title: "Real results", desc: "From hesitant to fluent – with dedicated session notes, consistent reviewing and progress tracking, you'll see real results." },
];

export const About = () => {
  return (
    <section id="about" className="py-24 bg-gradient-hero">
      <div className="container">
        {/* Section heading */}
        <div className="max-w-2xl mx-auto text-center mb-12">
          <span className="text-sm font-medium text-primary uppercase tracking-wider">About me</span>
          <h2 className="font-display text-3xl md:text-5xl font-semibold mt-3 mb-4">
            Hi, I'm Hans
            <span className="block text-xl md:text-2xl text-muted-foreground font-normal mt-2">
              Welcome to Handy Hans English
            </span>
          </h2>
        </div>

        {/* Images + bio side-by-side */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-5 gap-10 items-center mb-20">
          <div className="md:col-span-3 flex flex-col">
            <div className="w-[92%] self-start rounded-3xl overflow-hidden shadow-elevated z-0">
              <img
                src={heroImage}
                alt="Hans, friendly English tutor, smiling in the rice fields of Vietnam"
                className="w-full h-64 md:h-72 object-cover object-top"
                loading="lazy"
              />
            </div>
            <div className="w-[88%] self-end -mt-16 md:-mt-20 rounded-3xl overflow-hidden shadow-elevated border-4 border-background z-10 relative">
              <img
                src={hansTeaching}
                alt="Hans teaching English vocabulary to a group of students in a classroom"
                className="w-full h-64 md:h-72 object-cover"
                loading="lazy"
              />
            </div>
          </div>
          <div className="md:col-span-2 text-muted-foreground text-lg leading-relaxed space-y-4">
            <p>
              A native British English teacher, I have been teaching internationally for
              more than a decade.
            </p>
            <p>
              You may have seen my English teaching videos – now you can also be my student in 1:1 or small group classes online, wherever you are in the world!
            </p>
            <p>
              My page name is Handy Hans. The English adjective <em>handy</em> means useful or
              convenient. Whether you need English for business, travel, accent training or
              confident speaking, I hope to <em>come in handy</em>.
            </p>
          </div>
        </div>

        {/* What you can expect */}
        <div className="max-w-2xl mx-auto text-center mb-10">
          <h2 className="font-display text-2xl md:text-3xl font-semibold">What you can expect</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 rounded-2xl bg-gradient-card border border-border/60 shadow-soft hover:shadow-elevated transition-all hover:-translate-y-1">
              <div className="h-11 w-11 rounded-xl bg-primary-soft flex items-center justify-center mb-4">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
