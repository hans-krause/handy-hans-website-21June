export type Course = {
  id: string;
  name: string;
  price: string;
  cents: number;
  tagline: string;
  features: string[];
  highlight?: boolean;
  description: string;
  details: string[];
  whoFor: string[];
  format: string;
};

export const courses: Course[] = [
  {
    id: "group-class",
    name: "Group Classes",
    price: "$60",
    cents: 6000,
    tagline: "Learn with others",
    highlight: true,
    features: [
      "Live on Zoom",
      "Small groups",
      "60-minute weekly classes",
      "New topics every week",
      "See schedule below",
    ],
    description:
      "A monthly subscription to small-group Dutch classes. Practice with other learners at your level in a relaxed, conversation-focused setting led by Hans.",
    details: [
      "4 group classes per month (1 per week)",
      "Maximum 5 students per class for plenty of speaking time",
      "Themed conversation topics — travel, work, culture, current events",
      "Multiple timeslots throughout the week to fit your schedule",
      "Cancel your subscription anytime",
    ],
    whoFor: [
      "Learners who already know the basics (A1+)",
      "Anyone who wants to build speaking confidence",
      "People who learn better with peers",
    ],
    format: "Monthly subscription. 4 × 60-minute group classes per month.",
  },
  {
    id: "single-1on1",
    name: "1:1 Single Class",
    price: "$45",
    cents: 4500,
    tagline: "Try a private lesson",
    features: [
      "60-minute private session",
      "Tailored to your level",
      "Personal feedback notes",
      "Flexible scheduling",
      "1st lesson bonus: free 15-min intro + personalised plan",
    ],
    description:
      "A single, focused 1:1 lesson with Hans. Perfect if you want to test the waters, prepare for a trip, or work on a specific topic without committing to a package.",
    details: [
      "60 minutes of dedicated 1:1 time over video call",
      "Booking flexibility",
      "Lesson plan based on your goals – grammar, pronunciation, exam prep, or just practise conversation skills",
      "Personal feedback notes sent after the lesson",
      "First lesson bonus: free extra 15-minute intro and assessment (Total: 75 mins)",
    ],
    whoFor: [
      "No prerequisite: all levels of English welcome",
      "Open to both adults and younger learners",
      "Please note: while I am well-versed in American English, my teaching practice primarily focuses on British English",
    ],
    format: "Single 60-minute session, scheduled at a time that works for you.",
  },
  {
    id: "ten-pack",
    name: "10-Session Pack",
    price: "$399",
    cents: 39900,
    tagline: "Consistent learner",
    
    features: [
      "10 × 60-minute private 1:1 lessons",
      "Personalised learning plan",
      "Priority booking",
      "Homework (optional)",
      "Progress tracking",
    ],
    description:
      "Ten private lessons with Hans – designed as a structured learning journey.",
    details: [
      "10 x 60-minute 1:1 lessons",
      "Personalised learning plan built around your level and goals",
      "Homework after each lesson (optional)",
      "Book the timeslots you want – reschedule up to 24 hours before",
      "Personal feedback notes provided to review in the next session",
    ],
    whoFor: [
      "Learners serious about reaching B1 / B2 / C1+",
      "Adults as well as younger learners",
      "Please note: while I am well-versed in American English, my teaching practice primarily focuses on British English",
    ],
    format: "10 sessions of 60 minutes, typically weekly. Use them within 6 months.",
  },
];

export const getCourseById = (id: string) => courses.find((c) => c.id === id);
