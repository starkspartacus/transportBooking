import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Users, Shield, Zap } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                TransportApp
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth/signin">
                <Button variant="outline">Se connecter</Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-gradient-to-r from-blue-600 to-green-600">S'inscrire</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Voyagez en toute simplicité
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Réservez vos billets de transport en ligne, payez à la gare ou directement sur la plateforme. Une expérience
            de voyage moderne et sécurisée.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/search">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-green-600 text-lg px-8 py-4">
                Rechercher un voyage
              </Button>
            </Link>
            <Link href="/company/register">
              <Button size="lg" variant="outline" className="text-lg px-8 py-4">
                Inscrire votre entreprise
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Pourquoi choisir TransportApp ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle>Réservation instantanée</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Réservez vos billets en quelques clics et recevez votre QR code immédiatement.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle>Paiement sécurisé</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Payez en ligne ou à la gare. Vos données sont protégées par un cryptage de niveau bancaire.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle>Support 24/7</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Notre équipe est disponible 24h/24 pour vous accompagner dans vos voyages.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Popular Routes */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Destinations populaires</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { from: "Dakar", to: "Thiès", price: "2500", duration: "1h30", company: "Transport Express" },
              { from: "Abidjan", to: "Bouaké", price: "3500", duration: "3h45", company: "Côte Transport" },
              { from: "Lomé", to: "Kara", price: "4000", duration: "5h20", company: "Togo Bus" },
              { from: "Cotonou", to: "Parakou", price: "5500", duration: "4h15", company: "Bénin Express" },
              {
                from: "Ouagadougou",
                to: "Bobo-Dioulasso",
                price: "3000",
                duration: "4h30",
                company: "Burkina Transport",
              },
              { from: "Bamako", to: "Ségou", price: "2800", duration: "2h45", company: "Mali Express" },
            ].map((route, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">{route.from}</span>
                      <span className="text-gray-400">→</span>
                      <span className="font-medium">{route.to}</span>
                    </div>
                    <Badge variant="secondary">{route.price} FCFA</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{route.duration}</span>
                    </div>
                    <span>{route.company}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Prêt à voyager ?</h2>
          <p className="text-xl mb-8 opacity-90">
            Rejoignez des milliers de voyageurs qui font confiance à TransportApp
          </p>
          <Link href="/search">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
              Commencer maintenant
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">T</span>
                </div>
                <span className="text-xl font-bold">TransportApp</span>
              </div>
              <p className="text-gray-400">La plateforme de référence pour vos voyages en Afrique de l'Ouest.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Voyageurs</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/search" className="hover:text-white">
                    Rechercher
                  </Link>
                </li>
                <li>
                  <Link href="/auth/signup" className="hover:text-white">
                    S'inscrire
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="hover:text-white">
                    Aide
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Entreprises</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/company/register" className="hover:text-white">
                    S'inscrire
                  </Link>
                </li>
                <li>
                  <Link href="/company/login" className="hover:text-white">
                    Se connecter
                  </Link>
                </li>
                <li>
                  <Link href="/company/help" className="hover:text-white">
                    Support
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-400">
                <li>support@transportapp.com</li>
                <li>+221 77 123 45 67</li>
                <li>Dakar, Sénégal</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 TransportApp. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
