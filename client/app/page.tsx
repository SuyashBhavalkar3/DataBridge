export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 text-center text-white">
      <main className="w-full max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl shadow-black/30 backdrop-blur-md sm:p-14">
        <p className="mb-4 text-sm uppercase tracking-[0.4em] text-sky-300/90">
          Coming Soon
        </p>
        <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-6xl">
          DataBridge is launching shortly.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-zinc-300 sm:text-lg">
          We’re building a powerful data engineering platform to help teams connect, transform,
          and deliver data with confidence. Check back soon for updates.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <a
            href="#"
            className="inline-flex items-center justify-center rounded-full bg-sky-400 px-8 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
          >
            Notify me
          </a>
          <span className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-8 py-3 text-sm text-zinc-300">
            DataBridge by SuyashBhavalkar3
          </span>
        </div>
      </main>
    </div>
  );
}
