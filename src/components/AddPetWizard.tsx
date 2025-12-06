
import React, { useState } from 'react';
import { ChevronLeft, Dog, Camera, Upload, Check } from 'lucide-react';
import { Pet } from '../types';

interface AddPetWizardProps {
  onClose: () => void;
  onComplete: (petData: Partial<Pet>) => void;
}

// Mock Data for Breeds
const BREEDS = [
  { id: 'akita', name: 'Akita', img: 'https://images.unsplash.com/photo-1534361960057-19889db9621e?auto=format&fit=crop&w=150&q=80' },
  { id: 'beagle', name: 'Beagle', img: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=150&q=80' },
  { id: 'bichon', name: 'Bichon Frise', img: 'https://images.unsplash.com/photo-1591946614720-90a587da4a36?auto=format&fit=crop&w=150&q=80' },
  { id: 'collie', name: 'Border Collie', img: 'https://images.unsplash.com/photo-1561037404-61cd46aa615b?auto=format&fit=crop&w=150&q=80' },
  { id: 'boxer', name: 'Boxer', img: 'https://images.unsplash.com/photo-1543071220-6ee5bf7186dc?auto=format&fit=crop&w=150&q=80' },
  { id: 'chow', name: 'Chow Chow', img: 'https://images.unsplash.com/photo-1629740032638-d7568c6dae36?auto=format&fit=crop&w=150&q=80' },
];

export const AddPetWizard: React.FC<AddPetWizardProps> = ({ onClose, onComplete }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 5; // Simplified from 9 for demo
  
  const [formData, setFormData] = useState<Partial<Pet>>({
    name: '',
    breed: '',
    size_category: 'medium'
  });

  const handleNext = () => setStep(p => Math.min(p + 1, totalSteps));
  const handleBack = () => step === 1 ? onClose() : setStep(p => p - 1);

  const handleSubmit = () => {
    onComplete(formData);
  };

  const renderProgressBar = () => (
    <div className="progress-container">
       <div className="step-counter">Step {step}/{totalSteps}</div>
       <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${(step/totalSteps)*100}%` }}></div>
       </div>
    </div>
  );

  return (
    <div className="full-height fade-enter" style={{ background: 'var(--bg-app)' }}>
      {/* Header */}
      <div className="wizard-header">
         <button onClick={handleBack} className="btn-secondary"><ChevronLeft /></button>
         <h3 style={{margin:0}}>Add Pet Profile</h3>
         <div style={{width:24}}></div>
      </div>
      
      {renderProgressBar()}

      {/* Step Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* STEP 1: BREED (Mapped to Figma Step 2/9) */}
        {step === 1 && (
           <>
             <h2 className="text-center mb-4">Select Breed</h2>
             <div className="breed-grid">
                {BREEDS.map(b => (
                   <div 
                     key={b.id} 
                     className={`breed-card ${formData.breed === b.name ? 'selected' : ''}`}
                     onClick={() => setFormData({...formData, breed: b.name})}
                   >
                      <img src={b.img} alt={b.name} className="breed-img" />
                      <div>{b.name}</div>
                   </div>
                ))}
             </div>
             <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: 24, background: 'var(--bg-app)' }}>
                <button className="btn btn-primary" disabled={!formData.breed} onClick={handleNext}>Continue</button>
                <button className="btn btn-secondary mt-2" onClick={handleNext}>Skip for now</button>
             </div>
           </>
        )}

        {/* STEP 2: NAME (Mapped to Figma Step 3/9) */}
        {step === 2 && (
           <div className="container" style={{ textAlign: 'center' }}>
             <h4 style={{ color: 'var(--text-secondary)' }}>Name</h4>
             
             <div style={{ margin: '40px auto', position: 'relative', width: 140, height: 140 }}>
                <div style={{ 
                    width: '100%', height: '100%', borderRadius: '50%', 
                    border: '2px solid #334155', padding: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                   {BREEDS.find(b => b.name === formData.breed)?.img ? (
                       <img src={BREEDS.find(b => b.name === formData.breed)?.img} style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover'}} />
                   ) : (
                       <Dog size={60} color="#64748B"/>
                   )}
                </div>
                <button className="floating-icon-btn" style={{ width:40, height:40, top: 'auto', bottom: 0, left: 'auto', right: 0, transform: 'none', background: 'white', border: 'none' }}>
                   <Camera size={20} color="var(--primary)"/>
                </button>
             </div>

             <h2 className="mb-4">What's your pet's name?</h2>
             <input 
               type="text" 
               className="input-modern" 
               placeholder="Your pet's name"
               value={formData.name}
               onChange={e => setFormData({...formData, name: e.target.value})}
               autoFocus
             />

             <div style={{ marginTop: 'auto', paddingBottom: 24 }}>
                <button className="btn btn-primary" disabled={!formData.name} onClick={handleNext}>Continue</button>
             </div>
           </div>
        )}

        {/* STEP 3: SIZE (Mapped to Figma Step 5/9) */}
        {step === 3 && (
            <div className="container" style={{ textAlign: 'center' }}>
              <h4 style={{ color: 'var(--text-secondary)' }}>Size</h4>
              
              <div style={{ margin: '30px auto', width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', border: '4px solid #232D42' }}>
                 <img src={BREEDS.find(b => b.name === formData.breed)?.img || ''} style={{width:'100%', height:'100%', objectFit:'cover'}} />
              </div>

              <h2>What's your pet's size?</h2>
              <p>Automatic selection based on breed.</p>

              <div className="size-selector mt-4">
                 <div className={`size-card ${formData.size_category === 'small' ? 'selected' : ''}`} onClick={() => setFormData({...formData, size_category: 'small'})}>
                    <div className="size-icon-circle"><Dog size={16}/></div>
                    <strong>Small</strong>
                    <small>under 14kg</small>
                 </div>
                 <div className={`size-card ${formData.size_category === 'medium' ? 'selected' : ''}`} onClick={() => setFormData({...formData, size_category: 'medium'})}>
                    <div className="size-icon-circle"><Dog size={24}/></div>
                    <strong>Medium</strong>
                    <small>14-25kg</small>
                 </div>
                 <div className={`size-card ${formData.size_category === 'large' ? 'selected' : ''}`} onClick={() => setFormData({...formData, size_category: 'large'})}>
                    <div className="size-icon-circle"><Dog size={32}/></div>
                    <strong>Large</strong>
                    <small>over 25kg</small>
                 </div>
              </div>

              <div style={{ marginTop: 'auto', paddingBottom: 24 }}>
                <button className="btn btn-primary" onClick={handleSubmit}>Finish</button>
              </div>
            </div>
        )}

        {/* Placeholder for other steps */}
        {step > 3 && (
            <div className="container text-center pt-8">
               <h2>All set!</h2>
               <p>Profile ready to be created.</p>
               <button className="btn btn-primary mt-4" onClick={handleSubmit}>Save Profile</button>
            </div>
        )}

      </div>
    </div>
  );
};
