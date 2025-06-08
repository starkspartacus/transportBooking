"use client";

// components/patron/route-management.tsx
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Country {
  code: string;
  name: string;
}

interface City {
  name: string;
}

interface Commune {
  name: string;
}

const RouteManagement = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedCommune, setSelectedCommune] = useState<string>("");

  useEffect(() => {
    // Fetch countries (replace with your actual API call)
    const fetchCountries = async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setCountries([
        { code: "FR", name: "France" },
        { code: "US", name: "United States" },
        { code: "CA", name: "Canada" },
      ]);
    };

    fetchCountries();
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      // Fetch cities based on selected country (replace with your actual API call)
      const fetchCities = async () => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));
        setCities([{ name: "Paris" }, { name: "Lyon" }, { name: "Marseille" }]);
      };

      fetchCities();
    } else {
      setCities([]);
      setSelectedCity("");
      setSelectedCommune("");
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedCity) {
      // Fetch communes based on selected city (replace with your actual API call)
      const fetchCommunes = async () => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));
        setCommunes([
          { name: "1st arrondissement" },
          { name: "2nd arrondissement" },
          { name: "3rd arrondissement" },
        ]);
      };

      fetchCommunes();
    } else {
      setCommunes([]);
      setSelectedCommune("");
    }
  }, [selectedCity]);

  const handleCountryChange = (value: string) => {
    if (value && value !== "default") {
      setSelectedCountry(value);
      setSelectedCity("");
      setSelectedCommune("");
    }
  };

  const handleCityChange = (value: string) => {
    if (value && value !== "default") {
      setSelectedCity(value);
      setSelectedCommune("");
    }
  };

  const handleCommuneChange = (value: string) => {
    if (value && value !== "default") {
      setSelectedCommune(value);
    }
  };

  return (
    <div>
      <Select onValueChange={handleCountryChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select Country" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Sélectionner...</SelectItem>
          {countries.map((country) => (
            <SelectItem key={country.code} value={country.code || "unknown"}>
              {country.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select onValueChange={handleCityChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select City" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Sélectionner...</SelectItem>
          {cities.map((city) => (
            <SelectItem key={city.name} value={city.name || "unknown"}>
              {city.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select onValueChange={handleCommuneChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select Commune" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Sélectionner...</SelectItem>
          {communes.map((commune) => (
            <SelectItem key={commune.name} value={commune.name || "unknown"}>
              {commune.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <p>Selected Country: {selectedCountry}</p>
      <p>Selected City: {selectedCity}</p>
      <p>Selected Commune: {selectedCommune}</p>
    </div>
  );
};

export default RouteManagement;
