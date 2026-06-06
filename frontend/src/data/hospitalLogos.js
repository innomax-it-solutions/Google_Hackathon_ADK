// ---------------------------------------------------------------------------
// Hospital name → logo asset mapping.
//
// Keys are the exact `name` values from backend/data/hospital_registry.json
// (READ ONLY — never modify the backend). Logos are clean, original
// monogram-style SVG marks in ../assets/hospitals/, NOT the hospitals'
// trademarked artwork; swap in official logos later if licensing allows.
//
// Vite resolves these imports to URLs at build time, so each value is a
// string usable directly as <img src={...} />.
//
// Usage:
//   import hospitalLogos, { getHospitalLogo, defaultHospitalLogo } from "./hospitalLogos";
//   const src = getHospitalLogo(hospital.name);   // falls back to default
// ---------------------------------------------------------------------------

import fortisLogo from "../assets/hospitals/fortis.svg";
import apolloLogo from "../assets/hospitals/apollo-hospitals.svg";
import nikhilLogo from "../assets/hospitals/nikhil-hospital.svg";
import kimsLogo from "../assets/hospitals/kims-hospital.svg";
import kimsIconLogo from "../assets/hospitals/kims-icon-hospital.svg";
import medicoverLogo from "../assets/hospitals/medicover-hospitals.svg";
import virinchiLogo from "../assets/hospitals/virinchi-hospital.svg";
import simsLogo from "../assets/hospitals/sims-hospital.svg";
import mgmLogo from "../assets/hospitals/mgm-hospital.svg";
import beWellLogo from "../assets/hospitals/be-well-hospital.svg";
import hosmatLogo from "../assets/hospitals/hosmat-hospital.svg";
import vgmLogo from "../assets/hospitals/vgm-hospital.svg";
import kgLogo from "../assets/hospitals/kg-hospital.svg";
import royalCareLogo from "../assets/hospitals/royal-care-hospital.svg";
import parasLogo from "../assets/hospitals/paras-hospital.svg";
import samaLogo from "../assets/hospitals/sama-hospital.svg";
import txLogo from "../assets/hospitals/tx-hospitals.svg";
import whiteLotusLogo from "../assets/hospitals/white-lotus-hospital.svg";
import defaultHospitalLogo from "../assets/hospitals/default-hospital.svg";

const hospitalLogos = {
  "Fortis Hospitals": fortisLogo,
  "Apollo Hospitals": apolloLogo,
  "Nikhil Hospital": nikhilLogo,
  "KIMS Hospital": kimsLogo,
  "KIMS Icon Hospital": kimsIconLogo,
  "Medicover Hospitals": medicoverLogo,
  "Virinchi Hospital": virinchiLogo,
  "SIMS Hospital": simsLogo,
  "MGM Hospital": mgmLogo,
  "Be Well Hospital": beWellLogo,
  "HOSMAT Hospital": hosmatLogo,
  "VGM Hospital": vgmLogo,
  "KG Hospital": kgLogo,
  "Royal Care Hospital": royalCareLogo,
  "Paras Hospital": parasLogo,
  "Sama Hospital": samaLogo,
  "TX Hospitals": txLogo,
  "White Lotus Hospital": whiteLotusLogo,
};

// Resolve a hospital name to its logo, falling back to the neutral placeholder
// for any name not present in the map.
export function getHospitalLogo(name) {
  return hospitalLogos[name] || defaultHospitalLogo;
}

export { defaultHospitalLogo };
export default hospitalLogos;
