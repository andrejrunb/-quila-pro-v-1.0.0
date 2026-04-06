
export interface TemplateOptions {
  primaryColor: string;
  secondaryColor: string;
  schoolLogo?: string; // Base64 or path
  footerText: string;
}

export const DEFAULT_TEMPLATE: TemplateOptions = {
  primaryColor: '#003366', // Áquila Blue
  secondaryColor: '#E6F0F7',
  footerText: 'Áquila Pro — Gestão Inteligente e Segurança Escolar Autônoma'
};

export interface ReportLayout {
  headerHeight: number;
  margin: number;
  columnPositions: { [key: string]: number };
}

export const ACADEMIC_REPORT_LAYOUT: ReportLayout = {
  headerHeight: 120,
  margin: 50,
  columnPositions: {
    student: 60,
    class: 280,
    attendance: 380,
    status: 480
  }
};
