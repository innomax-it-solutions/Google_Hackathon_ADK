import { Suspense, lazy } from "react";
import Navbar from "../components/layout/Navbar";
import Seo from "../components/seo/Seo";
import { organizationSchema, websiteSchema } from "../seo/schema";
import Hero from "../components/sections/Hero";
import TrustBar from "../components/sections/TrustBar";
import ScrollProgress from "../components/ui/ScrollProgress";
import BackToTop from "../components/ui/BackToTop";
import CursorGlow from "../components/ui/CursorGlow";
import SectionDivider from "../components/ui/SectionDivider";
import SectionSkeleton from "../components/ui/SectionSkeleton";

// Above-the-fold (Navbar + Hero) load eagerly; the rest are code-split and
// fetched as they approach the viewport to keep first paint fast.
const TrustedHospitals = lazy(() => import("../components/sections/TrustedHospitals"));
const PartnerLogos = lazy(() => import("../components/sections/PartnerLogos"));
const Accreditation = lazy(() => import("../components/sections/Accreditation"));
const HowItWorks = lazy(() => import("../components/sections/HowItWorks"));
const AIFeatures = lazy(() => import("../components/sections/AIFeatures"));
const JourneyPreview = lazy(() => import("../components/sections/JourneyPreview"));
const WhyHealtour = lazy(() => import("../components/sections/WhyHealtour"));
const Testimonials = lazy(() => import("../components/sections/Testimonials"));
const CTABanner = lazy(() => import("../components/sections/CTABanner"));
const AboutHealtour = lazy(() => import("../components/sections/AboutHealtour"));
const Footer = lazy(() => import("../components/layout/Footer"));

export default function LandingPage() {
  return (
    <div className="no-x-overflow min-h-screen bg-canvas">
      <Seo path="/" jsonLd={[organizationSchema(), websiteSchema()]} />

      {/* Skip link for keyboard users */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      <ScrollProgress />
      <CursorGlow />
      <Navbar />

      <main id="main">
        <Hero />

        <TrustBar />

        <SectionDivider variant="gradient" className="py-2" />

        <Suspense fallback={<SectionSkeleton cards={3} />}>
          <TrustedHospitals />
        </Suspense>

        <Suspense fallback={<SectionSkeleton cards={6} />}>
          <PartnerLogos />
        </Suspense>

        <Suspense fallback={<SectionSkeleton cards={4} />}>
          <HowItWorks />
        </Suspense>

        <Suspense fallback={<SectionSkeleton cards={3} />}>
          <AIFeatures />
        </Suspense>

        <Suspense fallback={<SectionSkeleton cards={2} />}>
          <JourneyPreview />
        </Suspense>

        <Suspense fallback={<SectionSkeleton cards={3} />}>
          <AboutHealtour />
        </Suspense>

        <Suspense fallback={<SectionSkeleton cards={4} />}>
          <Accreditation />
        </Suspense>

        <Suspense fallback={<SectionSkeleton cards={2} />}>
          <WhyHealtour />
        </Suspense>

        <Suspense fallback={<SectionSkeleton cards={4} />}>
          <Testimonials />
        </Suspense>

        <Suspense fallback={<SectionSkeleton cards={1} />}>
          <CTABanner />
        </Suspense>
      </main>

      <Suspense fallback={null}>
        <Footer />
      </Suspense>

      <BackToTop />
    </div>
  );
}
