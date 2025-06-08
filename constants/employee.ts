// Nationalités basées sur les pays africains existants
export const NATIONALITIES = [
  { code: "SN", name: "Sénégalaise" },
  { code: "CI", name: "Ivoirienne" },
  { code: "ML", name: "Malienne" },
  { code: "BF", name: "Burkinabé" },
  { code: "TG", name: "Togolaise" },
  { code: "BJ", name: "Béninoise" },
  { code: "GH", name: "Ghanéenne" },
  { code: "NG", name: "Nigériane" },
  { code: "CM", name: "Camerounaise" },
  { code: "NE", name: "Nigérienne" },
  { code: "FR", name: "Française" },
  { code: "MA", name: "Marocaine" },
  { code: "DZ", name: "Algérienne" },
  { code: "TN", name: "Tunisienne" },
  { code: "MR", name: "Mauritanienne" },
  { code: "GN", name: "Guinéenne" },
  { code: "GW", name: "Bissau-Guinéenne" },
  { code: "SL", name: "Sierra-Léonaise" },
  { code: "LR", name: "Libérienne" },
  { code: "GM", name: "Gambienne" },
];

// Départements d'entreprise de transport
export const DEPARTMENTS = [
  { id: "TRANSPORT", name: "Transport" },
  { id: "OPERATIONS", name: "Opérations" },
  { id: "MAINTENANCE", name: "Maintenance" },
  { id: "COMMERCIAL", name: "Commercial" },
  { id: "FINANCE", name: "Finance" },
  { id: "RESSOURCES_HUMAINES", name: "Ressources Humaines" },
  { id: "LOGISTIQUE", name: "Logistique" },
  { id: "SECURITE", name: "Sécurité" },
  { id: "INFORMATIQUE", name: "Informatique" },
  { id: "DIRECTION", name: "Direction" },
  { id: "MARKETING", name: "Marketing" },
  { id: "SERVICE_CLIENT", name: "Service Client" },
];

// Postes dans une entreprise de transport
export const POSITIONS = {
  TRANSPORT: [
    { id: "CHAUFFEUR", name: "Chauffeur" },
    { id: "CHAUFFEUR_SENIOR", name: "Chauffeur Senior" },
    { id: "SUPERVISEUR_TRANSPORT", name: "Superviseur Transport" },
    { id: "DIRECTEUR_TRANSPORT", name: "Directeur Transport" },
  ],
  OPERATIONS: [
    { id: "AGENT_OPERATIONS", name: "Agent des Opérations" },
    { id: "COORDINATEUR_OPERATIONS", name: "Coordinateur des Opérations" },
    { id: "CHEF_OPERATIONS", name: "Chef des Opérations" },
    { id: "DIRECTEUR_OPERATIONS", name: "Directeur des Opérations" },
  ],
  MAINTENANCE: [
    { id: "MECANICIEN", name: "Mécanicien" },
    { id: "TECHNICIEN_MAINTENANCE", name: "Technicien de Maintenance" },
    { id: "CHEF_ATELIER", name: "Chef d'Atelier" },
    { id: "DIRECTEUR_MAINTENANCE", name: "Directeur de Maintenance" },
  ],
  COMMERCIAL: [
    { id: "AGENT_COMMERCIAL", name: "Agent Commercial" },
    { id: "RESPONSABLE_COMMERCIAL", name: "Responsable Commercial" },
    { id: "DIRECTEUR_COMMERCIAL", name: "Directeur Commercial" },
  ],
  FINANCE: [
    { id: "COMPTABLE", name: "Comptable" },
    { id: "CONTROLEUR_GESTION", name: "Contrôleur de Gestion" },
    { id: "DIRECTEUR_FINANCIER", name: "Directeur Financier" },
  ],
  RESSOURCES_HUMAINES: [
    { id: "ASSISTANT_RH", name: "Assistant RH" },
    { id: "RESPONSABLE_RH", name: "Responsable RH" },
    { id: "DIRECTEUR_RH", name: "Directeur RH" },
  ],
  LOGISTIQUE: [
    { id: "AGENT_LOGISTIQUE", name: "Agent Logistique" },
    { id: "RESPONSABLE_LOGISTIQUE", name: "Responsable Logistique" },
    { id: "DIRECTEUR_LOGISTIQUE", name: "Directeur Logistique" },
  ],
  SECURITE: [
    { id: "AGENT_SECURITE", name: "Agent de Sécurité" },
    { id: "RESPONSABLE_SECURITE", name: "Responsable Sécurité" },
  ],
  INFORMATIQUE: [
    { id: "TECHNICIEN_IT", name: "Technicien IT" },
    { id: "DEVELOPPEUR", name: "Développeur" },
    { id: "RESPONSABLE_IT", name: "Responsable IT" },
    { id: "DIRECTEUR_IT", name: "Directeur IT" },
  ],
  DIRECTION: [
    { id: "ASSISTANT_DIRECTION", name: "Assistant de Direction" },
    { id: "DIRECTEUR_GENERAL", name: "Directeur Général" },
    { id: "PDG", name: "PDG" },
  ],
  MARKETING: [
    { id: "CHARGE_MARKETING", name: "Chargé de Marketing" },
    { id: "RESPONSABLE_MARKETING", name: "Responsable Marketing" },
    { id: "DIRECTEUR_MARKETING", name: "Directeur Marketing" },
  ],
  SERVICE_CLIENT: [
    { id: "AGENT_SERVICE_CLIENT", name: "Agent Service Client" },
    { id: "SUPERVISEUR_SERVICE_CLIENT", name: "Superviseur Service Client" },
    { id: "RESPONSABLE_SERVICE_CLIENT", name: "Responsable Service Client" },
  ],
};

// Fonction pour obtenir tous les postes dans une liste plate
export const getAllPositions = () => {
  const allPositions: { id: string; name: string; department: string }[] = [];

  Object.entries(POSITIONS).forEach(([deptId, positions]) => {
    const department = DEPARTMENTS.find((d) => d.id === deptId)?.name || deptId;

    positions.forEach((position) => {
      allPositions.push({
        ...position,
        department,
      });
    });
  });

  return allPositions;
};

// Fonction pour obtenir les postes d'un département spécifique
export const getPositionsByDepartment = (departmentId: string) => {
  return POSITIONS[departmentId as keyof typeof POSITIONS] || [];
};
