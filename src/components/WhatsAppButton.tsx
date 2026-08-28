"use client";

import { MessageCircle } from "lucide-react";

// El número se define en .env como NEXT_PUBLIC_WHATSAPP_NUMBER, formato
// internacional sin "+" ni espacios, ej: 56912345678
const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "56987470959";

// position: fixed => se mantiene en la misma esquina sin importar el scroll.
export default function WhatsAppButton() {
    return (
        
        <a
        href={`https://wa.me/${phone}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escríbenos por WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-base-black text-base-white shadow-lg transition-transform hover:scale-105"
        >
        <MessageCircle size={28} strokeWidth={1.5} />
        </a>
    );
}