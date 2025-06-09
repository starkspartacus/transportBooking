export const COMPANY_STATUSES = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED",
  REVIEW: "REVIEW",
  REJECTED: "REJECTED",
  ARCHIVED: "ARCHIVED",
} as const;

export const COMPANY_SIZES = {
  SMALL: "SMALL",
  MEDIUM: "MEDIUM",
  LARGE: "LARGE",
  ENTERPRISE: "ENTERPRISE",
} as const;

export const SUBSCRIPTION_TIERS = {
  BASIC: "BASIC",
  STANDARD: "STANDARD",
  PREMIUM: "PREMIUM",
  ENTERPRISE: "ENTERPRISE",
} as const;

export const SUBSCRIPTION_FEATURES = {
  BASIC: [
    "1 entreprise",
    "5 employés",
    "10 bus",
    "Réservations limitées",
    "Support email",
  ],
  STANDARD: [
    "3 entreprises",
    "20 employés",
    "30 bus",
    "Réservations illimitées",
    "Support prioritaire",
    "Rapports basiques",
    "API d'intégration",
  ],
  PREMIUM: [
    "10 entreprises",
    "50 employés",
    "100 bus",
    "Réservations illimitées",
    "Support 24/7",
    "Rapports avancés",
    "API complète",
    "Tableau de bord personnalisé",
  ],
  ENTERPRISE: [
    "Entreprises illimitées",
    "Employés illimités",
    "Bus illimités",
    "Réservations illimitées",
    "Support dédié",
    "Rapports sur mesure",
    "API personnalisée",
    "Intégrations sur mesure",
    "Formation personnalisée",
  ],
};

export const SUBSCRIPTION_PRICES = {
  BASIC: {
    monthly: 0,
    yearly: 0,
    currency: "XOF",
  },
  STANDARD: {
    monthly: 25000,
    yearly: 250000,
    currency: "XOF",
  },
  PREMIUM: {
    monthly: 50000,
    yearly: 500000,
    currency: "XOF",
  },
  ENTERPRISE: {
    monthly: 100000,
    yearly: 1000000,
    currency: "XOF",
  },
};

export const SUBSCRIPTION_COLORS = {
  BASIC: "bg-gradient-to-br from-gray-200 to-gray-300",
  STANDARD: "bg-gradient-to-br from-blue-400 to-blue-600",
  PREMIUM: "bg-gradient-to-br from-purple-400 to-purple-600",
  ENTERPRISE: "bg-gradient-to-br from-amber-400 to-amber-600",
};

export const SUBSCRIPTION_BUTTON_COLORS = {
  BASIC: "bg-gray-600 hover:bg-gray-700",
  STANDARD: "bg-blue-600 hover:bg-blue-700",
  PREMIUM: "bg-purple-600 hover:bg-purple-700",
  ENTERPRISE: "bg-amber-600 hover:bg-amber-700",
};
