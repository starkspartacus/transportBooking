"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileIcon, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUploadThing } from "@/lib/uploadthing";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";

interface FileUploadProps {
  endpoint:
    | "companyLogo"
    | "companyCover"
    | "companyGallery"
    | "busImages"
    | "stationImages"
    | "companyDocuments"
    | "profilePicture";
  value?: string | string[];
  onChange: (url: string | string[]) => void;
  maxFiles?: number;
  accept?: Record<string, string[]>;
  disabled?: boolean;
  className?: string;
}

export function FileUpload({
  endpoint,
  value,
  onChange,
  maxFiles = 1,
  accept,
  disabled = false,
  className = "",
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const { startUpload, isUploading } = useUploadThing(endpoint, {
    onClientUploadComplete: (res) => {
      if (res) {
        const urls = res.map((file) => file.url);
        if (maxFiles === 1) {
          onChange(urls[0]);
        } else {
          const currentUrls = Array.isArray(value) ? value : [];
          onChange([...currentUrls, ...urls]);
        }
        setFiles([]);
        toast({
          title: "Succès",
          description: "Fichier(s) uploadé(s) avec succès",
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

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (disabled) return;

      const newFiles = acceptedFiles.slice(0, maxFiles - files.length);
      setFiles((prev) => [...prev, ...newFiles]);
    },
    [files.length, maxFiles, disabled]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept || {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "application/pdf": [".pdf"],
    },
    maxFiles,
    disabled: disabled || isUploading,
  });

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    try {
      await startUpload(files);
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeUploadedFile = (urlToRemove: string) => {
    if (Array.isArray(value)) {
      onChange(value.filter((url) => url !== urlToRemove));
    } else {
      onChange("");
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />;
    }
    return <FileIcon className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const currentFiles = Array.isArray(value) ? value : value ? [value] : [];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"}
              ${
                disabled || isUploading
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:border-gray-400"
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-blue-600">Déposez les fichiers ici...</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  Glissez-déposez vos fichiers ici, ou cliquez pour sélectionner
                </p>
                <p className="text-sm text-gray-500">
                  {maxFiles > 1
                    ? `Jusqu'à ${maxFiles} fichiers`
                    : "1 fichier maximum"}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Files */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Fichiers sélectionnés</h4>
              <Button
                onClick={handleUpload}
                disabled={isUploading || files.length === 0}
                size="sm"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Upload en cours...
                  </>
                ) : (
                  `Uploader ${files.length} fichier(s)`
                )}
              </Button>
            </div>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <div className="flex items-center gap-2">
                    {getFileIcon(file)}
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploaded Files */}
      {currentFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-4">Fichiers uploadés</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {currentFiles.map((url, index) => (
                <div key={index} className="relative group">
                  {url.includes(".pdf") ? (
                    <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                      <FileIcon className="h-12 w-12 text-gray-500" />
                    </div>
                  ) : (
                    <div className="aspect-square relative">
                      <Image
                        src={url || "/placeholder.svg"}
                        alt={`Uploaded file ${index + 1}`}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeUploadedFile(url)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
