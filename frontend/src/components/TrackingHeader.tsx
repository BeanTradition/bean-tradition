/** Bean Tradition brand header for the public tracking page. */
export function TrackingHeader() {
  return (
    <header className="flex flex-col items-center pt-8 text-center">
      <img
        src="/bean-tradition-logo.png"
        alt="Bean Tradition"
        className="h-24 w-auto object-contain"
      />
      <p className="mt-3 text-sm font-medium text-mocha">Live order tracking</p>
    </header>
  );
}

export default TrackingHeader;
