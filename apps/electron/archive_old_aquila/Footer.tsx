import { Link } from "wouter";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="container max-w-6xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">Á</span>
              </div>
              <span className="font-bold text-xl text-white">Áquila Pro</span>
            </div>
            <p className="text-sm text-gray-400">
              Transformando a segurança e engajamento escolar com IA e reconhecimento facial.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-white mb-4">Produto</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a onClick={() => window.location.href = '/funcionalidades'} className="hover:text-blue-400 transition-colors cursor-pointer">Funcionalidades</a>
              </li>
              <li>
                <a onClick={() => window.location.href = '/demo'} className="hover:text-blue-400 transition-colors cursor-pointer">Demonstração</a>
              </li>
              <li>
                <a onClick={() => window.location.href = '/precos'} className="hover:text-blue-400 transition-colors cursor-pointer">Preços</a>
              </li>
              <li>
                <a onClick={() => window.location.href = '/cameras'} className="hover:text-blue-400 transition-colors cursor-pointer">Câmeras Compatíveis</a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-4">Empresa</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a onClick={() => window.location.href = '/sobre'} className="hover:text-blue-400 transition-colors cursor-pointer">Sobre Nós</a>
              </li>
              <li>
                <a onClick={() => window.location.href = '/casos-sucesso'} className="hover:text-blue-400 transition-colors cursor-pointer">Casos de Sucesso</a>
              </li>
              <li>
                <a onClick={() => window.location.href = '/faq'} className="hover:text-blue-400 transition-colors cursor-pointer">FAQ</a>
              </li>
              <li>
                <a onClick={() => window.location.href = '/contato'} className="hover:text-blue-400 transition-colors cursor-pointer">Contato</a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">Contato</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Mail size={16} className="mt-1 flex-shrink-0" />
                <a href="mailto:contato@aquila.pro" className="hover:text-blue-400 transition-colors">
                  contato@aquila.pro
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone size={16} className="mt-1 flex-shrink-0" />
                <a href="tel:+5511999999999" className="hover:text-blue-400 transition-colors">
                  +55 (11) 99999-9999
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={16} className="mt-1 flex-shrink-0" />
                <span>São Paulo, Brasil</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <p>&copy; {currentYear} Áquila Pro. Todos os direitos reservados.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-blue-400 transition-colors">
                Privacidade
              </a>
              <a href="#" className="hover:text-blue-400 transition-colors">
                Termos de Serviço
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
