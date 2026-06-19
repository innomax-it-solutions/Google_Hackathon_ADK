import { Link } from "react-router-dom";
import { ShieldCheck, Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import { FOOTER } from "../../data/landingData";
import {
  CONTACT,
  SOCIAL_LINKS,
  SPECIALTIES,
  HOSPITALS_NAV,
  POPULAR_TREATMENTS,
  RESOURCE_LINKS,
  whatsappLink,
} from "../../data/shellData";
import HealtourLogo from "../ui/HealtourLogo";
import Icon from "../ui/Icon";

function LinkColumn({ title, links }) {
  return (
    <nav aria-label={title}>
      <h4 className="text-sm font-semibold text-white">{title}</h4>
      <ul className="mt-5 space-y-3">
        {links.map((link) => (
          <li key={link.label + link.to}>
            <Link
              to={link.to}
              className="text-sm text-slate-400 transition hover:text-brand-300"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function Footer() {
  const specialtyLinks = SPECIALTIES.slice(0, 6).map((s) => ({
    label: s.name,
    to: `/specialties/${s.slug}`,
  }));
  const treatmentLinks = POPULAR_TREATMENTS.slice(0, 6).map((t) => ({
    label: t.name,
    to: `/treatments/${t.slug}`,
  }));
  const hospitalLinks = HOSPITALS_NAV.map((h) => ({
    label: h.name,
    to: `/hospitals/${h.slug}`,
  }));
  const resourceLinks = RESOURCE_LINKS.map((r) => ({ label: r.label, to: r.href }));

  return (
    <footer id="contact" className="relative overflow-hidden bg-slate-950 text-slate-300">
      {/* Subtle healthcare-tech backdrop: faint grid + soft blue ambient glow */}
      <div className="pointer-events-none absolute inset-0 bg-grid-dark bg-grid opacity-50" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[40rem] -translate-x-1/2 rounded-full bg-brand-500/10 blur-3xl" />

      <div className="container-x relative py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          {/* Branding + contact */}
          <div className="flex flex-col lg:col-span-4">
            <Link to="/" onClick={() => window.scrollTo({ top: 0 })} className="inline-flex" aria-label="Healtour home">
              <HealtourLogo size="md" showSubtitle onDark />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-400">
              {FOOTER.description}
            </p>

            <ul className="mt-6 space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-400" aria-hidden />
                <a href={CONTACT.phoneHref} className="transition hover:text-brand-300">
                  {CONTACT.phone}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-400" aria-hidden />
                <a href={CONTACT.emailHref} className="transition hover:text-brand-300">
                  {CONTACT.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-400" aria-hidden />
                <span>{CONTACT.address}</span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-400" aria-hidden />
                <span>{CONTACT.hours}</span>
              </li>
            </ul>

            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex w-fit items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
            </a>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8">
            <LinkColumn title="Specialties" links={specialtyLinks} />
            <LinkColumn title="Treatments" links={treatmentLinks} />
            <LinkColumn title="Hospitals" links={hospitalLinks} />
            <LinkColumn title="Resources" links={resourceLinks} />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-5 border-t border-white/10 pt-8 sm:flex-row">
          <p className="order-2 text-xs text-slate-500 sm:order-1">
            © {new Date().getFullYear()} {CONTACT.company}. All rights reserved.
          </p>

          {/* Social links */}
          <div className="order-1 flex items-center gap-2.5 sm:order-2">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:border-brand-400/40 hover:bg-white/5 hover:text-brand-300"
              >
                <Icon name={s.icon} className="h-4 w-4" />
              </a>
            ))}
          </div>

          <p className="order-3 inline-flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" aria-hidden />
            Secure AI-powered medical tourism platform
          </p>
        </div>
      </div>
    </footer>
  );
}
