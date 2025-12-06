import React, { useState } from 'react';
import { Pet, GroomingStage } from './types';
import PetCard from './components/PetCard';
import SessionView from './components/SessionView';
import { Search, Bell, Menu } from 'lucide-react';

const MOCK_PETS: Pet[] = [
  {
    id: '1',
    name: 'Paçoca',
    breed: 'Golden Retriever',
    ownerName: 'Ana Silva',
    avatarUrl: 'https://picsum.photos/id/237/200/200',
    currentStage: GroomingStage.BATHING,
    logs: [
        {
            id: '101',
            timestamp: Date.now() - 3600000,
            stage: GroomingStage.CHECK_IN,
            imageUrl: 'https://picsum.photos/id/237/400/500',
            aiAnalysis: {
                caption: "Cheguei pronto para ficar lindão! 🐾",
                tags: ["CheckIn", "Golden", "Animado"],
                mood: "Excited"
            }
        }
    ]
  },
  {
    id: '2',
    name: 'Thor',
    breed: 'Bulldog Francês',
    ownerName: 'Carlos Souza',
    avatarUrl: 'https://picsum.photos/id/1025/200/200',
    currentStage: GroomingStage.PRE_BATH,
    logs: []
  },
  {
    id: '3',
    name: 'Luna',
    breed: 'Shih Tzu',
    ownerName: 'Maria Oliveira',
    avatarUrl: 'https://picsum.photos/id/1062/200/200',
    currentStage: GroomingStage.FINISHED,
    logs: []
  }
];

const App: React.FC = () => {
  const [activePet, setActivePet] = useState<Pet | null>(null);
  const [pets, setPets] = useState<Pet[]>(MOCK_PETS);
  const [searchTerm, setSearchTerm] = useState('');

  const handlePetUpdate = (updatedPet: Pet) => {
    setPets(prev => prev.map(p => p.id === updatedPet.id ? updatedPet : p));
    setActivePet(updatedPet);
  };

  const filteredPets = pets.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (activePet) {
    return (
      <SessionView 
        pet={activePet} 
        onBack={() => setActivePet(null)} 
        onUpdatePet={handlePetUpdate} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Bar */}
      <div className="bg-white p-6 pb-4 rounded-b-3xl shadow-sm z-10">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-blue-200 shadow-lg">
                P
             </div>
             <div>
                <h1 className="text-xl font-bold text-gray-800 leading-none">PetGlow</h1>
                <p className="text-xs text-gray-400">Workspace</p>
             </div>
          </div>
          <div className="flex gap-3">
            <button className="p-2 text-gray-400 hover:text-gray-600 relative">
                <Bell size={24} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600">
                <Menu size={24} />
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar pet ou tutor..." 
            className="w-full bg-gray-100 rounded-xl py-3 pl-10 pr-4 text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-4 mt-6 overflow-x-auto no-scrollbar pb-2">
            <div className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap shadow-lg shadow-blue-200">
                Em andamento (2)
            </div>
            <div className="bg-white border border-gray-200 text-gray-600 px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap">
                Finalizados (1)
            </div>
            <div className="bg-white border border-gray-200 text-gray-600 px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap">
                Agendados (5)
            </div>
        </div>
      </div>

      {/* Pet List */}
      <div className="flex-1 p-4 pb-20">
        <h2 className="text-gray-800 font-bold mb-4 text-lg">Agenda de Hoje</h2>
        {filteredPets.map(pet => (
          <PetCard key={pet.id} pet={pet} onClick={setActivePet} />
        ))}
        
        {filteredPets.length === 0 && (
            <div className="text-center py-10 text-gray-400">
                <p>Nenhum pet encontrado.</p>
            </div>
        )}
      </div>
      
      {/* Bottom Nav (Simulated for aesthetics) */}
      <div className="bg-white border-t border-gray-200 py-3 px-6 flex justify-between items-center fixed bottom-0 left-0 right-0 text-gray-400 text-[10px] font-medium">
         <div className="flex flex-col items-center text-blue-600">
            <div className="mb-1"><Menu size={20} /></div>
            <span>Home</span>
         </div>
         <div className="flex flex-col items-center">
            <div className="mb-1"><Bell size={20} /></div>
            <span>Alertas</span>
         </div>
         <div className="flex flex-col items-center">
             {/* Profile avatar placeholder */}
            <div className="w-6 h-6 rounded-full bg-gray-200 mb-1"></div>
            <span>Perfil</span>
         </div>
      </div>
    </div>
  );
};

export default App;