import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: "Sobre", href: "/sobre" },
    { label: "Funcionalidades", href: "/funcionalidades" },
    { label: "Demonstração", href: "/demo" },
    { label: "Casos de Sucesso", href: "/casos-sucesso" },
    { label: "Preços", href: "/precos" },
    { label: "Câmeras", href: "/cameras" },
    { label: "FAQ", href: "/faq" },
    { label: "Arquitetura", href: "/arquitetura" },
    { label: "Segurança", href: "/seguranca" },
    { label: "Implantação", href: "/implantacao" },
    { label: "API", href: "/api" },
  ];

  return (
    <nav className="fixed top-0 w-full bg-white shadow-sm z-50">
      <div className="container max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = '/'}>
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">Á</span>
          </div>
          <span className="font-bold text-xl text-gray-900">Áquila Pro</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.href}
              onClick={() => window.location.href = item.href}
              className="text-gray-600 hover:text-blue-600 transition-colors font-medium cursor-pointer"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex gap-4">
          <Button onClick={() => window.location.href = '/contato'}>Contato</Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="container max-w-6xl mx-auto px-4 py-4 space-y-4">
            {navItems.map((item) => (
              <a
                key={item.href}
                onClick={() => {
                  window.location.href = item.href;
                  setIsOpen(false);
                }}
                className="block text-gray-600 hover:text-blue-600 font-medium cursor-pointer"
              >
                {item.label}
              </a>
            ))}
            <Button className="w-full" onClick={() => {
              window.location.href = '/contato';
              setIsOpen(false);
            }}>
              Contato
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
