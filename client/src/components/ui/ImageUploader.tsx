import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { AlertCircle, Image, Upload, Camera } from "lucide-react";

interface ImageUploaderProps {
  onImageUpload: (image: File) => void;
  disabled?: boolean;
}

export default function ImageUploader({ onImageUpload, disabled = false }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    setError(null);

    if (!file.type.match('image.*')) {
      setError('Please upload an image file (jpg, png, etc.)');
      return;
    }

    setIsLoading(true);

    try {
      let processedFile = file;

      // Medical Triage Mode: Only compress if file is larger than 6MB
      // This allows standard high-quality phone photos (usually 3-5MB) to pass through untouched
      if (file.size > 6 * 1024 * 1024) {
        try {
          processedFile = await compressImage(file);
        } catch (err) {
          console.warn('Image compression failed, using original file', err);
          // Fallback to original file if compression fails, but check size limit
          if (file.size > 50 * 1024 * 1024) {
             setError('Image is too large (over 50MB) and could not be compressed. Please try a smaller image.');
             setIsLoading(false);
             return;
          }
        }
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
        setIsLoading(false);
        onImageUpload(processedFile);
      };
      reader.onerror = () => {
        setError('Error reading file');
        setIsLoading(false);
      };
      reader.readAsDataURL(processedFile);
    } catch (err) {
      setError('Error processing image');
      setIsLoading(false);
    }
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Increased resolution for medical detail (allows zooming)
          const MAX_WIDTH = 2560;
          const MAX_HEIGHT = 2560;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Compression failed'));
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          }, 'image/jpeg', 0.85); // High quality (85%) for medical visibility
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full mb-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
        <h4 className="text-sm font-medium text-blue-800 flex items-center">
          <Image className="h-4 w-4 mr-2" />
          Photo Guidelines:
        </h4>
        <ul className="text-xs text-blue-700 mt-1 ml-6 list-disc">
          <li>Ensure good lighting so the condition is clearly visible</li>
          <li>Capture the affected area directly and from multiple angles if possible</li>
          <li>For privacy, avoid including any identifiable features</li>
          <li>Remove socks and footwear before taking the picture</li>
        </ul>
      </div>

      <div 
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          dragActive ? 'border-primary bg-primary/10' : error ? 'border-red-300' : 'border-gray-300'
        } ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={disabled || isLoading ? undefined : handleButtonClick}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={disabled || isLoading}
        />

        {error && (
          <div className="bg-red-50 p-2 rounded-md mb-3 flex items-center">
            <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="py-6 flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-sm text-gray-600">Processing image...</p>
          </div>
        ) : preview ? (
          <div className="flex flex-col items-center">
            <div className="relative">
              <img 
                src={preview} 
                alt="Image preview" 
                className="w-full max-w-xs rounded-lg shadow-sm mb-2" 
              />
              <Button 
                variant="destructive" 
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 rounded-full"
                onClick={handleRemoveImage}
                disabled={disabled}
              >
                <span className="sr-only">Remove</span>
                ✕
              </Button>
            </div>
            <p className="text-sm text-green-600 mt-2">Image uploaded successfully</p>
            <p className="text-xs text-gray-500 mt-1">Your foot image will be analyzed by our AI system</p>
          </div>
        ) : (
          <div className="py-6">
            <div className="flex justify-center space-x-4">
              <Button variant="outline" className="flex items-center" disabled={disabled}>
                <Upload className="h-4 w-4 mr-2" />
                Upload image
              </Button>
              <Button variant="outline" className="flex items-center" disabled={disabled}>
                <Camera className="h-4 w-4 mr-2" />
                Take photo
              </Button>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              {disabled 
                ? "Image uploads are disabled at this time" 
                : "Drag and drop your foot image here, or use the buttons above"}
            </p>
            <p className="mt-1 text-xs text-gray-500">PNG, JPG, JPEG supported</p>
          </div>
        )}
      </div>
    </div>
  );
}
