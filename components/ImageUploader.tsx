
import React, { useRef } from 'react';
import { UploadIcon, XCircleIcon } from './Icons';

interface ImageUploaderProps {
  imageUrl: string | null;
  onImageChange: (file: File | null) => void;
  disabled: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ imageUrl, onImageChange, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageChange(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageChange(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleClearImage = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
    onImageChange(null);
  };

  return (
    <div className="w-full">
      <label
        htmlFor="image-upload"
        className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-800 border-gray-600 transition-colors ${!disabled && 'hover:bg-gray-700 hover:border-gray-500'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {imageUrl ? (
          <>
            <img src={imageUrl} alt="Preview" className="object-contain w-full h-full rounded-lg" />
            <button
              onClick={handleClearImage}
              className="absolute top-2 right-2 bg-gray-900/50 hover:bg-gray-900/80 text-white rounded-full p-1 transition-all"
              aria-label="Remove image"
              disabled={disabled}
            >
              <XCircleIcon className="w-6 h-6" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-400">
            <UploadIcon className="w-10 h-10 mb-3" />
            <p className="mb-2 text-sm font-semibold">Click to upload or drag and drop</p>
            <p className="text-xs">PNG, JPG, GIF, or WEBP</p>
          </div>
        )}
        <input
          id="image-upload"
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
          ref={fileInputRef}
          disabled={disabled}
        />
      </label>
    </div>
  );
};
