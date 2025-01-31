const PARTNER_MAP = {
  engine: {
    logo: "logos.partnerLogoEngine",
    names: ["engine"]
  },
  gradfin: {
    logo: "logos.partnerLogoGradfin",
    names: ["gradfin"]
  },
  juno: {
    logo: "logos.partnerLogoJuno",
    names: ["juno"]
  },
  purefy: {
    logo: "logos.partnerLogoPurefy",
    names: ["purefy"]
  },
  sparrow: {
    logo: "logos.partnerLogoSparrow",
    names: ["sparrow"]
  },
  splash: {
    logo: "logos.partnerLogoSplash",
    names: ["splash"]
  }
}

/**
 * Block helper that takes a valid JSON object and spreads it to an encapsulating object
 */
const partnerLogo = function (name) {
  const partnerName = name?.toLowerCase() || "";
  // Do the easy check first
  const logo = PARTNER_MAP[partnerName]?.logo;

  if (logo) {
    return logo;
  }

  // Check partner names array
  for (const partner in PARTNER_MAP) {
    if (PARTNER_MAP[partner].names.includes(partnerName)) {
      return PARTNER_MAP[partner].logo;
    }
  }
};

export default partnerLogo;
