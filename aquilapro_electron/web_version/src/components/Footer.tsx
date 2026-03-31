import { Link } from "wouter";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#030712] text-gray-400 border-t border-white/10 pt-20 pb-10">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.location.href = '/'}>
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/108236306/dHESmq7FeuWLF4xGhiT9FT/aquila-logo-128_95277380.png"
                alt="Áquila Pro Logo"
                className="h-10 w-auto object-contain brightness-110 contrast-125"
              />
              <span className="font-black text-2xl tracking-tighter italic text-white flex items-center">
                ÁQUILA<span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">PRO</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              Liderando a revolução em segurança escolar com inteligência artificial, reconhecimento facial e automação IoT 100% brasileira.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-bold text-white text-sm uppercase tracking-widest mb-8">Produto</h4>
            <ul className="space-y-4 text-sm">
              <li>
                <a onClick={() => window.location.href = '/funcionalidades'} className="hover:text-blue-500 transition-colors cursor-pointer">Funcionalidades</a>
              </li>
              <li>
                <a onClick={() => window.location.href = '/demo'} className="hover:text-blue-500 transition-colors cursor-pointer">Demonstração</a>
              </li>
              <li>
                <a onClick={() => window.location.href = '/precos'} className="hover:text-blue-500 transition-colors cursor-pointer">Preços</a>
              </li>
              <li>
                <a onClick={() => window.location.href = '/cameras'} className="hover:text-blue-500 transition-colors cursor-pointer">Câmeras Compatíveis</a>
              </li>
              <li>
                <a onClick={() => window.location.href = '/arquitetura'} className="hover:text-blue-500 transition-colors cursor-pointer">Arquitetura V3</a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-white text-sm uppercase tracking-widest mb-8">Empresa</h4>
            <ul className="space-y-4 text-sm">
              <li>
                <a onClick={() => window.location.href = '/sobre'} className="hover:text-blue-500 transition-colors cursor-pointer">Sobre Nós</a>
              </li>
              <li>
                <a onClick={() => window.location.href = '/casos-sucesso'} className="hover:text-blue-500 transition-colors cursor-pointer">Casos de Sucesso</a>
              </li>
              <li>
                <a onClick={() => window.location.href = '/faq'} className="hover:text-blue-500 transition-colors cursor-pointer">FAQ</a>
              </li>
              <li>
                <a onClick={() => window.location.href = '/contato'} className="hover:text-blue-500 transition-colors cursor-pointer">Falar com Consultor</a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-500 transition-colors cursor-pointer">Canal de Ética</a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-white text-sm uppercase tracking-widest mb-8">Contato</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <Mail size={16} className="mt-0.5 text-blue-500" />
                <a href="mailto:andrejrunb@yahoo.com.br" className="hover:text-blue-500 transition-colors">
                  andrejrunb@yahoo.com.br
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone size={16} className="mt-0.5 text-blue-500" />
                <a href="tel:+5561999623099" className="hover:text-blue-500 transition-colors">
                  +55 (61) 99962-3099
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 text-blue-500" />
                <span>Brasília - DF, Brasil · 70000-000</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">
            <p>&copy; {currentYear} ÁQUILA PRO — MADE IN BRASÍLIA. ALL RIGHTS RESERVED.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-blue-500 transition-colors group">
                Privacidade <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </a>
              <a href="#" className="hover:text-blue-500 transition-colors group">
                Termos <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </a>
              <a href="#" className="hover:text-blue-500 transition-colors group">
                LGPD Compliance <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
