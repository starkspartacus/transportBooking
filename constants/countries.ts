export interface Country {
  id: string;
  name: string;
  code: string;
  phonePrefix: string;
  flag: string;
  currency: string;
  cities: City[];
}

export interface City {
  name: string;
  communes?: string[];
}

export const AFRICAN_COUNTRIES: Country[] = [
  {
    id: "1",
    name: "Sénégal",
    code: "SN",
    phonePrefix: "+221",
    flag: "🇸🇳",
    currency: "XOF",
    cities: [
      {
        name: "Dakar",
        communes: [
          "Plateau",
          "Médina",
          "Fann",
          "Mermoz",
          "Ouakam",
          "Yoff",
          "Ngor",
          "Almadies",
          "Grand Yoff",
          "Parcelles Assainies",
        ],
      },
      {
        name: "Thiès",
        communes: ["Thiès Nord", "Thiès Sud", "Thiès Est", "Thiès Ouest"],
      },
      {
        name: "Kaolack",
        communes: ["Kaolack Nord", "Kaolack Sud", "Médina Baye"],
      },
      {
        name: "Saint-Louis",
        communes: ["Saint-Louis Nord", "Saint-Louis Sud", "Sor"],
      },
      {
        name: "Ziguinchor",
        communes: ["Ziguinchor Nord", "Ziguinchor Sud"],
      },
      {
        name: "Diourbel",
        communes: ["Diourbel Nord", "Diourbel Sud"],
      },
      {
        name: "Louga",
        communes: ["Louga Nord", "Louga Sud"],
      },
      {
        name: "Fatick",
      },
      {
        name: "Kolda",
      },
      {
        name: "Tambacounda",
      },
    ],
  },
  {
    id: "2",
    name: "Côte d'Ivoire",
    code: "CI",
    phonePrefix: "+225",
    flag: "🇨🇮",
    currency: "XOF",
    cities: [
      {
        name: "Abidjan",
        communes: [
          "Cocody",
          "Yopougon",
          "Adjamé",
          "Plateau",
          "Marcory",
          "Treichville",
          "Koumassi",
          "Port-Bouët",
          "Abobo",
          "Attécoubé",
        ],
      },
      {
        name: "Bouaké",
        communes: ["Bouaké Centre", "Bouaké Nord", "Bouaké Sud"],
      },
      {
        name: "Daloa",
        communes: ["Daloa Centre", "Daloa Nord", "Daloa Sud"],
      },
      {
        name: "Yamoussoukro",
        communes: [
          "Yamoussoukro Centre",
          "Yamoussoukro Nord",
          "Yamoussoukro Sud",
        ],
      },
      {
        name: "San-Pédro",
        communes: ["San-Pédro Centre", "San-Pédro Port"],
      },
      {
        name: "Korhogo",
      },
      {
        name: "Man",
      },
      {
        name: "Gagnoa",
      },
      {
        name: "Divo",
      },
      {
        name: "Anyama",
      },
    ],
  },
  {
    id: "3",
    name: "Mali",
    code: "ML",
    phonePrefix: "+223",
    flag: "🇲🇱",
    currency: "XOF",
    cities: [
      {
        name: "Bamako",
        communes: [
          "Commune I",
          "Commune II",
          "Commune III",
          "Commune IV",
          "Commune V",
          "Commune VI",
        ],
      },
      {
        name: "Sikasso",
        communes: ["Sikasso Centre", "Sikasso Nord", "Sikasso Sud"],
      },
      {
        name: "Mopti",
        communes: ["Mopti Centre", "Mopti Nord"],
      },
      {
        name: "Ségou",
        communes: ["Ségou Centre", "Ségou Nord", "Ségou Sud"],
      },
      {
        name: "Kayes",
        communes: ["Kayes Centre", "Kayes Nord"],
      },
      {
        name: "Koutiala",
      },
      {
        name: "Gao",
      },
      {
        name: "Tombouctou",
      },
      {
        name: "Kidal",
      },
    ],
  },
  {
    id: "4",
    name: "Burkina Faso",
    code: "BF",
    phonePrefix: "+226",
    flag: "🇧🇫",
    currency: "XOF",
    cities: [
      {
        name: "Ouagadougou",
        communes: [
          "Baskuy",
          "Bogodogo",
          "Boulmiougou",
          "Nongremassom",
          "Sig-Nonghin",
        ],
      },
      {
        name: "Bobo-Dioulasso",
        communes: [
          "Do",
          "Dafra",
          "Konsa",
          "Secteur 1",
          "Secteur 2",
          "Secteur 3",
        ],
      },
      {
        name: "Koudougou",
        communes: ["Koudougou Centre", "Koudougou Nord"],
      },
      {
        name: "Ouahigouya",
        communes: ["Ouahigouya Centre", "Ouahigouya Nord"],
      },
      {
        name: "Banfora",
      },
      {
        name: "Kaya",
      },
      {
        name: "Tenkodogo",
      },
      {
        name: "Fada N'Gourma",
      },
    ],
  },
  {
    id: "5",
    name: "Togo",
    code: "TG",
    phonePrefix: "+228",
    flag: "🇹🇬",
    currency: "XOF",
    cities: [
      {
        name: "Lomé",
        communes: ["Golfe", "Agoe-Nyive", "Lacs", "Vo", "Yoto"],
      },
      {
        name: "Sokodé",
        communes: ["Sokodé Centre", "Sokodé Nord"],
      },
      {
        name: "Kara",
        communes: ["Kara Centre", "Kara Nord"],
      },
      {
        name: "Atakpamé",
        communes: ["Atakpamé Centre", "Atakpamé Nord"],
      },
      {
        name: "Dapaong",
      },
      {
        name: "Tsévié",
      },
      {
        name: "Aného",
      },
      {
        name: "Bassar",
      },
    ],
  },
  {
    id: "6",
    name: "Bénin",
    code: "BJ",
    phonePrefix: "+229",
    flag: "🇧🇯",
    currency: "XOF",
    cities: [
      {
        name: "Cotonou",
        communes: [
          "1er Arrondissement",
          "2ème Arrondissement",
          "3ème Arrondissement",
          "4ème Arrondissement",
          "5ème Arrondissement",
          "6ème Arrondissement",
          "7ème Arrondissement",
          "8ème Arrondissement",
          "9ème Arrondissement",
          "10ème Arrondissement",
          "11ème Arrondissement",
          "12ème Arrondissement",
          "13ème Arrondissement",
        ],
      },
      {
        name: "Porto-Novo",
        communes: ["Porto-Novo Centre", "Porto-Novo Nord", "Porto-Novo Sud"],
      },
      {
        name: "Parakou",
        communes: ["Parakou Centre", "Parakou Nord", "Parakou Sud"],
      },
      {
        name: "Djougou",
        communes: ["Djougou Centre", "Djougou Nord"],
      },
      {
        name: "Bohicon",
      },
      {
        name: "Kandi",
      },
      {
        name: "Lokossa",
      },
      {
        name: "Ouidah",
      },
      {
        name: "Abomey",
      },
    ],
  },
  {
    id: "7",
    name: "Ghana",
    code: "GH",
    phonePrefix: "+233",
    flag: "🇬🇭",
    currency: "GHS",
    cities: [
      {
        name: "Accra",
        communes: [
          "Accra Metropolitan",
          "Tema",
          "Ga East",
          "Ga West",
          "Ga South",
        ],
      },
      {
        name: "Kumasi",
        communes: ["Kumasi Metropolitan", "Oforikrom", "Asokwa", "Subin"],
      },
      {
        name: "Tamale",
      },
      {
        name: "Cape Coast",
      },
      {
        name: "Sekondi-Takoradi",
      },
      {
        name: "Ho",
      },
      {
        name: "Koforidua",
      },
    ],
  },
  {
    id: "8",
    name: "Nigeria",
    code: "NG",
    phonePrefix: "+234",
    flag: "🇳🇬",
    currency: "NGN",
    cities: [
      {
        name: "Lagos",
        communes: [
          "Lagos Island",
          "Lagos Mainland",
          "Surulere",
          "Ikeja",
          "Eti-Osa",
          "Kosofe",
          "Mushin",
          "Oshodi-Isolo",
          "Shomolu",
          "Alimosho",
        ],
      },
      {
        name: "Abuja",
        communes: ["Garki", "Wuse", "Maitama", "Asokoro", "Gwarinpa", "Kubwa"],
      },
      {
        name: "Kano",
      },
      {
        name: "Ibadan",
      },
      {
        name: "Port Harcourt",
      },
      {
        name: "Benin City",
      },
      {
        name: "Kaduna",
      },
    ],
  },
  {
    id: "9",
    name: "Cameroun",
    code: "CM",
    phonePrefix: "+237",
    flag: "🇨🇲",
    currency: "XAF",
    cities: [
      {
        name: "Yaoundé",
        communes: [
          "Yaoundé I",
          "Yaoundé II",
          "Yaoundé III",
          "Yaoundé IV",
          "Yaoundé V",
          "Yaoundé VI",
          "Yaoundé VII",
        ],
      },
      {
        name: "Douala",
        communes: [
          "Douala I",
          "Douala II",
          "Douala III",
          "Douala IV",
          "Douala V",
        ],
      },
      {
        name: "Garoua",
      },
      {
        name: "Bamenda",
      },
      {
        name: "Maroua",
      },
      {
        name: "Bafoussam",
      },
    ],
  },
  {
    id: "10",
    name: "Niger",
    code: "NE",
    phonePrefix: "+227",
    flag: "🇳🇪",
    currency: "XOF",
    cities: [
      {
        name: "Niamey",
        communes: [
          "Niamey I",
          "Niamey II",
          "Niamey III",
          "Niamey IV",
          "Niamey V",
        ],
      },
      {
        name: "Zinder",
      },
      {
        name: "Maradi",
      },
      {
        name: "Agadez",
      },
      {
        name: "Tahoua",
      },
      {
        name: "Dosso",
      },
    ],
  },
];

// Helper functions
export const getCountryByCode = (code: string): Country | undefined => {
  return AFRICAN_COUNTRIES.find((country) => country.code === code);
};

export const getCountryByName = (name: string): Country | undefined => {
  return AFRICAN_COUNTRIES.find(
    (country) => country.name.toLowerCase() === name.toLowerCase()
  );
};

export const getCitiesByCountryCode = (countryCode: string): City[] => {
  const country = getCountryByCode(countryCode);
  return country?.cities || [];
};

export const getCommunesByCity = (
  countryCode: string,
  cityName: string
): string[] => {
  const cities = getCitiesByCountryCode(countryCode);
  const city = cities.find(
    (c) => c.name.toLowerCase() === cityName.toLowerCase()
  );
  return city?.communes || [];
};

export const getCountryNames = (): string[] => {
  return AFRICAN_COUNTRIES.map((country) => country.name);
};

export const getPhonePrefixes = (): { [key: string]: string } => {
  const prefixes: { [key: string]: string } = {};
  AFRICAN_COUNTRIES.forEach((country) => {
    prefixes[country.code] = country.phonePrefix;
  });
  return prefixes;
};
