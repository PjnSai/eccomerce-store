import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container-narrow section-xl stack items-center gap-4 text-center">
      <p className="meta">404</p>
      <h1 className="text-2xl">This page could not be found</h1>
      <p className="max-w-prose-sm text-muted">
        The piece you are looking for may have sold out or moved.
      </p>
      <Link href="/" className="btn btn-secondary mt-4">
        Return to the homepage
      </Link>
    </section>
  );
}
