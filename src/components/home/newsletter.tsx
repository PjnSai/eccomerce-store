"use client";

import { useActionState } from "react";
import { subscribeToNewsletter, type NewsletterState } from "@/app/actions/newsletter";
import { MAX_EMAIL_LENGTH } from "@/lib/validation";

const initialState: NewsletterState = { status: "idle" };

/**
 * Newsletter sign-up. The form posts to a Server Action, so it submits as POST
 * even before JavaScript loads; the address is never put in the URL.
 */
export function Newsletter() {
  const [state, formAction, pending] = useActionState(subscribeToNewsletter, initialState);

  return (
    <section aria-labelledby="newsletter-title" className="bg-surface">
      <div className="container-narrow stack items-center gap-4 py-20 text-center lg:py-28">
        <h2 id="newsletter-title" className="text-2xl">
          Letters from the studio
        </h2>
        <p className="max-w-prose-sm text-muted">
          New collections, private sales and stories from our workshops, sent once a month.
        </p>

        {state.status === "success" ? (
          <p className="mt-6" role="status">
            Thank you. If this address can receive our letters, a confirmation email is on its way.
          </p>
        ) : (
          <form
            action={formAction}
            className="mt-6 flex w-full max-w-md flex-col gap-4 sm:flex-row sm:items-end"
          >
            <label className="flex-1 text-left">
              <span className="sr-only">Email address</span>
              <input
                type="email"
                name="email"
                required
                maxLength={MAX_EMAIL_LENGTH}
                autoComplete="email"
                inputMode="email"
                spellCheck={false}
                placeholder="Email address"
                className="field"
                aria-invalid={state.status === "invalid" ? true : undefined}
                aria-describedby={state.status !== "idle" ? "newsletter-message" : undefined}
              />
            </label>
            {/* Honeypot for bots: hidden from people and assistive technology. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label>
                Company
                <input type="text" name="company" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? "Subscribing…" : "Subscribe"}
            </button>
          </form>
        )}

        {state.status === "invalid" && (
          <p id="newsletter-message" className="text-sm text-danger" role="alert">
            Please enter a valid email address.
          </p>
        )}
        {state.status === "limited" && (
          <p id="newsletter-message" className="text-sm text-danger" role="alert">
            Too many attempts. Please try again in a few minutes.
          </p>
        )}
        <p className="meta mt-2">You can unsubscribe at any time.</p>
      </div>
    </section>
  );
}
