import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PortalAluno from "../app/portal/aluno/page";
import PortalCoordenacao from "../app/portal/coordenacao/page";

describe("Homologação UX — Portais Secundários (Aluno e Coordenação)", () => {
  it("Portal do Aluno: deve renderizar HUD, Modo Kumon 3 min e nova aba Trilha BNCC & Mentores", () => {
    render(<PortalAluno />);

    // 1. Verifica Identidade e HUD
    expect(screen.getByText("Lucas Andrade")).toBeDefined();
    expect(screen.getByText("Modo Kumon 3 min")).toBeDefined();
    expect(screen.getByTestId("kumon-countdown-display").textContent).toBe("03:00");

    // 2. Localiza e clica na nova aba Trilha BNCC & Mentores
    const bnccTab = screen.getByRole("tab", { name: /Trilha BNCC & Mentores/i });
    expect(bnccTab).toBeDefined();
    expect(bnccTab.getAttribute("aria-selected")).toBe("false");

    fireEvent.click(bnccTab);
    expect(bnccTab.getAttribute("aria-selected")).toBe("true");

    // 3. Verifica habilidades e mentores históricos renderizados
    expect(screen.getByText(/Trilha Soberana de Habilidades BNCC & Mentoria Histórica/i)).toBeDefined();
    expect(screen.getByText("Nicolas Carnot")).toBeDefined();
    expect(screen.getByText("Isaac Newton")).toBeDefined();
    expect(screen.getByText("Gregor Mendel")).toBeDefined();
    expect(screen.getByText("Arquimedes")).toBeDefined();
    expect(screen.getByText("EM13CNT102")).toBeDefined();
    expect(screen.getByText("EM13MAT201")).toBeDefined();
  });

  it("Portal da Coordenação: deve possuir abas acessíveis e barra de filtro de evasão funcional", () => {
    render(<PortalCoordenacao />);

    // 1. Verifica Tablist acessível
    const tablist = screen.getByRole("tablist", { name: /Navegação da Coordenação Pedagógica/i });
    expect(tablist).toBeDefined();

    const evasaoTab = screen.getByRole("tab", { name: /Radar de Evasão/i });
    expect(evasaoTab.getAttribute("aria-selected")).toBe("true");

    // 2. Verifica barra de busca e alunos em risco
    const searchInput = screen.getByPlaceholderText(/Buscar por estudante ou turma/i);
    expect(searchInput).toBeDefined();

    expect(screen.getByText("Matheus Lima")).toBeDefined();
    expect(screen.getByText("Enzo Ferreira")).toBeDefined();
    expect(screen.getByText("Lara Vasconcelos")).toBeDefined();

    // 3. Testa filtragem por termo de busca
    fireEvent.change(searchInput, { target: { value: "Matheus" } });
    expect(screen.getByText("Matheus Lima")).toBeDefined();
    expect(screen.queryByText("Enzo Ferreira")).toBeNull();
    expect(screen.queryByText("Lara Vasconcelos")).toBeNull();

    // 4. Limpa busca e testa filtragem por botão de severidade "Crítico"
    fireEvent.change(searchInput, { target: { value: " " } });
    fireEvent.change(searchInput, { target: { value: "" } });

    const criticoBtn = screen.getByRole("button", { name: "Crítico" });
    fireEvent.click(criticoBtn);

    expect(screen.getByText("Matheus Lima")).toBeDefined(); // Risco Crítico
    expect(screen.queryByText("Enzo Ferreira")).toBeNull(); // Risco Alto
    expect(screen.queryByText("Lara Vasconcelos")).toBeNull(); // Risco Médio
  });
});
