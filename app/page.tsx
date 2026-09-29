import Link from "next/link";

export default function Home() {
  return (
    <main className="overflow-hidden bg-white text-slate-950">
      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="relative overflow-hidden bg-slate-950 text-white">
        {/* BACKGROUND EFFECTS */}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <div className="cf-hero-glow absolute -left-32 top-20 h-[420px] w-[420px] rounded-full bg-blue-600/20 blur-[120px]" />

          <div className="cf-hero-glow-delayed absolute right-[-100px] top-[240px] h-[500px] w-[500px] rounded-full bg-indigo-500/15 blur-[140px]" />

          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.045)_1px,transparent_1px)] bg-[size:64px_64px]" />

          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 to-transparent" />
        </div>

        {/* NAV */}

        <header className="relative z-20">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10">
                <span className="text-sm font-semibold text-blue-300">C</span>
              </div>

              <span className="font-semibold tracking-tight text-white">
                CampusFlow
              </span>
            </Link>

            <nav className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="hidden rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white sm:inline-flex"
              >
                Sign in
              </Link>

              <Link
                href="/auth/sign-up"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
              >
                Get started
                <ArrowRightIcon />
              </Link>
            </nav>
          </div>
        </header>

        {/* HERO CONTENT */}

        <div className="relative z-10 mx-auto grid min-h-[760px] max-w-7xl items-center gap-16 px-5 pb-24 pt-16 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:pb-28 lg:pt-20">
          {/* LEFT */}

          <div className="max-w-2xl">
            <div className="cf-fade-up-1 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-xs font-medium text-blue-300">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              Academic progress, organized
            </div>

            <h1 className="cf-fade-up-2 mt-7 text-5xl font-semibold leading-[1.02] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
              Your academic work,
              <span className="block bg-gradient-to-r from-blue-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                finally in one flow.
              </span>
            </h1>

            <p className="cf-fade-up-3 mt-7 max-w-xl text-lg leading-8 text-slate-300 sm:text-xl">
              Plan assignments, track progress, collaborate with classmates, and
              get help when you need it — without losing control of what you
              share.
            </p>

            <div className="cf-fade-up-4 mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/auth/sign-up"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-100"
              >
                Start using CampusFlow
                <ArrowRightIcon />
              </Link>

              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900/50 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-slate-600 hover:bg-slate-900"
              >
                Sign in
              </Link>
            </div>

            <div className="cf-fade-up-5 mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-400">
              <MiniCheck text="Assignment tracking" />
              <MiniCheck text="Course Spaces" />
              <MiniCheck text="Private by default" />
            </div>
          </div>

          {/* PRODUCT MOCKUP */}

          <div className="relative mx-auto w-full max-w-2xl lg:mx-0">
            <div className="cf-float-slow absolute -left-4 top-20 z-20 hidden rounded-xl border border-slate-700/70 bg-slate-900/90 p-4 shadow-2xl backdrop-blur md:block">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
                Progress
              </p>

              <div className="mt-2 flex items-end gap-2">
                <span className="text-2xl font-semibold">72%</span>

                <span className="pb-1 text-xs text-emerald-400">On track</span>
              </div>
            </div>

            <div className="cf-float-reverse absolute -right-3 bottom-24 z-20 hidden w-52 rounded-xl border border-slate-700/70 bg-slate-900/90 p-4 shadow-2xl backdrop-blur md:block">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400/10 text-xs font-semibold text-amber-300">
                  H
                </div>

                <div>
                  <p className="text-xs font-medium">Help offered</p>

                  <p className="mt-0.5 text-[11px] text-slate-500">
                    A classmate can help
                  </p>
                </div>
              </div>
            </div>

            <div className="cf-product-enter relative overflow-hidden rounded-[28px] border border-slate-700/70 bg-slate-900/75 p-3 shadow-[0_35px_100px_rgba(0,0,0,0.45)] backdrop-blur">
              {/* BROWSER FRAME */}

              <div className="overflow-hidden rounded-[22px] border border-slate-800 bg-slate-50">
                <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                  </div>

                  <div className="rounded-full bg-slate-100 px-4 py-1 text-[10px] text-slate-400">
                    campusflow.app/tasks
                  </div>

                  <div className="w-10" />
                </div>

                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-medium text-blue-600">
                        Assignments
                      </p>

                      <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
                        Academic Tasks
                      </h2>
                    </div>

                    <div className="rounded-lg bg-slate-950 px-3 py-2 text-[10px] font-medium text-white">
                      + Add assignment
                    </div>
                  </div>

                  {/* MINI SUMMARY */}

                  <div className="mt-5 grid grid-cols-4 gap-2">
                    <MockStat label="To Do" value="3" />
                    <MockStat label="Active" value="2" />
                    <MockStat label="Review" value="1" />
                    <MockStat label="Done" value="8" />
                  </div>

                  {/* BOARD */}

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <MockColumn title="To Do" count="3">
                      <MockTask
                        course="ML401"
                        title="Research Paper"
                        progress={35}
                        priority="High"
                      />

                      <MockTask
                        course="DB201"
                        title="SQL Practice"
                        progress={0}
                        priority="Medium"
                      />
                    </MockColumn>

                    <MockColumn title="In Progress" count="2">
                      <MockTask
                        course="SE310"
                        title="Project Proposal"
                        progress={72}
                        priority="High"
                        animated
                      />
                    </MockColumn>

                    <MockColumn title="Review" count="1">
                      <MockTask
                        course="ML401"
                        title="Model Evaluation"
                        progress={92}
                        priority="Low"
                      />
                    </MockColumn>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM MESSAGE */}

        <div className="relative z-10 mx-auto max-w-7xl px-5 pb-12 sm:px-6 lg:px-8">
          <div className="border-t border-slate-800/80 pt-7">
            <p className="text-center text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Built around the way students actually manage academic work
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          PRODUCT VALUE
      ====================================================== */}

      <section className="bg-white py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-blue-600">
              One academic workspace
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-5xl">
              Less switching.
              <br />
              More progress.
            </h2>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              CampusFlow connects the pieces of student life that are usually
              scattered across notes, chats, task boards, and class groups.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              number="01"
              title="Assignments"
              description="Organize work by course, deadline, priority, status, and progress."
            />

            <FeatureCard
              number="02"
              title="Course Spaces"
              description="Connect with the right classmates without mixing different classes that happen to share a course code."
            />

            <FeatureCard
              number="03"
              title="Progress"
              description="Track work manually or let checklists calculate completion automatically."
            />

            <FeatureCard
              number="04"
              title="Need Help"
              description="Signal when you are stuck and let eligible classmates offer support."
            />

            <FeatureCard
              number="05"
              title="Friends"
              description="Build academic connections and share selected progress without creating manual social posts."
            />

            <FeatureCard
              number="06"
              title="Activity"
              description="Important academic activity appears automatically as your work moves forward."
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          WORKFLOW
      ====================================================== */}

      <section className="border-y border-slate-200 bg-slate-50 py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-semibold text-blue-600">
              A clearer workflow
            </p>

            <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-5xl">
              From assignment to submission.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              CampusFlow keeps the academic lifecycle visible instead of burying
              it inside disconnected tools.
            </p>
          </div>

          <div className="relative mt-16">
            <div className="absolute left-[12.5%] right-[12.5%] top-7 hidden h-px bg-slate-300 lg:block" />

            <div className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <WorkflowStep
                number="1"
                title="Plan"
                text="Add assignments, priorities, deadlines, and course context."
              />

              <WorkflowStep
                number="2"
                title="Work"
                text="Move tasks through your board and track checklist progress."
              />

              <WorkflowStep
                number="3"
                title="Collaborate"
                text="Share selectively and ask classmates for help when needed."
              />

              <WorkflowStep
                number="4"
                title="Submit"
                text="Complete the work with a clear record of progress."
              />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          HELP / SOCIAL
      ====================================================== */}

      <section className="bg-white py-24 sm:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 sm:px-6 lg:grid-cols-2 lg:px-8">
          {/* UI */}

          <div className="order-2 lg:order-1">
            <div className="relative rounded-[28px] border border-slate-200 bg-slate-50 p-5 shadow-sm sm:p-7">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                      ML401 · Machine Learning
                    </p>

                    <h3 className="mt-2 font-semibold text-slate-950">
                      Model Evaluation Report
                    </h3>
                  </div>

                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                    Need Help
                  </span>
                </div>

                <div className="mt-5">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Progress</span>
                    <span>64%</span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="cf-progress-demo h-full w-[64%] rounded-full bg-slate-950" />
                  </div>
                </div>
              </div>

              <div className="cf-float-soft ml-auto mt-5 max-w-sm rounded-2xl border border-blue-100 bg-white p-5 shadow-lg shadow-blue-950/5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-600">
                    A
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Alex offered help
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Machine Learning Course Space
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <div className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-medium text-white">
                    Accept
                  </div>

                  <div className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600">
                    Decline
                  </div>
                </div>
              </div>

              <div className="mt-5 max-w-md rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-medium text-slate-400">Help Room</p>

                <div className="mt-4 space-y-3">
                  <ChatBubble
                    side="left"
                    text="Which part of the evaluation is blocking you?"
                  />

                  <ChatBubble
                    side="right"
                    text="I'm still unsure how to explain the confusion matrix."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* COPY */}

          <div className="order-1 lg:order-2">
            <p className="text-sm font-semibold text-blue-600">
              Collaboration with context
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-5xl">
              Ask for help without turning your coursework into a group chat.
            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-600">
              Mark an assignment when you need support. Eligible friends or
              classmates can offer help, and an accepted session gets its own
              focused Help Room.
            </p>

            <div className="mt-8 space-y-4">
              <Benefit text="Help stays attached to the assignment." />
              <Benefit text="Only the accepted helper enters the Help Room." />
              <Benefit text="Completed sessions become read-only." />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          PRIVACY
      ====================================================== */}

      <section className="bg-slate-950 py-24 text-white sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold text-blue-400">
              Share intentionally
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Your progress does not have to be public.
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-400">
              Every assignment can use the visibility level that makes sense for
              that work.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            <PrivacyCard
              label="Private"
              title="Just for you"
              description="Keep an assignment and its progress visible only to your own account."
            />

            <PrivacyCard
              label="Friends"
              title="Share with connections"
              description="Let accepted friends see selected academic progress in their feed and your profile."
            />

            <PrivacyCard
              label="Course"
              title="Share with your class"
              description="Show work only to members of the exact Course Space connected to that course."
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          COURSE SPACE
      ====================================================== */}

      <section className="bg-white py-24 sm:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold text-blue-600">Course Spaces</p>

            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-5xl">
              Same course.
              <br />
              Right classroom.
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              A course code alone does not define who belongs in your class.
              Course Spaces create a specific academic circle with its own
              invite code and members.
            </p>

            <div className="mt-8 space-y-4">
              <Benefit text="Your personal course remains yours." />
              <Benefit text="Shared progress stays scoped to the exact Course Space." />
              <Benefit text="Leaving a space does not delete your assignments." />
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 sm:p-7">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-blue-600">
                  Course Space
                </p>

                <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-950">
                      Machine Learning
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      ML401 · 8 members
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600">
                    Invite: 8F3A12CD
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <Member name="Nadia" progress="84%" />
                <Member name="Alex" progress="61%" />
                <Member name="Jordan" progress="48%" />
                <Member name="Maya" progress="92%" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FINAL CTA
      ====================================================== */}

      <section className="bg-slate-50 px-5 py-24 sm:px-6 sm:py-28 lg:px-8">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-slate-950 px-6 py-16 text-center text-white sm:px-12 sm:py-20">
          <div aria-hidden="true" className="absolute inset-0">
            <div className="absolute left-1/2 top-[-240px] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-blue-500/20 blur-[120px]" />

            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.04)_1px,transparent_1px)] bg-[size:56px_56px]" />
          </div>

          <div className="relative">
            <p className="text-sm font-semibold text-blue-400">
              Your semester, in one flow
            </p>

            <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Ready to organize your academic work?
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-400">
              Start with your courses, add your assignments, and let CampusFlow
              keep the rest connected.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/auth/sign-up"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-100"
              >
                Create an account
                <ArrowRightIcon />
              </Link>

              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-900"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="font-semibold text-slate-950">CampusFlow</p>

            <p className="mt-1 text-sm text-slate-500">
              Academic progress, organized.
            </p>
          </div>

          <div className="flex items-center gap-5 text-sm">
            <Link
              href="/auth/login"
              className="text-slate-500 transition hover:text-slate-950"
            >
              Sign in
            </Link>

            <Link href="/auth/sign-up" className="font-medium text-slate-950">
              Create account
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M4 10h11m-4-4 4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MiniCheck({ text }: { text: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-400">
        <svg
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          className="h-3 w-3"
        >
          <path
            d="m4 8 2.4 2.4L12 5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      {text}
    </span>
  );
}

function MockStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2.5">
      <p className="text-[9px] text-slate-400">{label}</p>

      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function MockColumn({
  title,
  count,
  children,
}: {
  title: string;
  count: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-semibold text-slate-700">{title}</p>

        <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[8px] text-slate-500">
          {count}
        </span>
      </div>

      <div className="space-y-2">{children}</div>
    </div>
  );
}

function MockTask({
  course,
  title,
  progress,
  priority,
  animated = false,
}: {
  course: string;
  title: string;
  progress: number;
  priority: string;
  animated?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">
        {course}
      </p>

      <p className="mt-1.5 text-[11px] font-semibold leading-4 text-slate-900">
        {title}
      </p>

      <div className="mt-3">
        <div className="flex justify-between text-[8px] text-slate-400">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>

        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full bg-slate-900 ${
              animated ? "cf-progress-animated" : ""
            }`}
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-3">
        <span
          className={`rounded-full px-2 py-1 text-[8px] font-medium ${
            priority === "High"
              ? "bg-rose-50 text-rose-600"
              : priority === "Medium"
                ? "bg-amber-50 text-amber-700"
                : "bg-slate-100 text-slate-500"
          }`}
        >
          {priority}
        </span>
      </div>
    </div>
  );
}

function FeatureCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-900/[0.04]">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-500 transition group-hover:bg-slate-950 group-hover:text-white">
        {number}
      </div>

      <h3 className="mt-6 text-lg font-semibold text-slate-950">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
}

function WorkflowStep({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="relative text-center">
      <div className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-slate-300 bg-white text-sm font-semibold text-slate-950 shadow-sm">
        {number}
      </div>

      <h3 className="mt-5 font-semibold text-slate-950">{title}</h3>

      <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">
        {text}
      </p>
    </div>
  );
}

function Benefit({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <svg
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          className="h-3.5 w-3.5"
        >
          <path
            d="m4 8 2.4 2.4L12 5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <p className="text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}

function ChatBubble({ side, text }: { side: "left" | "right"; text: string }) {
  return (
    <div
      className={`max-w-[85%] rounded-xl px-3 py-2.5 text-xs leading-5 ${
        side === "right"
          ? "ml-auto bg-slate-950 text-white"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {text}
    </div>
  );
}

function PrivacyCard({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-slate-700 hover:bg-slate-900">
      <span className="inline-flex rounded-full border border-blue-400/20 bg-blue-400/10 px-2.5 py-1 text-xs font-medium text-blue-300">
        {label}
      </span>

      <h3 className="mt-5 text-lg font-semibold">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </article>
  );
}

function Member({ name, progress }: { name: string; progress: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-700 shadow-sm">
          {name.charAt(0)}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-900">{name}</p>

          <p className="mt-0.5 text-xs text-slate-400">Shared progress</p>
        </div>

        <span className="text-sm font-semibold text-slate-700">{progress}</span>
      </div>
    </div>
  );
}
