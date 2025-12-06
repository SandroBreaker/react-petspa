
import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { ShoppingBag, X, Plus, Trash2, ShoppingCart, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../utils/ui';
import { useToast } from '../context/ToastContext';

const PRODUCTS_DB: Product[] = [
    { id: 1, name: 'Ração Premium Adulto', category: 'food', price: 149.90, stock_quantity: 10, image: 'https://images.unsplash.com/photo-1589924691195-41432c84c161?auto=format&fit=crop&w=400&q=80', description: 'Sabor Frango.' },
    { id: 2, name: 'Mordedor Resistente', category: 'toys', price: 39.90, stock_quantity: 10, image: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=400&q=80', description: 'Borracha natural.' },
    { id: 3, name: 'Shampoo Hipoalergênico', category: 'hygiene', price: 45.00, stock_quantity: 10, image: 'https://images.unsplash.com/photo-1583947581924-860bda6a26df?auto=format&fit=crop&w=400&q=80', description: 'Aveia. 500ml.' },
    { id: 4, name: 'Coleira de Couro', category: 'accessories', price: 89.90, stock_quantity: 10, image: 'https://images.unsplash.com/photo-1605631088190-799d5eb6cc5e?auto=format&fit=crop&w=400&q=80', description: 'Tamanho M.' },
    { id: 5, name: 'Cama Nuvem', category: 'accessories', price: 219.00, stock_quantity: 5, image: 'https://images.unsplash.com/photo-1591946614720-90a587da4a36?auto=format&fit=crop&w=400&q=80', description: 'Conforto total.' },
    { id: 6, name: 'Petiscos Naturais', category: 'food', price: 25.50, stock_quantity: 20, image: 'https://images.unsplash.com/photo-1585559700398-1385b3a8aeb6?auto=format&fit=crop&w=400&q=80', description: 'Sem corantes.' }
];

export const Marketplace: React.FC = () => {
  const [cart, setCart] = useState<Product[]>([]);
  const [category, setCategory] = useState<string>('all');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const saved = localStorage.getItem('petspa_cart');
    if (saved) setCart(JSON.parse(saved));
  }, []);

  const addToCart = (p: Product) => {
    const newCart = [...cart, p];
    setCart(newCart);
    localStorage.setItem('petspa_cart', JSON.stringify(newCart));
    setIsCartOpen(true);
    toast.success('Adicionado à sacola');
  };

  const removeFromCart = (idx: number) => {
    const newCart = [...cart];
    newCart.splice(idx, 1);
    setCart(newCart);
    localStorage.setItem('petspa_cart', JSON.stringify(newCart));
  };

  const filtered = category === 'all' ? PRODUCTS_DB : PRODUCTS_DB.filter(p => p.category === category);
  const total = cart.reduce((acc, item) => acc + item.price, 0);

  const handleCheckout = () => {
    toast.success('Pedido realizado! 🎉');
    setCart([]);
    localStorage.removeItem('petspa_cart');
    setIsCartOpen(false);
  };

  return (
    <div className="container" style={{ paddingTop: 20 }}>
      <div className="market-header">
        <div>
           <h2>Boutique</h2>
           <p>Seleção exclusiva para seu pet.</p>
        </div>
        <button className="btn-cart-trigger btn-primary" onClick={() => setIsCartOpen(true)} style={{ position: 'relative' }}>
           <ShoppingBag size={20} />
           {cart.length > 0 && <span id="cart-count-badge">{cart.length}</span>}
        </button>
      </div>

      <div className="category-filters">
         {['all', 'food', 'toys', 'hygiene', 'accessories'].map(cat => (
           <button key={cat} className={`filter-btn ${category === cat ? 'active' : ''}`} onClick={() => setCategory(cat)}>
             {cat === 'all' ? 'Tudo' : cat.charAt(0).toUpperCase() + cat.slice(1)}
           </button>
         ))}
      </div>

      <div className="product-grid-boutique fade-in">
         {filtered.map((p) => (
           <div key={p.id} className="product-card-boutique">
             <div className="product-img-wrapper">
               <img src={p.image} alt={p.name} className="product-img" loading="lazy" />
             </div>
             <div className="product-info-compact">
               <span className="product-category">{p.category}</span>
               <h4 className="product-title">{p.name}</h4>
               <div className="product-bottom-row">
                 <span className="product-price">{formatCurrency(p.price)}</span>
                 <button className="btn-add-minimal" onClick={() => addToCart(p)}>
                    <Plus size={18}/>
                 </button>
               </div>
             </div>
           </div>
         ))}
      </div>

      {/* Cart Sidebar */}
      <div className={`cart-overlay ${isCartOpen ? 'open' : ''}`} onClick={() => setIsCartOpen(false)} />
      <div className={`cart-sidebar ${isCartOpen ? 'open' : ''}`} id="cart-sidebar">
         <div className="cart-header">
           <h3 style={{margin:0}}>Sua Sacola</h3>
           <button className="btn-icon-sm" onClick={() => setIsCartOpen(false)}><X size={20}/></button>
         </div>
         <div className="cart-items">
           {cart.length === 0 ? (
             <div className="empty-cart"><ShoppingCart size={32} color="#ddd" /><p>Sua sacola está vazia.</p></div>
           ) : (
             cart.map((item, i) => (
               <div key={i} className="cart-item fade-in">
                  <img src={item.image} className="cart-item-img" alt="" />
                  <div className="cart-item-info">
                     <div className="cart-item-title">{item.name}</div>
                     <div className="cart-item-price">{formatCurrency(item.price)}</div>
                  </div>
                  <button className="btn-icon-sm" style={{width:32, height:32}} onClick={() => removeFromCart(i)}><Trash2 size={14}/></button>
               </div>
             ))
           )}
         </div>
         <div className="cart-footer">
            <div className="cart-total-row"><span>Total</span><span style={{color:'var(--primary)'}}>{formatCurrency(total)}</span></div>
            <button className="btn btn-primary full-width" disabled={cart.length === 0} onClick={handleCheckout}>
               Finalizar <ChevronRight size={16} />
            </button>
         </div>
      </div>
    </div>
  );
};
