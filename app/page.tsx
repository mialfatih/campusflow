import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-20">
        <div className="max-w-3xl">
          <p className="mb-5 text-sm font-medium uppercase tracking-[0.2em] text-blue-400">
            CampusFlow
          </p>

          <h1 className="text-5xl font-semibold leading-tight tracking-tight md:text-7xl">
            Keep your academic work moving.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Track assignments, organize courses, share meaningful progress with
            friends, and get help when you are stuck.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/auth/sign-up"
              className="rounded-lg bg-white px-6 py-3 font-medium text-slate-950 transition hover:bg-slate-200"
            >
              Create account
            </Link>

            <Link
              href="/auth/login"
              className="rounded-lg border border-slate-700 px-6 py-3 font-medium transition hover:border-slate-500 hover:bg-slate-900"
            >
              Sign in
            </Link>
          </div>
        </div>

        <div className="mt-24 grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-lg font-medium">Track assignments</h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Organize academic work by course, deadline, priority, and
              progress.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-lg font-medium">Share progress</h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Let friends see meaningful academic progress without creating
              social posts.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-lg font-medium">Ask for help</h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Mark an assignment when you are stuck so classmates can offer
              support.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
