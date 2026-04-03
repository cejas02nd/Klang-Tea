/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Coffee, IceCream, Plus, Minus, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface MenuItem {
  id: string;
  name: string;
  description: string;
  image: string;
}

interface SizePrice {
  size: string;
  price: number;
}

interface CartItem {
  id: string;
  menuId: string;
  name: string;
  size: string;
  price: number;
  quantity: number;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'cokefloat',
    name: 'Cokefloat',
    description: 'Refreshing Coca-Cola topped with creamy vanilla ice cream.',
    image: 'https://picsum.photos/seed/cokefloat/400/400'
  },
  {
    id: 'chuckiefloat',
    name: 'Chuckiefloat',
    description: 'Rich Chuckie chocolate drink topped with creamy vanilla ice cream.',
    image: 'https://picsum.photos/seed/chuckiefloat/400/400'
  }
];

const SIZES: SizePrice[] = [
  { size: '8oz', price: 29 },
  { size: '12oz', price: 39 },
  { size: '16oz', price: 49 }
];

export default function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [cokefloatImage, setCokefloatImage] = useState<string | null>(null);
  const [chuckiefloatImage, setChuckiefloatImage] = useState<string | null>(null);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(true);
  const [isGeneratingMenuImages, setIsGeneratingMenuImages] = useState(true);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [showPosterModal, setShowPosterModal] = useState(false);

  useEffect(() => {
    generateLogo();
    generateMenuImages();
  }, []);

  async function generateMenuPoster() {
    setIsGeneratingPoster(true);
    setShowPosterModal(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: `Create a high-quality, professional menu poster for a business named "KLang Tea with Me". 
              The menu should clearly list:
              1. Cokefloat
              2. Chuckiefloat
              
              Prices for both:
              - 8oz = 29 pesos
              - 12oz = 39 pesos
              - 16oz = 49 pesos
              
              Design style: Modern, elegant, with warm brown and cream tones. Include appetizing illustrations of float drinks with ice cream. The layout should be vertical, suitable for a long bond paper (portrait). Use clear, bold typography for the business name and prices. High resolution, professional graphic design aesthetic.`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "9:16",
          }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setPosterUrl(`data:image/png;base64,${part.inlineData.data}`);
          break;
        }
      }
    } catch (error) {
      console.error("Error generating poster:", error);
    } finally {
      setIsGeneratingPoster(false);
    }
  }

  async function generateLogo() {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: 'A minimalist and elegant logo for a business named "KLang Tea with Me". The logo should feature a stylized tea cup or a float drink with a scoop of ice cream. Use warm brown and cream colors. Professional, clean, and modern aesthetic. White background.',
            },
          ],
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setLogoUrl(`data:image/png;base64,${part.inlineData.data}`);
          break;
        }
      }
    } catch (error) {
      console.error("Error generating logo:", error);
    } finally {
      setIsGeneratingLogo(false);
    }
  }

  async function generateMenuImages() {
    try {
      // Generate Cokefloat Image
      const cokeResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: 'A high-quality, professional food photography of a Cokefloat. A tall glass filled with dark sparkling cola, topped with a large, creamy scoop of vanilla ice cream. Condensation on the glass, refreshing look, studio lighting, neutral background.',
            },
          ],
        },
      });

      for (const part of cokeResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setCokefloatImage(`data:image/png;base64,${part.inlineData.data}`);
          break;
        }
      }

      // Generate Chuckiefloat Image
      const chuckieResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: 'A high-quality, professional food photography of a Chuckiefloat. A tall glass filled with rich chocolate milk drink, topped with a large, creamy scoop of vanilla ice cream. Studio lighting, delicious look, neutral background.',
            },
          ],
        },
      });

      for (const part of chuckieResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setChuckiefloatImage(`data:image/png;base64,${part.inlineData.data}`);
          break;
        }
      }
    } catch (error) {
      console.error("Error generating menu images:", error);
    } finally {
      setIsGeneratingMenuImages(false);
    }
  }

  const menuItemsWithImages = MENU_ITEMS.map(item => ({
    ...item,
    image: item.id === 'cokefloat' ? (cokefloatImage || item.image) : (chuckiefloatImage || item.image)
  }));

  const addToCart = (item: MenuItem, sizePrice: SizePrice) => {
    const existingIndex = cart.findIndex(c => c.menuId === item.id && c.size === sizePrice.size);
    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, {
        id: Math.random().toString(36).substr(2, 9),
        menuId: item.id,
        name: item.name,
        size: sizePrice.size,
        price: sizePrice.price,
        quantity: 1
      }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = () => {
    setOrderPlaced(true);
    setCart([]);
    setTimeout(() => setOrderPlaced(false), 3000);
  };

  return (
    <div className="min-h-screen bg-brand-secondary/30 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center overflow-hidden border border-brand-primary/20">
              {isGeneratingLogo ? (
                <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
              ) : logoUrl ? (
                <img src={logoUrl} alt="KLang Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <Coffee className="w-6 h-6 text-brand-primary" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-brand-primary leading-tight">KLang Tea with Me</h1>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Floats & Refreshments</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={generateMenuPoster}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-full text-sm font-bold hover:bg-brand-primary/90 transition-all shadow-md shadow-brand-primary/20"
            >
              <IceCream className="w-4 h-4" />
              Generate Poster
            </button>

            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-brand-primary hover:bg-brand-primary/5 rounded-full transition-colors"
            >
            <ShoppingCart className="w-6 h-6" />
            {cart.length > 0 && (
              <span className="absolute top-0 right-0 bg-brand-accent text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            Sweetness in Every Sip
          </motion.h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Experience our signature Cokefloat and Chuckiefloat, perfectly chilled and topped with our premium vanilla ice cream.
          </p>
        </div>

        {/* Menu Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {menuItemsWithImages.map((item) => (
            <motion.div 
              key={item.id}
              whileHover={{ y: -5 }}
              className="bg-white rounded-3xl overflow-hidden shadow-xl shadow-brand-primary/5 border border-brand-primary/5"
            >
              <div className="h-64 overflow-hidden relative bg-gray-100 flex items-center justify-center">
                {isGeneratingMenuImages && !((item.id === 'cokefloat' && cokefloatImage) || (item.id === 'chuckiefloat' && chuckiefloatImage)) ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
                    <span className="text-xs text-gray-400 font-medium uppercase">Generating AI Image...</span>
                  </div>
                ) : (
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                  <h3 className="text-3xl font-bold text-white">{item.name}</h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-8">{item.description}</p>
                
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Select Size</p>
                  <div className="grid grid-cols-3 gap-3">
                    {SIZES.map((sp) => (
                      <button
                        key={sp.size}
                        onClick={() => addToCart(item, sp)}
                        className="group flex flex-col items-center p-3 rounded-2xl border-2 border-brand-primary/10 hover:border-brand-primary hover:bg-brand-primary/5 transition-all"
                      >
                        <span className="text-sm font-bold text-gray-500 group-hover:text-brand-primary">{sp.size}</span>
                        <span className="text-lg font-bold text-brand-primary">₱{sp.price}</span>
                        <div className="mt-2 p-1 bg-brand-primary text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="w-4 h-4" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6 text-brand-primary" />
                  Your Order
                </h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <Minus className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                    <IceCream className="w-16 h-16 opacity-20" />
                    <p>Your cart is empty</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden">
                        <img 
                          src={MENU_ITEMS.find(m => m.id === item.menuId)?.image} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold">{item.name}</h4>
                        <p className="text-sm text-gray-500">{item.size} • ₱{item.price}</p>
                      </div>
                      <div className="flex items-center gap-3 bg-gray-100 rounded-full px-2 py-1">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white rounded-full transition-colors">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-bold w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white rounded-full transition-colors">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="p-2 text-red-400 hover:text-red-600">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="p-6 border-t bg-gray-50">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-gray-500 font-medium">Total Amount</span>
                  <span className="text-3xl font-bold text-brand-primary">₱{total}</span>
                </div>
                <button 
                  disabled={cart.length === 0}
                  onClick={handleCheckout}
                  className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-primary/20"
                >
                  Place Order
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Order Success Notification */}
      <AnimatePresence>
        {orderPlaced && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-green-600 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 z-50"
          >
            <CheckCircle2 className="w-6 h-6" />
            <span className="font-bold">Order placed successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Poster Modal */}
      <AnimatePresence>
        {showPosterModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPosterModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh]"
              >
                <div className="p-6 border-b flex items-center justify-between">
                  <h3 className="text-xl font-bold text-brand-primary">Menu Poster (Long Format)</h3>
                  <button onClick={() => setShowPosterModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                    <Minus className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center bg-gray-50">
                  {isGeneratingPoster ? (
                    <div className="flex flex-col items-center gap-4 py-20">
                      <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
                      <p className="text-brand-primary font-bold animate-pulse">Crafting your professional menu...</p>
                      <p className="text-xs text-gray-400">This takes about 10-20 seconds</p>
                    </div>
                  ) : posterUrl ? (
                    <div className="space-y-6 w-full flex flex-col items-center">
                      <div className="relative group shadow-2xl rounded-lg overflow-hidden border-4 border-white">
                        <img 
                          src={posterUrl} 
                          alt="Menu Poster" 
                          className="w-full h-auto max-h-[60vh] object-contain"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                      </div>
                      <div className="flex flex-col gap-3 w-full">
                        <a 
                          href={posterUrl} 
                          download="KLang-Tea-With-Me-Menu.png"
                          className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold text-center hover:bg-brand-primary/90 transition-all shadow-lg"
                        >
                          Download JPEG/PNG
                        </a>
                        <p className="text-center text-xs text-gray-400">
                          Format: 9:16 (Portrait) • High Resolution
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-red-500">Failed to generate poster. Please try again.</p>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-12 py-8 border-t border-brand-primary/10 text-center">
        <p className="text-gray-400 text-sm">© 2026 KLang Tea with Me. All rights reserved.</p>
      </footer>
    </div>
  );
}
