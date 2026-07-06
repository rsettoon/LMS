export default function Home() {
  const features = [
    {
      title: "Courses",
      description: "Organize lessons, modules, and materials in one place.",
    },
    {
      title: "Students",
      description: "Enroll learners and track their progress over time.",
    },
    {
      title: "Assessments",
      description: "Create quizzes and assignments with automatic grading.",
    },
  ];

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center">
        <span className="mb-4 rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Learning Management System
        </span>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Welcome to LMS
        </h1>
        <p className="mt-4 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
          A simple platform for creating courses, enrolling students, and
          tracking learning. This is the starting point — build from here.
        </p>
      </section>

      <section className="mx-auto grid max-w-4xl gap-6 px-6 pb-24 sm:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <h2 className="text-lg font-semibold">{feature.title}</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {feature.description}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}
