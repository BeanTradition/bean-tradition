import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-6xl font-extrabold text-espresso">404</p>
      <h1 className="mt-2 text-xl font-bold text-bean">Page not found</h1>
      <p className="mt-2 text-mocha">The page you are looking for does not exist.</p>
      <Link to="/place-order" className="btn btn-primary btn-lg mt-6">
        Go to Place order
      </Link>
    </div>
  );
}

export default NotFound;
