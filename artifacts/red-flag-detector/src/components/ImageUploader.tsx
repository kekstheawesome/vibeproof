import { useState, useCallback, useRef } from "react";
import { UploadCloud, Image as ImageIcon, X } from "lucide-react";
import { cn, fileToBase64 } from "@/lib/utils";

interface ImageUploaderProps {
  onImageSelected: (base64: string | null) => void;
  disabled?: boolean;
}

export function ImageUploader({ onImageSelected, disabled }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }
    
    // Create local preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    
    // Convert to base64 for API
    try {
      const base64 = await fileToBase64(file);
      onImageSelected(base64);
    } catch (err) {
      console.error("Failed to convert image", err);
      alert("Failed to process image.");
      clearImage();
    }
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [disabled]);

  const clearImage = () => {
    setPreview(null);
    onImageSelected(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (preview) {
    return (
      <div className="relative rounded-2xl overflow-hidden border border-border bg-muted/30 group">
        <img 
          src={preview} 
          alt="Screenshot preview" 
          className="w-full max-h-[400px] object-contain"
        />
        {!disabled && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              type="button"
              onClick={clearImage}
              className="bg-white/90 text-red-600 px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-white transition-colors shadow-lg"
            >
              <X className="w-4 h-4" /> Remove Image
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => !disabled && fileInputRef.current?.click()}
      className={cn(
        "border-2 border-dashed rounded-2xl p-10 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer min-h-[240px]",
        isDragging 
          ? "border-primary bg-primary/5 scale-[1.02]" 
          : "border-border hover:border-primary/50 hover:bg-muted/50",
        disabled && "opacity-50 cursor-not-allowed hover:border-border hover:bg-transparent"
      )}
    >
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files?.[0]) handleFile(e.target.files[0]);
        }}
        disabled={disabled}
      />
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
        <UploadCloud className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-display font-semibold text-foreground mb-1">
        Upload a screenshot
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        Drag and drop your image here, or click to browse files. We'll analyze the conversation for you.
      </p>
    </div>
  );
}
