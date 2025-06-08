// Types de voyages
export const TRIP_TYPES = [
  { id: "STANDARD", name: "Standard" },
  { id: "EXPRESS", name: "Express" },
  { id: "VIP", name: "VIP" },
  { id: "ECONOMIQUE", name: "Économique" },
  { id: "NUIT", name: "Voyage de nuit" },
];

// Statuts de voyage
export const TRIP_STATUSES = [
  { id: "SCHEDULED", name: "Programmé", color: "blue" },
  { id: "BOARDING", name: "Embarquement", color: "yellow" },
  { id: "DEPARTED", name: "En route", color: "green" },
  { id: "IN_TRANSIT", name: "En transit", color: "green" },
  { id: "ARRIVED", name: "Arrivé", color: "gray" },
  { id: "COMPLETED", name: "Terminé", color: "gray" },
  { id: "CANCELLED", name: "Annulé", color: "red" },
  { id: "DELAYED", name: "Retardé", color: "orange" },
];

// Services disponibles pendant le voyage
export const TRIP_SERVICES = [
  { id: "WIFI", name: "WiFi à bord", icon: "wifi" },
  { id: "AIR_CONDITIONING", name: "Climatisation", icon: "thermometer" },
  { id: "ENTERTAINMENT", name: "Divertissement", icon: "tv" },
  { id: "REFRESHMENTS", name: "Rafraîchissements", icon: "coffee" },
  { id: "POWER_OUTLETS", name: "Prises électriques", icon: "plug" },
  { id: "TOILET", name: "Toilettes", icon: "toilet" },
  { id: "RECLINING_SEATS", name: "Sièges inclinables", icon: "armchair" },
  { id: "EXTRA_LEGROOM", name: "Espace jambes supplémentaire", icon: "ruler" },
  { id: "LUGGAGE_SPACE", name: "Espace bagages", icon: "luggage" },
];

// Raisons d'annulation de voyage
export const CANCELLATION_REASONS = [
  { id: "TECHNICAL_ISSUE", name: "Problème technique" },
  { id: "WEATHER_CONDITIONS", name: "Conditions météorologiques" },
  { id: "DRIVER_UNAVAILABLE", name: "Chauffeur indisponible" },
  { id: "INSUFFICIENT_PASSENGERS", name: "Nombre insuffisant de passagers" },
  { id: "ROAD_CONDITIONS", name: "État des routes" },
  { id: "SECURITY_CONCERNS", name: "Problèmes de sécurité" },
  { id: "ADMINISTRATIVE_ISSUE", name: "Problème administratif" },
  { id: "OTHER", name: "Autre raison" },
];

// Types de passagers
export const PASSENGER_TYPES = [
  { id: "ADULT", name: "Adulte", discount: 0 },
  { id: "CHILD", name: "Enfant", discount: 0.25 },
  { id: "SENIOR", name: "Senior", discount: 0.15 },
  { id: "STUDENT", name: "Étudiant", discount: 0.1 },
  { id: "DISABLED", name: "Personne à mobilité réduite", discount: 0.2 },
  { id: "MILITARY", name: "Militaire", discount: 0.15 },
];

// Méthodes de paiement
export const PAYMENT_METHODS = [
  { id: "CASH", name: "Espèces", icon: "banknote" },
  { id: "CREDIT_CARD", name: "Carte de crédit", icon: "credit-card" },
  { id: "MOBILE_MONEY", name: "Mobile Money", icon: "smartphone" },
  { id: "BANK_TRANSFER", name: "Virement bancaire", icon: "building-bank" },
  { id: "PAYPAL", name: "PayPal", icon: "paypal" },
  { id: "CRYPTO", name: "Crypto-monnaie", icon: "bitcoin" },
];
