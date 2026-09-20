/** Bean Tradition brand header for the public tracking page. */
export function TrackingHeader() {
  return (
    <header className="flex flex-col items-center pt-8 text-center">
      <img
        src="/bean-tradition-logo.png"
        alt="Bean Tradition"
        className="h-20 w-auto object-contain"
      />
      <h1 className="mt-3 font-display text-2xl font-extrabold uppercase tracking-[0.2em] text-espresso">
        Bean Tradition
      </h1>
      <p className="text-sm font-medium text-mocha">Live order tracking</p>
    </header>
  );
}

export default TrackingHeader;
