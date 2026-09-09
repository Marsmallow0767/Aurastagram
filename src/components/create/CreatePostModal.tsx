import React, { useState, useRef } from 'react';
import { usePosts } from '../../context/PostContext';
import { INSTAGRAM_FILTERS, getFilterCss } from '../../services/filters';
import { X, ArrowLeft, Image as ImageIcon, Check, MapPin, Sparkles } from 'lucide-react';

interface CreatePostModalProps {
  onClose: () => void;
  onPostCreated: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  onClose,
  onPostCreated,
}) => {
  const { createPost } = usePosts();
  const [step, setStep] = useState<'pick' | 'filter' | 'share'>('pick');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('normal');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setStep('filter');
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublish = async () => {
    if (!selectedImage) return;
    setIsSubmitting(true);
    try {
      createPost(selectedImage, caption, selectedFilter, location);
      onPostCreated();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col justify-between max-w-md mx-auto">
      <div className="w-full h-full bg-black flex flex-col justify-between text-white overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between px-4 h-13 border-b border-[#262626]">
          {step === 'pick' && (
            <>
              <button onClick={onClose} className="p-1 text-white">
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-sm font-semibold">Yeni Gönderi</h2>
              <div className="w-6" />
            </>
          )}

          {step === 'filter' && (
            <>
              <button onClick={() => setStep('pick')} className="p-1 text-white">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-sm font-semibold">Filtreler</h2>
              <button
                onClick={() => setStep('share')}
                className="text-[#0095f6] hover:text-[#1877f2] font-semibold text-sm"
              >
                İleri
              </button>
            </>
          )}

          {step === 'share' && (
            <>
              <button onClick={() => setStep('filter')} className="p-1 text-white">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-sm font-semibold">Yeni Gönderi Paylaş</h2>
              <button
                onClick={handlePublish}
                disabled={isSubmitting}
                className="text-[#0095f6] hover:text-[#1877f2] font-semibold text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Paylaşılıyor...' : 'Paylaş'}
              </button>
            </>
          )}
        </div>

        {/* STEP 1: PICK IMAGE */}
        {step === 'pick' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 rounded-full bg-[#1e1e1e] flex items-center justify-center mb-6 border border-[#333]">
              <ImageIcon className="w-12 h-12 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Fotoğraf Seç</h3>
            <p className="text-xs text-neutral-400 max-w-xs mb-6">
              Cihazınızın galerisinden veya kamerasından paylaşmak için fotoğraf seçin.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#0095f6] hover:bg-[#1877f2] text-white font-semibold text-sm px-6 py-2.5 rounded-lg active:scale-95 transition-all shadow-md"
            >
              Cihazdan Seç
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelected}
              className="hidden"
            />
          </div>
        )}

        {/* STEP 2: APPLY INSTAGRAM FILTERS */}
        {step === 'filter' && selectedImage && (
          <div className="flex-1 flex flex-col">
            {/* Live Preview */}
            <div className="w-full aspect-square bg-[#121212] overflow-hidden flex items-center justify-center">
              <img
                src={selectedImage}
                alt="Önizleme"
                className="w-full h-full object-cover transition-all duration-300"
                style={{ filter: getFilterCss(selectedFilter) }}
              />
            </div>

            {/* Filter Thumbnails Carousel */}
            <div className="flex-1 flex flex-col justify-center px-2 py-4 bg-black">
              <div className="flex items-center gap-1 mb-2 px-2 text-xs font-semibold text-neutral-400">
                <Sparkles className="w-3.5 h-3.5 text-[#0095f6]" />
                <span>Instagram Efektleri</span>
              </div>
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 px-2">
                {INSTAGRAM_FILTERS.map((f) => {
                  const isActive = selectedFilter === f.id;
                  return (
                    <div
                      key={f.id}
                      onClick={() => setSelectedFilter(f.id)}
                      className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
                    >
                      <span
                        className={`text-[11px] font-medium tracking-tight ${
                          isActive ? 'text-[#0095f6] font-bold' : 'text-neutral-400'
                        }`}
                      >
                        {f.name}
                      </span>
                      <div
                        className={`w-18 h-18 rounded-lg overflow-hidden border-2 transition-all ${
                          isActive
                            ? 'border-[#0095f6] scale-105'
                            : 'border-transparent group-hover:border-neutral-600'
                        }`}
                      >
                        <img
                          src={selectedImage}
                          alt={f.name}
                          className="w-full h-full object-cover"
                          style={{ filter: f.css }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: CAPTION & LOCATION */}
        {step === 'share' && selectedImage && (
          <div className="flex-1 flex flex-col p-4 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-18 h-18 rounded-lg overflow-hidden shrink-0 border border-neutral-800">
                <img
                  src={selectedImage}
                  alt="Önizleme"
                  className="w-full h-full object-cover"
                  style={{ filter: getFilterCss(selectedFilter) }}
                />
              </div>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Açıklama yaz... #aurastagram"
                className="flex-1 h-20 bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none resize-none"
              />
            </div>

            <div className="border-t border-[#262626] pt-3">
              <div className="flex items-center gap-2 bg-[#121212] border border-[#262626] rounded-lg px-3 py-2">
                <MapPin className="w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Konum ekle (örn. İstanbul, Türkiye)"
                  className="flex-1 bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="border-t border-[#262626] pt-4 text-xs text-neutral-400 space-y-2">
              <p>✓ Fotoğraf orijinal kalitesinde yayınlanacaktır.</p>
              <p>✓ Instagram efektiniz gönderiye kalıcı olarak uygulanır.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
