const PARTNER_MAP = {
  engine: {
    displayName: "Engine",
    logo: "logos.partnerLogoEngine",
    names: ["engine"],
  },
  gradfin: {
    displayName: "GradFin",
    logo: "logos.partnerLogoGradfin",
    names: ["gradfin", "gradfin-slr"],
  },
  juno: {
    displayName: "Juno",
    logo: "logos.partnerLogoJuno",
    names: ["juno", "juno-slr"],
  },
  purefy: {
    displayName: "Purefy",
    logo: "logos.partnerLogoPurefy",
    names: ["purefy", "purefy-slr"],
  },
  sparrow: {
    displayName: "Sparrow",
    logo: "logos.partnerLogoSparrow",
    names: ["sparrow", "sparrow-slr"],
  },
  splash: {
    displayName: "Splash",
    logo: "logos.partnerLogoSplash",
    names: ["splash", "splashfinancial-slr"],
  },
  studentloanhero: {
    displayName: "Student Loan Hero",
    logo: "logos.partnerLogoStudentLoanHero",
    names: ["studentloanhero-slr"],
  },
  nerdwallet: {
    displayName: "NerdWallet",
    logo: "logos.partnerLogoNerdWallet",
    names: ["nerdwallet-slr"],
  },
  lendingtree: {
    displayName: "LeandingTree",
    logo: "logos.partnerLogoLendingTree",
    names: ["lendingtree-slr"],
  },
  bankrate: {
    displayName: "Bankrate",
    logo: "logos.partnerLogoBankrate",
    names: ["bankrate-slr"],
  },
  spinwheel: {
    displayName: "Spinwheel",
    logo: "logos.partnerLogoSpinwheel",
    names: ["spinwheel-slr"],
  },
  evenfinancial: {
    displayName: "Even Financial",
    logo: "logos.partnerLogoEvenFinancial",
    names: ["evenfinancial-slr"],
  },
  credible: {
    displayName: "Credible",
    logo: "logos.partnerLogoCredible",
    names: ["credible-slr"],
  },
};

/**
 * Block helper that takes a valid JSON object and spreads it to an encapsulating object
 */
export const partnerLogo = function (name) {
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

export const partnerName = function (name) {
  const partnerName = name?.toLowerCase() || "";
  // Do the easy check first
  const displayName = PARTNER_MAP[partnerName]?.displayName;

  if (displayName) {
    return displayName;
  }

  // Check partner names array
  for (const partner in PARTNER_MAP) {
    if (PARTNER_MAP[partner].names.includes(partnerName)) {
      return PARTNER_MAP[partner].displayName;
    }
  }
};

export const formatDiscount = function (discount: number): string {
  const positiveDiscount = Math.abs(discount);
  return `${positiveDiscount}%`;
};
