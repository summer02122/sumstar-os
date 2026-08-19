import { motion } from "framer-motion";
import { X, FileText } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

export function NotebookModal({ isOpen, onClose, content, title }: { isOpen: boolean, onClose: () => void, content: string, title: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-white border-4 border-black rounded-none shadow-[10px_10px_0px_#000000] overflow-hidden"
      >
        {/* Left Edge Binding Accent */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-black flex flex-col justify-around py-6 z-10">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="w-3 h-3 rounded-none bg-[#FFCAD4] ml-2.5 border border-black" />
          ))}
        </div>
        
        {/* Header */}
        <div className="pl-12 pr-4 py-4 flex justify-between items-center bg-[#FFE5EC] z-10 border-b-4 border-black">
          <div className="flex items-center gap-2 truncate px-2">
            <FileText size={18} className="stroke-[3] text-black shrink-0" />
            <h3 className="font-heading font-black text-base md:text-lg uppercase tracking-tight text-black truncate">{title}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-black bg-white hover:bg-[#FF0055] hover:text-white border-2 border-black shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all p-1 rounded-none"
          >
            <X size={18} className="stroke-[3]" />
          </button>
        </div>

        {/* Content */}
        <div 
          className="flex-1 overflow-y-auto pl-14 pr-8 py-6 text-black font-mono text-xs md:text-sm whitespace-pre-wrap leading-relaxed bg-white custom-scrollbar"
        >
          {content}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}


