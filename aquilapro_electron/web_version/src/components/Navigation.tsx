import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface DropdownItem {
  label: string;
  href: string;
}

interface NavGroup {
  label: string;
  items: DropdownItem[];
}

function DropdownMenu({ group, onNavigate }: { group: NavGroup; onNavigate: (href: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors font-medium cursor-pointer"
      >
        {group.label}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-4 w-52 bg-[#0e1322] border border-white/10 rounded-2xl shadow-2xl py-3 z-50 backdrop-blur-xl">
          {group.items.map((item) => (
            <a
              key={item.href}
              onClick={() => {
                onNavigate(item.href);
                setOpen(false);
              }}
              className="block px-5 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer font-medium"
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  const directLinks = [
    { label: "Sobre", href: "/sobre" },
    { label: "Funcionalidades", href: "/funcionalidades" },
    { label: "Demonstração", href: "/demo" },
    { label: "Preços", href: "/precos" },
  ];

  const dropdownGroups: NavGroup[] = [
    {
      label: "Soluções",
      items: [
        { label: "Câmeras", href: "/cameras" },
        { label: "Arquitetura", href: "/arquitetura" },
        { label: "Segurança", href: "/seguranca" },
        { label: "Implantação", href: "/implantacao" },
        { label: "API", href: "/api" },
      ],
    },
    {
      label: "Portais",
      items: [
        { label: "Portal dos Pais", href: "/portal-pais" },
        { label: "Aplicativo Móvel", href: "/mobile-app" },
        { label: "Vendas", href: "/vendas" },
        { label: "Casos de Sucesso", href: "/casos-sucesso" },
        { label: "FAQ", href: "/faq" },
      ],
    },
  ];

  const navigate = (href: string) => {
    window.location.href = href;
  };

  const toggleMobileGroup = (label: string) => {
    setMobileExpanded(mobileExpanded === label ? null : label);
  };

  return (
    <nav className="fixed top-0 w-full bg-[#030712]/70 backdrop-blur-xl border-b border-white/10 z-[100] transition-all duration-300">
      <div className="container max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => navigate("/")}
        >
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/108236306/dHESmq7FeuWLF4xGhiT9FT/aquila-logo-128_95277380.png"
            alt="Áquila Pro Logo"
            className="h-10 w-auto object-contain group-hover:scale-110 transition-transform"
          />
          <span className="font-black text-2xl tracking-tighter italic">
            ÁQUILA<span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">PRO</span>
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8">
          {directLinks.map((item) => (
            <a
              key={item.href}
              onClick={() => navigate(item.href)}
              className="text-gray-400 hover:text-white transition-colors font-medium cursor-pointer text-sm"
            >
              {item.label}
            </a>
          ))}
          {dropdownGroups.map((group) => (
            <DropdownMenu
              key={group.label}
              group={group}
              onNavigate={navigate}
            />
          ))}
        </div>

        <div className="hidden lg:flex gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/portal-pais")}
            className="text-gray-300 hover:text-white hover:bg-white/5 font-bold"
          >
            Portal dos Pais
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 font-bold px-6 rounded-xl"
            onClick={() => navigate("/contato")}
          >
            Contato
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button className="lg:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="lg:hidden bg-[#030712] border-t border-white/10 max-h-screen overflow-y-auto animate-in slide-in-from-top duration-300">
          <div className="container max-w-6xl mx-auto px-6 py-10 space-y-2">
            {directLinks.map((item) => (
              <a
                key={item.href}
                onClick={() => {
                  navigate(item.href);
                  setIsOpen(false);
                }}
                className="block py-4 px-3 text-lg text-gray-400 hover:text-white hover:bg-white/5 rounded-2xl font-bold cursor-pointer transition-colors"
              >
                {item.label}
              </a>
            ))}

            {dropdownGroups.map((group) => (
              <div key={group.label}>
                <button
                  onClick={() => toggleMobileGroup(group.label)}
                  className="w-full flex items-center justify-between py-4 px-3 text-lg text-gray-400 hover:text-white hover:bg-white/5 rounded-2xl font-bold cursor-pointer transition-colors"
                >
                  {group.label}
                  <ChevronDown
                    className={`w-5 h-5 transition-transform ${
                      mobileExpanded === group.label ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {mobileExpanded === group.label && (
                  <div className="pl-6 space-y-1">
                    {group.items.map((item) => (
                      <a
                        key={item.href}
                        onClick={() => {
                          navigate(item.href);
                          setIsOpen(false);
                        }}
                        className="block py-3 px-4 text-base text-gray-500 hover:text-white hover:bg-white/5 rounded-xl cursor-pointer transition-colors"
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="pt-8 space-y-4 border-t border-white/10 mt-6">
              <Button
                variant="outline"
                className="w-full py-7 text-lg rounded-2xl border-white/10 text-white hover:bg-white/5"
                onClick={() => {
                  navigate("/portal-pais");
                  setIsOpen(false);
                }}
              >
                Portal dos Pais
              </Button>
              <Button
                className="w-full py-7 text-lg rounded-2xl bg-blue-600 hover:bg-blue-700 font-bold"
                onClick={() => {
                  navigate("/contato");
                  setIsOpen(false);
                }}
              >
                Contato
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
