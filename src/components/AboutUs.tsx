
import React, { useState, useEffect } from 'react';
import { Heart, Star, Camera, ChevronDown } from 'lucide-react';

// URL base do Bucket 'site-assets' do seu projeto Supabase atualizado
const BASE_STORAGE_URL = 'https://qvkfoitbatyrwqbicwwc.supabase.co/storage/v1/object/public/site-assets'; 

// Nome da imagem de capa (faça upload de um arquivo chamado 'bg.jpg' no bucket)
const HEADER_BG = 'bg.jpg'; 

// Nomes das imagens da galeria (faça upload de '1.jpg', '2.jpg', etc)
const GALLERY_IMAGES = [
  '1.jpg', 
  '2.jpg', 
  '3.jpg', 
  '4.jpg', 
  '5.jpg', 
  '6.jpg',
];

export const AboutUs: React.FC = () => {
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    // Embaralhar as fotos aleatoriamente ao montar o componente
    const shuffled = [...GALLERY_IMAGES].sort(() => 0.5 - Math.random());
    setPhotos(shuffled);
  }, []);

  return (
    <div className="about-page fade-in">
      {/* Hero Header */}
      <div 
        className="about-hero" 
        style={{ backgroundImage: `url(${BASE_STORAGE_URL}/${HEADER_BG})` }}
      >
        <div className="about-hero-overlay">
          <div className="about-hero-content">
            <h1 className="about-title">Nossa História</h1>
            <p className="about-subtitle">Amor, dedicação e muitos rabos abanando.</p>
            <div className="about-scroll-indicator">
              <ChevronDown size={32} />
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: '-60px', position: 'relative', zIndex: 10 }}>
        {/* Card de Texto "Sobre Nós" */}
        <div className="card about-text-card">
          <div className="about-icon-header">
            <Heart fill="#FF8C42" color="#FF8C42" size={32} />
          </div>
          <h2>Quem somos nós?</h2>
          <p>
            Olá! Somos o casal fundador da PetSpa. Tudo começou quando percebemos que nossos próprios pets mereciam mais do que apenas um banho; eles mereciam uma experiência de spa.
          </p>
          <p>
            Unimos nossa paixão por animais com a vontade de criar um ambiente seguro, acolhedor e tecnologicamente moderno. Aqui, cada detalhe foi pensado com o carinho de quem também é "pai e mãe" de pet.
          </p>
          <div className="signature-block">
             <span>Com carinho,</span>
             <strong>Ana & João</strong>
          </div>
        </div>

        {/* Galeria de Fotos Aleatórias */}
        <div className="about-gallery-section">
          <h3 className="section-title text-center">Momentos Especiais</h3>
          <p className="text-center" style={{ marginBottom: 24 }}>Um pouco do nosso dia a dia e dos nossos "filhos".</p>
          
          <div className="masonry-grid">
            {photos.map((img, index) => (
              <div key={index} className="masonry-item fade-in-slide" style={{ animationDelay: `${index * 0.1}s` }}>
                <img 
                   src={`${BASE_STORAGE_URL}/${img}`} 
                   alt="Momento PetSpa" 
                   className="gallery-img"
                   onError={(e) => {
                     // Fallback visual caso a imagem não tenha sido carregada ainda
                     (e.target as HTMLImageElement).src = `https://placehold.co/600x800/FF8C42/FFF?text=Foto+${index+1}`;
                   }}
                />
                <div className="gallery-overlay">
                  <Camera size={20} color="white" />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Call to Action Final */}
        <div className="card cta-card-gradient mt-4 text-center" style={{ padding: 40, alignItems: 'center' }}>
           <Star fill="white" color="white" size={40} style={{ marginBottom: 16 }} />
           <h3 style={{ color: 'white' }}>Faça parte da nossa família</h3>
           <p style={{ color: 'rgba(255,255,255,0.9)' }}>Traga seu pet para nos conhecer pessoalmente.</p>
        </div>
      </div>
    </div>
  );
};
