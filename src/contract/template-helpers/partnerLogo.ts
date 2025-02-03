const PARTNER_MAP = {
  engine: {
    logo: "logos.partnerLogoEngine",
    names: ["engine"],
  },
  gradfin: {
    logo: "logos.partnerLogoGradfin",
    names: ["gradfin", "gradfin-slr"],
  },
  juno: {
    logo: "logos.partnerLogoJuno",
    names: ["juno", "juno-slr"],
  },
  purefy: {
    logo: "logos.partnerLogoPurefy",
    names: ["purefy", "purefy-slr"],
  },
  sparrow: {
    logo: "logos.partnerLogoSparrow",
    names: ["sparrow", "sparrow-slr"],
  },
  splash: {
    logo: "logos.partnerLogoSplash",
    names: ["splash", "splashfinancial-slr"],
  },
  studentloanhero: {
    logo: "logos.partnerLogoStudentLoanHero",
    names: ["studentloanhero-slr"],
  },
  nerdwallet: {
    logo: "logos.partnerLogoNerdWallet",
    names: ["nerdwallet-slr"],
  },
  lendingtree: {
    logo: "logos.partnerLogoLendingTree",
    names: ["lendingtree-slr"],
  },
  bankrate: {
    logo: "logos.partnerLogoBankrate",
    names: ["bankrate-slr"],
  },
  spinwheel: {
    logo: "logos.partnerLogoSpinwheel",
    names: ["spinwheel-slr"],
  },
  evenfinancial: {
    logo: "logos.partnerLogoEvenFinancial",
    names: ["evenfinancial-slr"],
  },
  credible: {
    logo: "logos.partnerLogoCredible",
    names: ["credible-slr"],
  },
};

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
