"use client";

import Link from "next/link";

type ErrorPageProps = {
  reset: () => void;
};

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <main className="error-page">
      <section
        className="error-content"
        role="alert"
        aria-labelledby="error-title"
      >
        <p className="eyebrow">FoodForFun Atlas</p>
        <h1 id="error-title">Something went wrong</h1>
        <p className="error-message">
          This part of the Atlas is temporarily unavailable. You can try again
          or return to the homepage.
        </p>
        <div className="error-actions">
          <button type="button" onClick={reset}>
            Try again
          </button>
          <Link href="/">Return to the homepage</Link>
        </div>
      </section>
    </main>
  );
}
