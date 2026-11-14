"use client";

import { useState } from "react";

/** Visual sign-up block. Not wired to a provider yet. */
export function Newsletter() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section aria-labelledby="newsletter-title" className="bg-surface">
      <div className="container-narrow stack items-center gap-4 py-20 text-center lg:py-28">
        <h2 id="newsletter-title" className="text-2xl">
          Letters from the studio
        </h2>
        <p className="max-w-prose-sm text-muted">
          New collections, private sales and stories from our workshops, sent once a month.
        </p>

        {submitted ? (
          <p className="mt-6" role="status">
            Thank you. Please check your inbox to confirm.
          </p>
        ) : (
          <form
            className="mt-6 flex w-full max-w-md flex-col gap-4 sm:flex-row sm:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitted(true);
            }}
          >
            <label className="flex-1 text-left">
              <span className="sr-only">Email address</span>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="Email address"
                className="field"
              />
            </label>
            <button type="submit" className="btn btn-primary">
              Subscribe
            </button>
          </form>
        )}
        <p className="meta mt-2">You can unsubscribe at any time.</p>
      </div>
    </section>
  );
}
