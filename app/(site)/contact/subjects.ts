export const SUBJECTS: Record<string, string> = {
  reserve: "Reserve a piece",
  question: "Question about a piece",
  waitlist: "Waitlist",
  notify: "Notify me when released",
  colour: "Order in another colour",
  custom: "Custom-made order",
  other: "Other",
};

export const subjectOptions = Object.entries(SUBJECTS).map(([value, label]) => ({ value, label }));
