// Keep the existing Story page, public reads, not-found behavior and canonical URL.
export { default, generateMetadata } from "@/app/stories/[slug]/page";
export const dynamic = "force-dynamic";
