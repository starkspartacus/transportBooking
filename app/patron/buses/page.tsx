import type { Metadata } from "next";
import BusFleetManagement from "@/components/patron/bus-fleet-management";

export const metadata: Metadata = {
  title: "Gestion de la flotte - Bus",
  description: "Gérez votre flotte de bus en toute simplicité",
};

export default function BusesPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <BusFleetManagement />
    </div>
  );
}
