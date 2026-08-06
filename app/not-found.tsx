import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <section className="not-found-content" aria-labelledby="not-found-title">
        <p className="eyebrow">FoodForFun Atlas</p>
        <h1 id="not-found-title">Story not found</h1>
        <p className="not-found-message">
          This Story is not available. It may have moved or may not be part of
          the public Atlas.
        </p>
        <Link className="not-found-link" href="/">
          <span aria-hidden="true">←</span> Return to the homepage
        </Link>
      </section>
    </main>
  );
}
