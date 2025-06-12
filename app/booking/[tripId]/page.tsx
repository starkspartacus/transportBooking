import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import GuestBookingForm from "@/components/booking/guest-booking-form";

interface BookingPageProps {
  params: {
    tripId: string;
  };
}

export default async function BookingPage({ params }: BookingPageProps) {
  // Vérifier si params existe et contient tripId
  if (!params || !params.tripId) {
    notFound();
  }

  try {
    const trip = await prisma.trip.findUnique({
      where: { id: params.tripId },
      include: {
        company: true,
        bus: true,
        route: true,
      },
    });

    if (!trip) {
      notFound();
    }

    // Vérifier si le voyage est disponible (SCHEDULED ou ACTIVE)
    if (trip.status !== "SCHEDULED" && trip.status !== "BOARDING") {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-red-700 mb-4">
              Voyage non disponible
            </h1>
            <p className="text-red-600 mb-4">
              Ce voyage n'est plus disponible pour les réservations.
            </p>
            <a
              href="/search"
              className="inline-block bg-primary hover:bg-primary/90 text-white font-medium py-2 px-6 rounded-md transition-colors"
            >
              Rechercher d'autres voyages
            </a>
          </div>
        </div>
      );
    }

    // Déterminer les villes de départ et d'arrivée
    const departureCity = trip.route?.departureLocation || "N/A";
    const arrivalCity = trip.route?.arrivalLocation || "N/A";

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Réserver votre voyage
            </h1>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h2 className="font-semibold text-lg text-gray-700 mb-2">
                Détails du voyage
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Départ</p>
                  <p className="font-medium">{departureCity}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Arrivée</p>
                  <p className="font-medium">{arrivalCity}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date et heure</p>
                  <p className="font-medium">
                    {new Date(trip.departureTime).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Compagnie</p>
                  <p className="font-medium">{trip.company.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type de bus</p>
                  <p className="font-medium">
                    {trip.bus.model} ({trip.bus.busType})
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Prix</p>
                  <p className="font-medium text-primary">
                    {trip.currentPrice.toLocaleString()} FCFA
                  </p>
                </div>
              </div>
            </div>

            <GuestBookingForm
              trip={trip}
              departureCity={departureCity}
              arrivalCity={arrivalCity}
            />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading trip:", error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-red-700 mb-4">Erreur</h1>
          <p className="text-red-600 mb-4">
            Une erreur s'est produite lors du chargement des détails du voyage.
          </p>
          <a
            href="/search"
            className="inline-block bg-primary hover:bg-primary/90 text-white font-medium py-2 px-6 rounded-md transition-colors"
          >
            Retour à la recherche
          </a>
        </div>
      </div>
    );
  }
}
