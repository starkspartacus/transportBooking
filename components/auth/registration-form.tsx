"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Confetti } from "@/components/ui/confetti";
import { User, Building, CheckCircle, AlertCircle } from "lucide-react";
import { ClientRegistrationTab } from "./client-registration-tab";
import { CompanyRegistrationTab } from "./company-registration-tab";

interface FormErrors {
  [key: string]: string;
}

export default function RegistrationForm() {
  const [activeTab, setActiveTab] = useState("client");
  const [showConfetti, setShowConfetti] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState("");

  const clearErrors = () => setErrors({});
  const clearSuccess = () => setSuccessMessage("");

  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
    clearErrors();
  };

  const handleError = (newErrors: FormErrors) => {
    setErrors(newErrors);
    clearSuccess();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-2 sm:p-4 lg:p-6">
      {showConfetti && <Confetti />}

      <Card className="w-full max-w-6xl shadow-2xl border-0 bg-white/80 backdrop-blur-sm mx-auto">
        <CardHeader className="text-center space-y-4 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Créer un compte
          </CardTitle>
          <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
            Choisissez votre type de compte pour commencer votre aventure
          </p>
        </CardHeader>

        <CardContent className="px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8">
          {/* Success Message */}
          {successMessage && (
            <Alert className="mb-4 sm:mb-6 border-green-200 bg-green-50 animate-in slide-in-from-top-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 text-sm sm:text-base">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* General Error */}
          {errors.general && (
            <Alert className="mb-4 sm:mb-6 border-red-200 bg-red-50 animate-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 text-sm sm:text-base">
                {errors.general}
              </AlertDescription>
            </Alert>
          )}

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4 sm:space-y-6"
          >
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg h-auto">
              <TabsTrigger
                value="client"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm"
              >
                <User className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-center">
                  <span className="block sm:inline">Client</span>
                  <span className="hidden sm:inline"> / </span>
                  <span className="block sm:inline">Voyageur</span>
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="company"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm"
              >
                <Building className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-center">
                  <span className="block sm:inline">Entreprise</span>
                  <span className="hidden sm:inline"> de </span>
                  <span className="block sm:inline">Transport</span>
                </span>
              </TabsTrigger>
            </TabsList>

            {/* Client Registration */}
            <TabsContent value="client" className="space-y-4 sm:space-y-6">
              <div className="text-center mb-4 sm:mb-6">
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200 px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm"
                >
                  <User className="h-3 w-3 mr-1 sm:mr-2" />
                  Compte Client
                </Badge>
                <p className="text-xs sm:text-sm text-gray-600 mt-2 max-w-md mx-auto">
                  Réservez et achetez vos billets de transport en toute
                  simplicité
                </p>
              </div>

              <ClientRegistrationTab
                onSuccess={handleSuccess}
                onError={handleError}
                errors={errors}
                clearErrors={clearErrors}
              />
            </TabsContent>

            {/* Company Registration */}
            <TabsContent value="company" className="space-y-4 sm:space-y-6">
              <div className="text-center mb-4 sm:mb-6">
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200 px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm"
                >
                  <Building className="h-3 w-3 mr-1 sm:mr-2" />
                  Compte Entreprise
                </Badge>
                <p className="text-xs sm:text-sm text-gray-600 mt-2 max-w-md mx-auto">
                  Gérez votre flotte et vendez vos billets en ligne avec notre
                  plateforme
                </p>
              </div>

              <CompanyRegistrationTab
                onSuccess={handleSuccess}
                onError={handleError}
                errors={errors}
                clearErrors={clearErrors}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
