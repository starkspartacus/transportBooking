"use client";

import type React from "react";

import { useState } from "react";
import { useUploadThing } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Upload, X, Loader2 } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  endpoint:
    | "companyLogo"
    | "companyCover"
    | "companyGallery"
    | "busImages"
    | "stationImages"
    | "profilePicture";
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  className?: string;
  aspectRatio?: "square" | "video" | "auto";
}

export function ImageUpload({
  endpoint,
  value,
  onChange,
  disabled = false,
  className = "",
  aspectRatio = "auto",
}: ImageUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const { startUpload, isUploading } = useUploadThing(endpoint, {
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        onChange(res[0].url);
        setFile(null);
        setPreview(null);
        toast({
          title: "Succès",
          description: "Image uploadée avec succès",
        });
      }
    },
    onUploadError: (error) => {
      toast({
        title: "Erreur d'upload",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      await startUpload([file]);
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const handleRemove = () => {
    onChange("");
    setFile(null);
    setPreview(null);
  };

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "square":
        return "aspect-square";
      case "video":
        return "aspect-video";
      default:
        return "aspect-auto";
    }
  };

  return (
    <Card className={className}>
      <CardContent className="p-6">
        {value || preview ? (
          <div className="space-y-4">
            <div
              className={`relative ${getAspectRatioClass()} w-full max-w-sm mx-auto`}
            >
              <Image
                src={preview || value || "/placeholder.svg"}
                alt="Upload preview"
                fill
                className="object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleRemove}
                disabled={disabled || isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {preview && (
              <div className="flex justify-center">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || !file}
                  size="sm"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Upload en cours...
                    </>
                  ) : (
                    "Confirmer l'upload"
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
            <div className="space-y-2">
              <Button
                variant="outline"
                asChild
                disabled={disabled || isUploading}
              >
                <label className="cursor-pointer">
                  Sélectionner une image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={disabled || isUploading}
                  />
                </label>
              </Button>
              <p className="text-sm text-gray-500">PNG, JPG, GIF jusqu'à 4MB</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
