import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | FoodForFun Atlas",
  description:
    "Learn how FoodForFun Atlas documents people, work, places, and communities through food.",
};

const correctionUrl =
  "https://github.com/FoodForFun/FoodForFun-Atlas/issues/new?title=Correction%3A%20";

export default function AboutPage() {
  return (
    <main className="site-shell about-page">
      <header className="about-hero">
        <div>
          <p className="eyebrow">About the Atlas</p>
          <h1>Food is where the record begins.</h1>
        </div>
        <div className="about-lede">
          <p className="statement">
            FoodForFun Atlas records the people, work, places, and communities
            that exist around food.
          </p>
          <p>
            It is not a restaurant ranking or review platform. It is a
            documentary knowledge project built from specific Stories and the
            relationships around them.
          </p>
        </div>
      </header>

      <section className="about-section" aria-labelledby="why-food-heading">
        <div className="about-section-heading">
          <p className="eyebrow">Why food?</p>
          <h2 id="why-food-heading">An everyday way to understand people.</h2>
        </div>
        <div className="about-section-content">
          <p>
            Food carries memory, migration, work, family life, trade, belief,
            and change. Beginning with a meal, ingredient, shop, or kitchen can
            reveal how people build a life and how communities connect.
          </p>
          <p>
            Food is the starting point, not the limit. The Atlas follows the
            human story without turning it into a score, recommendation, or
            tourism directory.
          </p>
        </div>
      </section>

      <section className="about-section" aria-labelledby="work-heading">
        <div className="about-section-heading">
          <p className="eyebrow">How we work</p>
          <h2 id="work-heading">Collect, connect, review, publish.</h2>
        </div>
        <div className="about-section-content">
          <p>
            A Story begins with source material such as a video, interview,
            article, field note, or other documented record. Editors preserve
            the source, identify relevant Places and Themes, check the account,
            and review the public Story before publication.
          </p>
          <ul className="about-principles">
            <li>
              Describe people and cultures with care, context, and respect.
            </li>
            <li>Separate documented facts from interpretation.</li>
            <li>
              Keep uncertainty visible instead of filling gaps with guesses.
            </li>
            <li>Prefer useful connections over rankings or stereotypes.</li>
          </ul>
        </div>
      </section>

      <section className="about-section" aria-labelledby="sources-heading">
        <div className="about-section-heading">
          <p className="eyebrow">Sources and transparency</p>
          <h2 id="sources-heading">The evidence stays connected.</h2>
        </div>
        <div className="about-section-content">
          <p>
            Published Stories identify the public-safe source information used
            to prepare them when that information is available and appropriate.
            Original records, transcripts, rights notes, and internal review
            details may be retained privately and are never made public merely
            because they exist in the editorial system.
          </p>
          <p>
            A source supports a Story; it does not remove the need for editorial
            judgment, context, or later correction.
          </p>
        </div>
      </section>

      <section className="about-section" aria-labelledby="privacy-heading">
        <div className="about-section-heading">
          <p className="eyebrow">Privacy</p>
          <h2 id="privacy-heading">Publish only justified precision.</h2>
        </div>
        <div className="about-section-content">
          <p>
            The Atlas may describe a Place at country, region, city,
            neighborhood, or exact precision. Editors should publish only the
            level needed to understand the Story. Private homes, sensitive
            workplaces, and locations that could create risk can be generalized
            or hidden.
          </p>
          <p>
            Personal or private information is not public simply because it can
            be found elsewhere.
          </p>
        </div>
      </section>

      <section className="about-section" aria-labelledby="technology-heading">
        <div className="about-section-heading">
          <p className="eyebrow">Technology and AI</p>
          <h2 id="technology-heading">
            Tools can assist. People remain responsible.
          </h2>
        </div>
        <div className="about-section-content">
          <p>
            Technology and AI may help with transcription, translation,
            organization, research, or drafting. Their output is treated as a
            suggestion, not as verified fact. A person reviews material before
            publication and remains responsible for the final editorial choice.
          </p>
        </div>
      </section>

      <section
        className="about-section about-corrections"
        aria-labelledby="corrections-heading"
      >
        <div className="about-section-heading">
          <p className="eyebrow">Corrections</p>
          <h2 id="corrections-heading">Help us keep the record accurate.</h2>
        </div>
        <div className="about-section-content">
          <p>
            Please report factual errors, incorrect names, location concerns,
            rights concerns, outdated business information, or privacy issues
            through a public correction Issue in the project repository.
          </p>
          <a
            className="correction-link"
            href={correctionUrl}
            rel="noreferrer"
            target="_blank"
          >
            Open a correction Issue
          </a>
          <p className="about-note">
            Do not include private addresses, personal contact details, or other
            sensitive evidence in a public Issue. For a sensitive concern,
            describe only the affected Atlas page and request a private
            follow-up.
          </p>
        </div>
      </section>
    </main>
  );
}
