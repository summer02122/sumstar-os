"use client";
import React, { useState, useEffect } from 'react';
import { 
  Search, ShoppingBag, User, Heart, Star, ArrowRight, 
  Truck, ShieldCheck, RefreshCw, Clock, Quote, 
  Menu, X, ChevronLeft, ChevronRight
} from 'lucide-react';

export default function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        
        /* Softer shadows matching the reference */
        .shadow-soft {
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
        }
        .shadow-soft-hover:hover {
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
        }
      `}} />

      {/* NAVBAR */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm py-3' : 'bg-white py-5 border-b border-slate-100'}`}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-lg">
               <ShoppingBag size={18} />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">ShopMate</span>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-slate-900 font-medium transition-colors">Home</a>
            <a href="#" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Shop</a>
            <a href="#" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Categories</a>
            <a href="#" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">About</a>
          </div>

          <div className="hidden md:flex items-center space-x-5 text-slate-600">
            <button className="hover:text-blue-600 transition-colors"><Search size={22} strokeWidth={1.5} /></button>
            <button className="hover:text-blue-600 transition-colors relative">
              <User size={22} strokeWidth={1.5} />
            </button>
            <button className="hover:text-blue-600 transition-colors relative">
              <ShoppingBag size={22} strokeWidth={1.5} />
              <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">1</span>
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-slate-900" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-24 px-4 flex flex-col space-y-4 md:hidden">
            <a href="#" className="text-lg font-medium text-slate-900 p-2 border-b border-slate-100">Home</a>
            <a href="#" className="text-lg font-medium text-slate-900 p-2 border-b border-slate-100">Shop</a>
            <a href="#" className="text-lg font-medium text-slate-900 p-2 border-b border-slate-100">Categories</a>
            <a href="#" className="text-lg font-medium text-slate-900 p-2 border-b border-slate-100">About</a>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="pt-28 pb-10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#f4f7f9] rounded-3xl overflow-hidden flex flex-col lg:flex-row items-center">
            
            {/* Hero Left */}
            <div className="p-8 lg:p-16 lg:w-[45%] flex flex-col justify-center animate-fade-in z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/60 text-blue-800 text-xs font-bold uppercase tracking-wider mb-6 w-max">
                 <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                 NEW ARRIVALS
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-bold text-slate-900 leading-[1.15] mb-6">
                Discover The Best <br/>
                Products for You
              </h1>
              <p className="text-base text-slate-500 mb-8 leading-relaxed max-w-md">
                Explore our wide range of high-quality products at affordable prices. Shop now and enjoy the best deals!
              </p>
              
              <div className="flex flex-wrap items-center gap-4 mb-10">
                <button className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all flex items-center gap-2">
                  Shop Now <ArrowRight size={18} />
                </button>
                <button className="px-8 py-3.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg font-medium transition-all">
                  Explore Deals
                </button>
              </div>

              {/* Trust Indicator */}
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[11,12,13,44].map((i) => (
                    <img key={i} src={`https://i.pravatar.cc/100?img=${i}`} alt="Customer" className="w-8 h-8 rounded-full border-2 border-[#f4f7f9] object-cover" />
                  ))}
                </div>
                <div className="text-sm text-slate-500">
                   Trusted by <span className="font-semibold text-slate-900">10,000+</span> Happy Customers
                </div>
              </div>
            </div>

            {/* Hero Right - Lifestyle Image matching reference layout */}
            <div className="lg:w-[55%] relative h-[400px] lg:h-[600px] w-full bg-[#f4f7f9] flex items-center justify-center p-8 animate-fade-in" style={{animationDelay: '200ms'}}>
               <img 
                  src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1000&auto=format&fit=crop" 
                  alt="Premium Backpack" 
                  className="object-contain w-full max-h-[85%] drop-shadow-2xl mix-blend-multiply rounded-xl"
               />
            </div>
          </div>
        </div>
      </section>

      {/* SERVICE FEATURES */}
      <section className="py-6">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border border-slate-100 rounded-2xl p-6 flex flex-wrap justify-between items-center gap-6 shadow-sm">
            {[
              { icon: Truck, title: "Free Shipping", desc: "On orders over $50" },
              { icon: ShieldCheck, title: "Secure Payment", desc: "100% secure payment" },
              { icon: RefreshCw, title: "Easy Returns", desc: "30 days return policy" },
              { icon: Clock, title: "24/7 Support", desc: "Dedicated support" }
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-4 animate-fade-in flex-1 min-w-[200px]" style={{animationDelay: `${idx * 100}ms`}}>
                <div className="w-10 h-10 rounded-full bg-[#f4f7f9] text-blue-600 flex items-center justify-center shrink-0">
                  <feature.icon size={20} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-slate-900 font-bold text-sm mb-0.5">{feature.title}</h3>
                  <p className="text-slate-400 text-xs">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SHOP BY CATEGORIES */}
      <section className="py-12 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-10 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-900">Shop by Categories</h2>
            <a href="#" className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 font-medium transition-all">
              View All Categories <ArrowRight size={16} />
            </a>
          </div>

          <div className="flex overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 gap-6 sm:gap-8 justify-between hide-scrollbar">
            {[
              { name: "Electronics", color: "bg-[#e8f1f8]", img: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=200&auto=format&fit=crop" },
              { name: "Fashion", color: "bg-[#fdf3f3]", img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=200&auto=format&fit=crop" },
              { name: "Home & Kitchen", color: "bg-[#fcf5e9]", img: "https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=200&auto=format&fit=crop" },
              { name: "Beauty", color: "bg-[#f2eff6]", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=200&auto=format&fit=crop" },
              { name: "Sports", color: "bg-[#eef8f5]", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=200&auto=format&fit=crop" },
              { name: "Accessories", color: "bg-[#fef4ed]", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=200&auto=format&fit=crop" },
            ].map((cat, idx) => (
              <div key={idx} className="flex flex-col items-center group cursor-pointer animate-fade-in min-w-[110px] md:min-w-[130px]" style={{animationDelay: `${idx * 50}ms`}}>
                <div className={`w-28 h-28 md:w-32 md:h-32 rounded-full ${cat.color} mb-4 flex items-center justify-center p-6 transition-transform duration-300 group-hover:-translate-y-1`}>
                  <img 
                    src={cat.img} 
                    alt={cat.name} 
                    className="w-full h-full object-contain mix-blend-multiply drop-shadow-sm"
                  />
                </div>
                <h3 className="text-slate-800 text-sm font-semibold">{cat.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BEST SELLING PRODUCTS */}
      <section className="py-12 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-10 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-900">Best Selling Products</h2>
            <a href="#" className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 font-medium transition-all">
              View All Products <ArrowRight size={16} />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { name: "Smart Watch Series 5", price: 89.99, oldPrice: 129.99, rating: 4.5, reviews: 125, img: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=400&auto=format&fit=crop" },
              { name: "Wireless Headphones", price: 59.99, oldPrice: 65.99, rating: 4.7, reviews: 98, img: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=400&auto=format&fit=crop" },
              { name: "Travel Backpack", price: 39.99, oldPrice: 69.99, rating: 4.6, reviews: 156, img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=400&auto=format&fit=crop" },
              { name: "Running Shoes", price: 49.99, oldPrice: 79.99, rating: 4.4, reviews: 78, img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400&auto=format&fit=crop" },
              { name: "Luxury Perfume", price: 29.99, oldPrice: 49.99, rating: 4.8, reviews: 64, img: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=400&auto=format&fit=crop" },
            ].map((product, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-slate-100 p-4 shadow-soft hover:shadow-lg transition-all duration-300 animate-fade-in flex flex-col group" style={{animationDelay: `${idx * 100}ms`}}>
                {/* Image Box */}
                <div className="relative h-56 mb-4 bg-[#f8fafc] rounded-lg flex items-center justify-center p-4">
                  <img 
                    src={product.img} 
                    alt={product.name}
                    className="max-h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                  />
                  <button className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 shadow-sm transition-colors">
                    <Heart size={16} strokeWidth={2} />
                  </button>
                </div>
                
                {/* Content Box */}
                <div className="flex flex-col flex-grow">
                  <h3 className="text-sm font-bold text-slate-900 mb-1 line-clamp-1">{product.name}</h3>
                  <div className="flex items-center gap-1 mb-2">
                    <Star size={12} className="text-amber-400 fill-current" />
                    <span className="text-xs font-bold text-slate-700">{product.rating}</span>
                    <span className="text-xs text-slate-400">({product.reviews})</span>
                  </div>
                  <div className="flex items-center gap-2 mb-4 mt-auto">
                    <span className="text-base font-bold text-slate-900">${product.price}</span>
                    {product.oldPrice && (
                      <span className="text-xs text-slate-400 line-through">${product.oldPrice}</span>
                    )}
                  </div>
                  
                  <button className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mt-auto">
                    <ShoppingBag size={16} /> Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROMOTIONAL BANNER */}
      <section className="py-12 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#fcfaf7] border border-[#f0ebe1] rounded-2xl overflow-hidden flex flex-col md:flex-row items-center relative min-h-[340px]">
            {/* Subtle background overlay */}
            <div className="absolute inset-0 bg-blue-50/40 mix-blend-multiply pointer-events-none"></div>
            
            <div className="p-8 md:p-14 md:w-1/2 flex flex-col justify-center items-start relative z-10">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                Special Offer
              </span>
              <h2 className="text-4xl md:text-[44px] font-bold text-slate-900 mb-4 leading-tight">
                Up to 50% Off
              </h2>
              <p className="text-slate-500 mb-8 text-sm max-w-sm leading-relaxed">
                Limited time offer on selected items. Hurry up and grab the best deals!
              </p>
              <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2">
                Shop the Sale <ArrowRight size={16} />
              </button>
            </div>
            
            <div className="md:w-1/2 h-64 md:h-auto self-stretch relative flex items-center justify-center p-8 z-10">
              {/* Product composition image */}
              <img 
                src="https://images.unsplash.com/photo-1540932239986-30128078f3b5?q=80&w=800&auto=format&fit=crop" 
                alt="Promo Deals" 
                className="max-h-[90%] object-contain drop-shadow-xl rounded-xl mix-blend-multiply"
              />
              {/* Tag overlay similar to reference */}
              <div className="absolute top-1/2 right-1/4 transform translate-x-1/4 -translate-y-1/2 bg-blue-600 text-white p-4 rounded-lg rotate-12 shadow-lg">
                 <span className="block font-bold text-2xl leading-none mb-1">50%</span>
                 <span className="block text-sm font-semibold uppercase text-blue-100 text-center">OFF</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CUSTOMER REVIEWS */}
      <section className="py-16 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-900">What Our Customers Say</h2>
          </div>

          <div className="relative">
             {/* Navigation Arrows (Desktop) */}
             <button className="absolute left-0 top-1/2 -translate-y-1/2 -ml-5 w-10 h-10 bg-white rounded-full shadow-md items-center justify-center text-slate-400 hover:text-blue-600 z-10 border border-slate-100 hidden lg:flex">
                <ChevronLeft size={20} />
             </button>
             <button className="absolute right-0 top-1/2 -translate-y-1/2 -mr-5 w-10 h-10 bg-white rounded-full shadow-md items-center justify-center text-slate-400 hover:text-blue-600 z-10 border border-slate-100 hidden lg:flex">
                <ChevronRight size={20} />
             </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:px-8">
              {[
                { name: "John D.", text: "Amazing products and fast delivery! ShopMate is my go-to store for all my needs.", img: "https://i.pravatar.cc/150?img=11" },
                { name: "Sarah M.", text: "Great quality at affordable prices. The customer support is also very responsive.", img: "https://i.pravatar.cc/150?img=44" },
                { name: "Michael T.", text: "Very happy with my purchase. Highly recommend ShopMate to everyone!", img: "https://i.pravatar.cc/150?img=12" },
              ].map((review, idx) => (
                <div key={idx} className="bg-[#f8fbf9] border border-[#f0f5f2] p-6 rounded-2xl animate-fade-in shadow-sm" style={{animationDelay: `${idx * 150}ms`}}>
                  <div className="flex items-start gap-3 mb-6">
                     <div className="bg-blue-100/50 p-2 rounded-full text-blue-500 shrink-0">
                        <Quote size={16} fill="currentColor" stroke="none" />
                     </div>
                     <p className="text-slate-600 text-sm leading-relaxed font-medium">"{review.text}"</p>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-auto">
                    <img src={review.img} alt={review.name} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                    <div>
                      <h4 className="text-slate-900 font-bold text-sm">{review.name}</h4>
                      <div className="flex text-amber-400 mt-1 gap-0.5">
                        {[...Array(5)].map((_, i) => <Star key={i} size={10} fill="currentColor" stroke="none" />)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#f8fafc] pt-16 pb-8 border-t border-slate-100">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            
            {/* Column 1 */}
            <div className="lg:pr-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">
                   <ShoppingBag size={14} />
                </div>
                <span className="text-lg font-bold text-slate-900 tracking-tight">ShopMate</span>
              </div>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                Your one-stop shop for quality products at the best prices.
              </p>
            </div>

            {/* Column 2 */}
            <div>
              <h3 className="text-slate-900 font-bold text-sm mb-5">Quick Links</h3>
              <ul className="space-y-3 text-slate-500 text-sm">
                <li><a href="#" className="hover:text-blue-600 transition-colors">Home</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Shop</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Categories</a></li>
              </ul>
            </div>

            {/* Column 3 */}
            <div>
              <h3 className="text-slate-900 font-bold text-sm mb-5">Customer Service</h3>
              <ul className="space-y-3 text-slate-500 text-sm">
                <li><a href="#" className="hover:text-blue-600 transition-colors">Track Order</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Returns & Refunds</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Shipping Policy</a></li>
              </ul>
            </div>

            {/* Column 4 */}
            <div>
              <h3 className="text-slate-900 font-bold text-sm mb-3">Subscribe to our newsletter</h3>
              <p className="text-slate-500 text-xs mb-4 leading-relaxed">Get the latest updates on new products and upcoming sales.</p>
              <form className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="bg-white text-slate-900 placeholder-slate-400 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors flex-grow shadow-sm"
                />
                <button type="button" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors shadow-sm">
                  Subscribe
                </button>
              </form>
            </div>

          </div>
        </div>
      </footer>

    </div>
  );
}