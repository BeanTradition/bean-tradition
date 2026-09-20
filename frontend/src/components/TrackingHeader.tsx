/** Bean Tradition brand header for the public tracking page. */
export function TrackingHeader() {
  return (
    <header className="flex flex-col items-center pt-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-espresso text-3xl">
        ☕
      </div>
      <h1 className="mt-3 font-display text-2xl font-extrabold uppercase tracking-[0.2em] text-espresso">
        Bean Tradition
      </h1>
      <p className="text-sm font-medium text-mocha">Live order tracking</p>
    </header>
  );
}

export default TrackingHeader;
