import { motion } from "framer-motion";
import { Star, MapPin, BadgeCheck, ShieldCheck } from "lucide-react";
import SectionHeading from "../ui/SectionHeading";
import TiltCard from "../ui/TiltCard";
import { staggerContainer, staggerItem } from "../ui/Reveal";
import { HOSPITALS } from "../../data/landingData";

function HospitalCard({ hospital }) {
  return (
    <motion.div variants={staggerItem} className="h-full [perspective:1000px]">
      <TiltCard className="h-full rounded-3xl">
        <article className="card flex h-full flex-col p-6 transition-shadow duration-300 hover:border-brand-100 hover:shadow-card dark:hover:border-brand-500/30">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${hospital.color} text-base font-bold text-white shadow-soft`}
              >
                {hospital.initials}
              </span>
              <div className="leading-tight">
                <h3 className="font-display text-base font-bold text-ink">{hospital.name}</h3>
                <p className="mt-1 flex items-center gap-1 text-xs text-ink-muted">
                  <MapPin className="h-3.5 w-3.5" /> {hospital.location}
                </p>
              </div>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {hospital.rating}
            </span>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-ink-muted">{hospital.description}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {hospital.specialties.map((s) => (
              <span key={s} className="tag">
                {s}
              </span>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs dark:border-slate-800">
            <span className="flex items-center gap-1.5 font-medium text-brand-700 dark:text-brand-300">
              <BadgeCheck className="h-4 w-4" /> {hospital.accreditation}
            </span>
            <span className="text-ink-muted">{hospital.reviews} reviews</span>
          </div>
        </article>
      </TiltCard>
    </motion.div>
  );
}

export default function TrustedHospitals() {
  return (
    <section id="hospitals" className="section-pad">
      <div className="container-x">
        <SectionHeading
          eyebrow="Trusted Network"
          icon={<ShieldCheck className="h-3.5 w-3.5" />}
          title="Accredited hospitals patients trust"
          subtitle="A curated network of JCI & NABH accredited hospitals across India, ready to deliver world-class care."
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {HOSPITALS.map((hospital) => (
            <HospitalCard key={hospital.name} hospital={hospital} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
