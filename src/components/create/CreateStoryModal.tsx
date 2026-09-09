import React, { useState, useRef } from 'react';
import { usePosts } from '../../context/PostContext';
import { X, Camera, Check } from 'lucide-react';

interface CreateStoryModalProps {
  onClose: () => void;
  onStoryCreated: () => void;
}

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  onClose,
  onStoryCreated,
}) => {
  const { createStory } = usePosts();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublish = () => {
    if (!selectedImage) return;
    setIsSubmitting(true);
    createStory(selectedImage, caption);
    onStoryCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between max-w-md mx-auto text-white">
      {/* HEADER */}
      <div className="flex items-center justify-between p-4 z-20">
        <button onClick={onClose} className="p-1 text-white">
          <X className="w-6 h-6" />
        </button>
        <span className="text-sm font-semibold">Hikayene Ekle</span>
        {selectedImage ? (
          <button
            onClick={handlePublish}
            disabled={isSubmitting}
            className="bg-[#0095f6] text-white text-xs font-semibold px-3.5 py-1.5 rounded-full"
          >
            Paylaş
          </button>
        ) : (
          <div className="w-6" />
        )}
      </div>

      {/* BODY */}
      {!selectedImage ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 rounded-full bg-[#1e1e1e] flex items-center justify-center mb-5 border border-neutral-700">
            <Camera className="w-10 h-10 text-neutral-400" />
          </div>
          <h3 className="text-base font-semibold mb-1">Hikaye İçeriği Seç</h3>
          <p className="text-xs text-neutral-400 max-w-xs mb-6">
            Hikayen 24 saat boyunca arkadaşların tarafından görülecektir.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-white text-black font-semibold text-xs px-5 py-2.5 rounded-full hover:bg-neutral-200"
          >
            Fotoğraf Seç
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelected}
            className="hidden"
          />
        </div>
      ) : (
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          <img
            src={selectedImage}
            alt="Hikaye önizleme"
            className="w-full h-full object-contain"
          />
          <div className="absolute bottom-6 left-4 right-4">
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Hikayeye yazı ekle..."
              className="w-full bg-black/60 backdrop-blur-md border border-white/20 rounded-full py-2.5 px-4 text-xs text-white placeholder-white/70 focus:outline-none focus:border-white text-center"
            />
          </div>
        </div>
      )}
    </div>
  );
};
