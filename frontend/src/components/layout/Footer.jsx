import { useState } from "react";
import { MapPin, Mail, Phone, Linkedin, Facebook, Instagram, Youtube, ShieldCheck } from "lucide-react";
import { FOOTER } from "../../data/landingData";
import ParentCompanyBadge from "../ui/ParentCompanyBadge";

const SOCIALS = [
  {
    icon: Facebook,
    label: "Facebook",
    href: "https://www.facebook.com/healtoursolutions/",
  },
  {
    icon: Linkedin,
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/healtour-solutions-pvt-ltd/",
  },
  {
    icon: Instagram,
    label: "Instagram",
    href: "https://www.instagram.com/healtour.india?utm_source=qr&igsh=d2I2bzg4bWUydGJo",
  },
  {
    icon: Youtube,
    label: "YouTube",
    href: "https://www.youtube.com/@HEALTOURSOLUTIONS",
  },
];

export default function Footer() {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e) => {
    e.preventDefault();
    setEmail("");
  };

  return (
    <footer id="contact" className="relative overflow-hidden bg-slate-950 text-slate-300">
      <div className="pointer-events-none absolute inset-0 bg-grid-dark bg-grid opacity-50" />
      <div className="container-x relative py-14 sm:py-16">
        <div className="grid items-start gap-10 sm:grid-cols-2 lg:grid-cols-[1.35fr_0.72fr_1.68fr_1.15fr] lg:gap-6 xl:gap-8">
          {/* Brand */}
          <div className="flex flex-col sm:col-span-2 lg:col-span-1 lg:max-w-xs">
            <a href="#top" className="inline-flex flex-col gap-1" aria-label="Healtour home">
              <img
                src="/healtour-logo.png"
                alt="Healtour — Click. Fly. Heal."
                className="h-10 w-auto max-w-[180px] object-contain object-left"
              />
            </a>
            <p className="mt-3 text-xs font-medium text-slate-500">Medical Tourism Platform</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{FOOTER.tagline}</p>
            <div className="mt-5">
              <ParentCompanyBadge variant="footer" />
            </div>
          </div>

          {/* Explore */}
          <div className="lg:max-w-[9.5rem]">
            <h4 className="text-sm font-semibold text-white">Explore</h4>
            <ul className="mt-4 space-y-3">
              {FOOTER.explore.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-slate-400 transition hover:text-brand-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Us */}
          <div className="min-w-0 lg:-ml-2 lg:min-w-[18rem] xl:min-w-[20rem]">
            <h4 className="text-sm font-semibold text-white">Contact Us</h4>
            <ul className="mt-4 space-y-4">
              <li className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-400">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500" />
                <span className="max-w-[22rem]">{FOOTER.contact.address}</span>
              </li>
              <li>
                <a
                  href={`mailto:${FOOTER.contact.email}`}
                  className="flex items-center gap-2.5 text-sm text-slate-400 transition hover:text-white"
                >
                  <Mail className="h-4 w-4 flex-shrink-0 text-slate-500" />
                  {FOOTER.contact.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${FOOTER.contact.phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-2.5 text-sm text-slate-400 transition hover:text-white"
                >
                  <Phone className="h-4 w-4 flex-shrink-0 text-slate-500" />
                  {FOOTER.contact.phone}
                </a>
              </li>
            </ul>
          </div>

          {/* Stay Connected */}
          <div className="min-w-0 lg:pl-2">
            <h4 className="text-sm font-semibold text-white">Stay Connected</h4>
            <div className="mt-4 flex flex-wrap gap-2">
              {SOCIALS.map(({ icon: SocialIcon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit Healtour on ${label}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition hover:border-brand-400/40 hover:text-white"
                >
                  <SocialIcon className="h-4 w-4" />
                </a>
              ))}
            </div>

            <p className="mt-6 text-sm text-slate-400">Subscribe to our newsletter</p>
            <form onSubmit={handleSubscribe} className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-brand-400/50 focus:ring-2 focus:ring-brand-500/20"
              />
              <button type="submit" className="btn-primary shrink-0 px-4 py-2.5 text-sm">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Healtour. All rights reserved.
          </p>
          <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" aria-hidden />
            Healtour solutions powered by Innomax Skills
          </p>
        </div>
      </div>
    </footer>
  );
}
