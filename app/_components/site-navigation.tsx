import Link from "next/link";

import { DoodleUnderline } from "@/app/_components/doodles";

const navigationItems = [
  { href: "/stories", label: "Stories" },
  { href: "/places", label: "Places" },
  { href: "/map", label: "Map" },
  { href: "/themes", label: "Themes" },
  { href: "/search", label: "Search" },
  { href: "/about", label: "About" },
];

export function SiteNavigation() {
  return (
    <header className="global-header">
      <div className="global-header-inner">
        <Link className="site-wordmark" href="/" aria-label="FoodForFun Atlas home">
          <span>FoodForFun</span>
          <span className="site-wordmark-atlas">
            Atlas
            <DoodleUnderline className="site-wordmark-underline" />
          </span>
        </Link>
        <nav className="primary-navigation" aria-label="Primary navigation">
          <ul>
            {navigationItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
