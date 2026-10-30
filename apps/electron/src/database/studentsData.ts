/**
 * studentsData.ts — Lista de Alunos Sintéticos para Testes e Validação
 * ====================================================================
 * Nomes 100% fictícios gerados em conformidade estrita com LGPD (Art. 14).
 * Matrículas e vínculos de turmas preservados para integridade de testes.
 */

export interface StudentData {
  id: string;
  ra: string;
  classRoom: string;
  className: string;
  class: string;
  registrationNumber: string;
  name: string;
  cpf: string;
  classId: string;
}

const CLASS_ID_TO_NAME: Record<string, string> = {
  'F-EF11A': '1 ANO A', 'F-EF11B': '1 ANO B',
  'F-EF12A': '2 ANO A', 'F-EF12B': '2 ANO B',
  'F-EF13A': '3 ANO A', 'F-EF13B': '3 ANO B',
  'F-EF14A': '4 ANO A', 'F-EF14B': '4 ANO B',
  'F-EF15A': '5 ANO A', 'F-EF15B': '5 ANO B',
  'F-EF26A': '6 ANO A', 'F-EF26B': '6 ANO B',
  'F-EF27A': '7 ANO A', 'F-EF27B': '7 ANO B',
  'F-EF28A': '8 ANO A', 'F-EF28B': '8 ANO B',
  'F-EF29A': '9 ANO A', 'F-EF29B': '9 ANO B',
  'F-EM1A': '1 SERIE A', 'F-EM1B': '1 SERIE B',
  'F-EM2A': '2 SERIE A', 'F-EM3A': '3 SERIE A',
  'MED-EXT': 'TURMA MEDICINA 2 FASE',
};

const RAW_STUDENTS = [
  {
    "registrationNumber": "45453",
    "name": "GIOVANNA CAMPOS GOMES",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "45207",
    "name": "EDUARDO GONCALVES BARBOSA",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "52239",
    "name": "ARTHUR FREITAS NASCIMENTO",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "45063",
    "name": "MANUELA RODRIGUES BORGES",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "44988",
    "name": "RAFAEL FONTES PAIVA",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "45397",
    "name": "BERNARDO SOARES BARBOSA",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "44998",
    "name": "CAIO ALBUQUERQUE FARIA",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "45457",
    "name": "LUCAS MEDEIROS NOGUEIRA",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "51475",
    "name": "BEATRIZ NASCIMENTO DUARTE",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "44982",
    "name": "PEDRO BARROS FREITAS",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "45232",
    "name": "BERNARDO BORGES LOPES",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "52468",
    "name": "YASMIN DUARTE MORAES",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "45376",
    "name": "MATHEUS RIBEIRO RODRIGUES",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "45210",
    "name": "LORENZO SANTANA OLIVEIRA",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "45482",
    "name": "HENRIQUE CARDOSO SANTOS",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "51034",
    "name": "ELENA FERREIRA COSTA",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "45245",
    "name": "LEONARDO ALMEIDA SILVA",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "45414",
    "name": "PEDRO CAMPOS NASCIMENTO",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "52019",
    "name": "VALENTINA MACHADO LIMA",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "52357",
    "name": "HENRIQUE RIBEIRO SANTOS",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "45023",
    "name": "BEATRIZ RAMOS CARVALHO",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "52389",
    "name": "FELIPE PINTO MEDEIROS",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "45018",
    "name": "ALICE MARQUES PAIVA",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "52578",
    "name": "ARTHUR BRAGA CARVALHO",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "52534",
    "name": "VINICIUS MARQUES BRANDAO",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "45022",
    "name": "DAVI ROCHA MELO",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "51023",
    "name": "ELENA SILVA ROCHA",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "45379",
    "name": "DANIEL DIAS PINTO",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "45519",
    "name": "MATEUS OLIVEIRA LIMA",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "51734",
    "name": "BEATRIZ MORAES NASCIMENTO",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "45019",
    "name": "ELENA PEREIRA NASCIMENTO",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "52267",
    "name": "JOAO MOREIRA LOPES",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "45190",
    "name": "LIVIA ALVES RIBEIRO",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "52478",
    "name": "PEDRO FERREIRA CARVALHO",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "52344",
    "name": "JOAO FARIA MEDEIROS",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45329",
    "name": "CAIO GONCALVES MEDEIROS",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45377",
    "name": "GIOVANNA FERREIRA FREITAS",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45664",
    "name": "LEONARDO MELO NASCIMENTO",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45518",
    "name": "THEO RODRIGUES FARIA",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45277",
    "name": "THEO GARCIA NOGUEIRA",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45327",
    "name": "DAVI GOMES RAMOS",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "52085",
    "name": "DANIEL SOARES ALBUQUERQUE",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "52630",
    "name": "RAFAEL MOREIRA GARCIA",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "51459",
    "name": "LIVIA GARCIA MEDEIROS",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "51251",
    "name": "HELENA SOUZA MARTINS",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45447",
    "name": "GABRIEL PAIVA BARBOSA",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45532",
    "name": "JOAO RODRIGUES BARBOSA",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "52280",
    "name": "DAVI PEREIRA SILVA",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "51429",
    "name": "VALENTINA OLIVEIRA SANTANA",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45355",
    "name": "CAIO DIAS MENDES",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "51727",
    "name": "ISABELA MORAES RAMOS",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "52238",
    "name": "ELENA DUARTE GOMES",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45319",
    "name": "FERNANDA CAMPOS SANTANA",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45206",
    "name": "JULIA GOMES BRAGA",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45646",
    "name": "LARA RODRIGUES RODRIGUES",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "52190",
    "name": "CAROLINA MACHADO BARROS",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "51062",
    "name": "VINICIUS RODRIGUES DIAS",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "52043",
    "name": "LARA PAIVA PAIVA",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45062",
    "name": "ALICE SANTOS LOPES",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45221",
    "name": "ALICE GONCALVES RODRIGUES",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45017",
    "name": "VALENTINA CARVALHO FREITAS",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45259",
    "name": "ALICE PINTO FONTES",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45691",
    "name": "REBECA OLIVEIRA SOUZA",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45496",
    "name": "YASMIN ALMEIDA PEREIRA",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45083",
    "name": "MATEUS COSTA ALMEIDA",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "52544",
    "name": "ELENA SOUZA NASCIMENTO",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45568",
    "name": "SAMUEL GARCIA BORGES",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "51356",
    "name": "LORENZO OLIVEIRA MARTINS",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45332",
    "name": "ALICE DIAS DIAS",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "44551",
    "name": "LARA GONCALVES ALVES",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45418",
    "name": "EDUARDO LOPES MARQUES",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "52598",
    "name": "MIGUEL DUARTE ROCHA",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45249",
    "name": "ARTHUR FREITAS AZEVEDO",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45082",
    "name": "SOFIA FREITAS RAMOS",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45248",
    "name": "BERNARDO FONTES BORGES",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45114",
    "name": "MIGUEL FERREIRA LIMA",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45366",
    "name": "BERNARDO LOPES RODRIGUES",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45192",
    "name": "MIGUEL AZEVEDO MELO",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "51971",
    "name": "ELENA ROCHA PEREIRA",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45250",
    "name": "ELENA MELO SILVA",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45202",
    "name": "BERNARDO PAIVA DIAS",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "44548",
    "name": "MIGUEL MACHADO ROCHA",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "44555",
    "name": "VALENTINA SOUZA SILVA",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45266",
    "name": "MIGUEL MORAES MARTINS",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45265",
    "name": "MIGUEL MELO MACHADO",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "44673",
    "name": "VINICIUS BARBOSA PAIVA",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "51422",
    "name": "MATHEUS ALVES NOGUEIRA",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45048",
    "name": "HELENA MORAES GOMES",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45261",
    "name": "MIGUEL GOMES FERREIRA",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45216",
    "name": "LUISA PEREIRA BRAGA",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45252",
    "name": "LIVIA SOARES DIAS",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45317",
    "name": "EDUARDO RODRIGUES LOPES",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45226",
    "name": "VINICIUS GARCIA RODRIGUES",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "44516",
    "name": "ELENA ROCHA MARTINS",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45177",
    "name": "PEDRO MACHADO CAMPOS",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45535",
    "name": "NICOLAS ALBUQUERQUE GARCIA",
    "cpf": "",
    "classId": "F-EF27B"
  },
  {
    "registrationNumber": "45087",
    "name": "LORENZO BRAGA RAMOS",
    "cpf": "",
    "classId": "F-EF27B"
  },
  {
    "registrationNumber": "45347",
    "name": "CAIO PINTO DIAS",
    "cpf": "",
    "classId": "F-EF27B"
  },
  {
    "registrationNumber": "51980",
    "name": "VINICIUS PINTO ALBUQUERQUE",
    "cpf": "",
    "classId": "F-EF27B"
  },
  {
    "registrationNumber": "44817",
    "name": "THEO ALBUQUERQUE DIAS",
    "cpf": "",
    "classId": "F-EF27B"
  },
  {
    "registrationNumber": "45695",
    "name": "SOFIA OLIVEIRA DUARTE",
    "cpf": "",
    "classId": "F-EF27B"
  },
  {
    "registrationNumber": "45505",
    "name": "DANIEL FARIA RIBEIRO",
    "cpf": "",
    "classId": "F-EF27B"
  },
  {
    "registrationNumber": "52025",
    "name": "DAVI MARTINS OLIVEIRA",
    "cpf": "",
    "classId": "F-EF27B"
  },
  {
    "registrationNumber": "45045",
    "name": "MATHEUS PINTO MENDES",
    "cpf": "",
    "classId": "F-EF27B"
  },
  {
    "registrationNumber": "50999",
    "name": "LORENZO ALMEIDA COSTA",
    "cpf": "",
    "classId": "F-EF27B"
  },
  {
    "registrationNumber": "44993",
    "name": "JOAO NOGUEIRA MARQUES",
    "cpf": "",
    "classId": "F-EF27B"
  },
  {
    "registrationNumber": "51054",
    "name": "ALICE FONTES BRANDAO",
    "cpf": "",
    "classId": "F-EF27B"
  },
  {
    "registrationNumber": "45420",
    "name": "DAVI FERREIRA MACHADO",
    "cpf": "",
    "classId": "F-EF27B"
  },
  {
    "registrationNumber": "45096",
    "name": "CAIO SOARES CASTRO",
    "cpf": "",
    "classId": "F-EF27B"
  },
  {
    "registrationNumber": "45223",
    "name": "GABRIEL MEDEIROS BORGES",
    "cpf": "",
    "classId": "F-EF27B"
  },
  {
    "registrationNumber": "51404",
    "name": "SAMUEL GONCALVES MEDEIROS",
    "cpf": "",
    "classId": "F-EF27B"
  },
  {
    "registrationNumber": "45025",
    "name": "HENRIQUE PAIVA MENDES",
    "cpf": "",
    "classId": "F-EF27B"
  },
  {
    "registrationNumber": "52449",
    "name": "ARTHUR CAMPOS AZEVEDO",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "51468",
    "name": "LEONARDO FERREIRA ROCHA",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "44036",
    "name": "NICOLAS GONCALVES GONCALVES",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "44940",
    "name": "HELENA OLIVEIRA BARROS",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "52490",
    "name": "DANIEL PAIVA CARDOSO",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "44745",
    "name": "LIVIA ALVES ALBUQUERQUE",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "44010",
    "name": "EDUARDO TEIXEIRA CARDOSO",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "43989",
    "name": "MATHEUS PAIVA FONTES",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "45498",
    "name": "JOAO DIAS PAIVA",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "51458",
    "name": "JULIA SILVA CARVALHO",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "51710",
    "name": "RAFAEL ALVES MENDES",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "52484",
    "name": "DAVI MACHADO AZEVEDO",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "44730",
    "name": "GUILHERME DIAS MENDES",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "44640",
    "name": "CAROLINA SILVA BARROS",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "45343",
    "name": "MIGUEL BARROS MORAES",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "44952",
    "name": "YASMIN NASCIMENTO VIEIRA",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "45386",
    "name": "SAMUEL PAIVA RODRIGUES",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "44990",
    "name": "YASMIN VIEIRA MACHADO",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "44768",
    "name": "JOAO NOGUEIRA MARQUES",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "45506",
    "name": "VALENTINA VIEIRA SOUZA",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "43811",
    "name": "LORENZO DUARTE PEREIRA",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "52366",
    "name": "JULIA MORAES MARTINS",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "45024",
    "name": "VINICIUS BORGES PINTO",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "44630",
    "name": "CAROLINA MACHADO OLIVEIRA",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "45709",
    "name": "CAROLINA COSTA SANTANA",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "44164",
    "name": "LEONARDO MELO NASCIMENTO",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "44608",
    "name": "MANUELA CASTRO SOARES",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "52339",
    "name": "VINICIUS BORGES FONTES",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "45222",
    "name": "BERNARDO BORGES BARBOSA",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "45097",
    "name": "VINICIUS MOREIRA NOGUEIRA",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "44450",
    "name": "RAFAEL RODRIGUES CARDOSO",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "51565",
    "name": "MATHEUS PINTO GARCIA",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "45204",
    "name": "MATHEUS BORGES TEIXEIRA",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "52309",
    "name": "GUILHERME GONCALVES PINTO",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "45029",
    "name": "HELENA NASCIMENTO NASCIMENTO",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "44587",
    "name": "GUILHERME BRANDAO SANTOS",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "43603",
    "name": "PEDRO BRAGA CARVALHO",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "45548",
    "name": "ISABELA SANTANA MORAES",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "52201",
    "name": "PEDRO AZEVEDO BRAGA",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "45155",
    "name": "MANUELA FARIA RIBEIRO",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "43406",
    "name": "VINICIUS GARCIA ALVES",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "45036",
    "name": "MIGUEL CARVALHO FERREIRA",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "44357",
    "name": "PEDRO MACHADO FREITAS",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "44696",
    "name": "FERNANDA SANTANA SOUZA",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "44660",
    "name": "HENRIQUE PAIVA ALBUQUERQUE",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "52466",
    "name": "LORENZO BARROS SOUZA",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "43270",
    "name": "MATHEUS FONTES MENDES",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "44028",
    "name": "MATEUS SANTANA ROCHA",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "44308",
    "name": "MATHEUS NOGUEIRA BORGES",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "44479",
    "name": "ALICE TEIXEIRA BRANDAO",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "51048",
    "name": "FELIPE BORGES SOARES",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "44004",
    "name": "DAVI MACHADO SANTANA",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "44976",
    "name": "LARA RODRIGUES ALVES",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "44618",
    "name": "LORENZO FREITAS ALMEIDA",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "45176",
    "name": "LIVIA SANTOS CASTRO",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "44646",
    "name": "GIOVANNA BARROS BRAGA",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "45021",
    "name": "MIGUEL MORAES PEREIRA",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "44471",
    "name": "ALICE MOREIRA RODRIGUES",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "45534",
    "name": "LUCAS GONCALVES PINTO",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "51106",
    "name": "VALENTINA RAMOS SOUZA",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "45407",
    "name": "JULIA SANTANA CAMPOS",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "44006",
    "name": "JULIA ROCHA BRAGA",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "51047",
    "name": "LEONARDO DUARTE VIEIRA",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "44765",
    "name": "LARA GARCIA MENDES",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "52320",
    "name": "HENRIQUE PAIVA GARCIA",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "45032",
    "name": "ELENA LIMA CAMPOS",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "45131",
    "name": "MIGUEL GOMES BRAGA",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "52507",
    "name": "DANIEL ALBUQUERQUE SANTOS",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "52576",
    "name": "THEO BRANDAO MOREIRA",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "45035",
    "name": "HENRIQUE PAIVA ALBUQUERQUE",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "44598",
    "name": "LARA MARQUES SOARES",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "52044",
    "name": "MATEUS DUARTE LIMA",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "52244",
    "name": "MATHEUS FARIA MEDEIROS",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "51103",
    "name": "EDUARDO SANTOS SOARES",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "44565",
    "name": "PEDRO MORAES OLIVEIRA",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "43440",
    "name": "MATEUS BRAGA DUARTE",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "43439",
    "name": "MATEUS BARROS COSTA",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "44755",
    "name": "LUCAS BARBOSA MENDES",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "45555",
    "name": "LUISA BARROS OLIVEIRA",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "43000",
    "name": "PEDRO ROCHA BARROS",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "44033",
    "name": "LUISA ROCHA ROCHA",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "43926",
    "name": "YASMIN GOMES SOUZA",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "45693",
    "name": "DAVI LIMA GOMES",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "44188",
    "name": "LORENZO CAMPOS ROCHA",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "43432",
    "name": "MATHEUS RODRIGUES BARBOSA",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "44564",
    "name": "ARTHUR RAMOS NASCIMENTO",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "43684",
    "name": "BERNARDO ALBUQUERQUE MEDEIROS",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "45110",
    "name": "MIGUEL MELO DUARTE",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "45125",
    "name": "CAROLINA MACHADO MACHADO",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "44652",
    "name": "GIOVANNA BRAGA FREITAS",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "42820",
    "name": "LIVIA CASTRO ALBUQUERQUE",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "45422",
    "name": "LUISA FREITAS FREITAS",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "43515",
    "name": "YASMIN VIEIRA MACHADO",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "44309",
    "name": "SAMUEL MOREIRA PINTO",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "52548",
    "name": "SAMUEL ALBUQUERQUE FARIA",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "45301",
    "name": "MATHEUS CARDOSO RODRIGUES",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "52276",
    "name": "CAIO PAIVA GONCALVES",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "52557",
    "name": "DANIEL MENDES SANTOS",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "43895",
    "name": "LUISA SILVA DUARTE",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "51033",
    "name": "CAIO CARDOSO PAIVA",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "51763",
    "name": "HELENA ALMEIDA ALMEIDA",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "42817",
    "name": "NICOLAS DIAS NOGUEIRA",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "45315",
    "name": "ELENA CAMPOS MACHADO",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "52516",
    "name": "FERNANDA COSTA PEREIRA",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "52579",
    "name": "SOFIA AZEVEDO NASCIMENTO",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "43529",
    "name": "MANUELA BARBOSA PINTO",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "44022",
    "name": "ALICE NOGUEIRA SANTOS",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "44504",
    "name": "BEATRIZ MORAES LIMA",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "43929",
    "name": "MIGUEL BRAGA AZEVEDO",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "43674",
    "name": "HELENA SANTANA LIMA",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "44046",
    "name": "MATHEUS CARDOSO MOREIRA",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "45091",
    "name": "SAMUEL SOARES ALVES",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "51030",
    "name": "GUILHERME DIAS MENDES",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "43567",
    "name": "RAFAEL MARQUES SANTOS",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "43362",
    "name": "MATHEUS CASTRO DIAS",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "52573",
    "name": "ALICE SOARES SOARES",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "44007",
    "name": "SOFIA VIEIRA RAMOS",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "52287",
    "name": "THEO RIBEIRO BARBOSA",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "44501",
    "name": "FERNANDA NASCIMENTO BRAGA",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "44325",
    "name": "THEO BORGES MENDES",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "43419",
    "name": "FERNANDA RAMOS SANTANA",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "43947",
    "name": "LARA LOPES SANTOS",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "43820",
    "name": "GUILHERME SANTOS CARDOSO",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "44184",
    "name": "JULIA PEREIRA COSTA",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "44217",
    "name": "GIOVANNA PEREIRA VIEIRA",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "51390",
    "name": "MATEUS BRAGA DUARTE",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "43614",
    "name": "GABRIEL MENDES PINTO",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "43996",
    "name": "SOFIA MARTINS FERREIRA",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "45337",
    "name": "ISABELA ALMEIDA CAMPOS",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "44203",
    "name": "CAIO ALBUQUERQUE MARQUES",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "45710",
    "name": "RAFAEL GONCALVES MENDES",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "52288",
    "name": "FERNANDA BRAGA MORAES",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "44846",
    "name": "FELIPE MOREIRA RODRIGUES",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "44049",
    "name": "GUILHERME RODRIGUES FONTES",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "51706",
    "name": "RAFAEL DIAS GONCALVES",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "52392",
    "name": "YASMIN LIMA MELO",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "52037",
    "name": "CAROLINA CAMPOS VIEIRA",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "51726",
    "name": "HELENA MARTINS MARTINS",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "51469",
    "name": "YASMIN BRAGA NASCIMENTO",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "43517",
    "name": "EDUARDO ALVES LOPES",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "43415",
    "name": "MATEUS SOUZA DUARTE",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "42741",
    "name": "SAMUEL MARQUES ALVES",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "52533",
    "name": "MATEUS AZEVEDO ALMEIDA",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "45275",
    "name": "FELIPE MENDES ALBUQUERQUE",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "44080",
    "name": "HENRIQUE SOARES RIBEIRO",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "44571",
    "name": "MATHEUS GARCIA MOREIRA",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "44769",
    "name": "MATEUS DUARTE LIMA",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "43383",
    "name": "BERNARDO BRANDAO MARQUES",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "44200",
    "name": "LARA CARDOSO ALBUQUERQUE",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "43422",
    "name": "BEATRIZ MARTINS CAMPOS",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "43336",
    "name": "VINICIUS GARCIA CASTRO",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "52512",
    "name": "HELENA VIEIRA VIEIRA",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "44071",
    "name": "HELENA MARTINS FERREIRA",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "43084",
    "name": "MIGUEL FERREIRA COSTA",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "52026",
    "name": "GABRIEL SANTOS CASTRO",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "43074",
    "name": "LEONARDO RAMOS AZEVEDO",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "51319",
    "name": "MATEUS MACHADO LIMA",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "43621",
    "name": "FELIPE MOREIRA RODRIGUES",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "51656",
    "name": "DANIEL PINTO RODRIGUES",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "52243",
    "name": "SAMUEL ALBUQUERQUE BORGES",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "43321",
    "name": "REBECA OLIVEIRA BRAGA",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "43436",
    "name": "MIGUEL MORAES FERREIRA",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "51457",
    "name": "FERNANDA SILVA FREITAS",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "43509",
    "name": "LUCAS ALVES PINTO",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "51091",
    "name": "DAVI VIEIRA FERREIRA",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "45040",
    "name": "VALENTINA SOUZA DUARTE",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "45650",
    "name": "EDUARDO MEDEIROS RIBEIRO",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "51400",
    "name": "YASMIN MELO SILVA",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "51643",
    "name": "BEATRIZ CAMPOS ALMEIDA",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "51649",
    "name": "FELIPE MEDEIROS TEIXEIRA",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "44671",
    "name": "REBECA SILVA BRAGA",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "43843",
    "name": "DANIEL CASTRO FARIA",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "43420",
    "name": "LUCAS SANTOS CARDOSO",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "51105",
    "name": "NICOLAS ALBUQUERQUE CARDOSO",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "42850",
    "name": "HENRIQUE PAIVA MENDES",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "43438",
    "name": "CAROLINA ALMEIDA ALMEIDA",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "41761",
    "name": "ELENA GOMES FERREIRA",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "44594",
    "name": "BEATRIZ GOMES AZEVEDO",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "45295",
    "name": "LUISA MACHADO DUARTE",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "44581",
    "name": "RAFAEL NOGUEIRA GONCALVES",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "45530",
    "name": "LIVIA MOREIRA GARCIA",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "52420",
    "name": "REBECA AZEVEDO BARROS",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "52539",
    "name": "REBECA CARVALHO SANTANA",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "43452",
    "name": "MATEUS ALMEIDA RAMOS",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "43846",
    "name": "LIVIA NOGUEIRA ALVES",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "42775",
    "name": "RAFAEL GONCALVES CARDOSO",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "43478",
    "name": "HENRIQUE MOREIRA PAIVA",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "51924",
    "name": "LORENZO GOMES COSTA",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "42316",
    "name": "HENRIQUE TEIXEIRA CASTRO",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "43247",
    "name": "MATHEUS RODRIGUES NOGUEIRA",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "43505",
    "name": "DAVI FERREIRA SILVA",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "45647",
    "name": "NICOLAS SANTOS SANTOS",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "52599",
    "name": "LORENZO ALMEIDA COSTA",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "42933",
    "name": "VINICIUS BARBOSA BORGES",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "44264",
    "name": "FELIPE TEIXEIRA MEDEIROS",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "51673",
    "name": "LARA MARQUES SOARES",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "45290",
    "name": "VINICIUS MEDEIROS GARCIA",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "43864",
    "name": "GIOVANNA ALMEIDA SANTANA",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "42616",
    "name": "DANIEL BRANDAO CASTRO",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "45643",
    "name": "SAMUEL RIBEIRO BORGES",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "45645",
    "name": "VALENTINA SOUZA MACHADO",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "43378",
    "name": "FERNANDA SOUZA CARVALHO",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "51357",
    "name": "PEDRO OLIVEIRA FREITAS",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "52264",
    "name": "JULIA BRAGA LIMA",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "44799",
    "name": "SOFIA COSTA LIMA",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "42627",
    "name": "LUCAS TEIXEIRA LOPES",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "41915",
    "name": "REBECA COSTA SILVA",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "45464",
    "name": "LORENZO CARVALHO SANTANA",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "51379",
    "name": "JULIA BRAGA AZEVEDO",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "41814",
    "name": "HELENA COSTA AZEVEDO",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "44095",
    "name": "ISABELA BRAGA MACHADO",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "42867",
    "name": "NICOLAS LOPES NOGUEIRA",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "52268",
    "name": "RAFAEL MEDEIROS SOARES",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "44663",
    "name": "MATHEUS DIAS FARIA",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "51487",
    "name": "GIOVANNA PEREIRA RAMOS",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "52275",
    "name": "BERNARDO ALVES CARDOSO",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "41763",
    "name": "FERNANDA FERREIRA MORAES",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "43341",
    "name": "NICOLAS ALVES MOREIRA",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "44591",
    "name": "ARTHUR AZEVEDO PEREIRA",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "44949",
    "name": "ALICE MEDEIROS TEIXEIRA",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "42885",
    "name": "ISABELA PEREIRA BARROS",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "43400",
    "name": "GIOVANNA NASCIMENTO DUARTE",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "43596",
    "name": "FELIPE GONCALVES RODRIGUES",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "42879",
    "name": "GUILHERME GONCALVES MEDEIROS",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "42231",
    "name": "DAVI MELO SOUZA",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "43318",
    "name": "HELENA ROCHA CARVALHO",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "51339",
    "name": "VALENTINA BARROS COSTA",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "42789",
    "name": "EDUARDO BORGES FONTES",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "42172",
    "name": "RAFAEL BORGES BARBOSA",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "45199",
    "name": "LARA PINTO TEIXEIRA",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "51765",
    "name": "MATEUS PEREIRA DUARTE",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "45419",
    "name": "BERNARDO ALBUQUERQUE TEIXEIRA",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "44751",
    "name": "HELENA SOUZA MARTINS",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "52047",
    "name": "RAFAEL PAIVA BARBOSA",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "45046",
    "name": "RAFAEL NOGUEIRA ALVES",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "41765",
    "name": "RAFAEL RODRIGUES RIBEIRO",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "42007",
    "name": "SOFIA FREITAS RAMOS",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "11094",
    "name": "BEATRIZ MORAES AZEVEDO",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "41712",
    "name": "LIVIA PAIVA NOGUEIRA",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "41760",
    "name": "PEDRO MORAES MACHADO",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "41536",
    "name": "EDUARDO CARDOSO CASTRO",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "42436",
    "name": "MIGUEL CARVALHO FERREIRA",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "43570",
    "name": "CAIO DIAS CARDOSO",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "43526",
    "name": "ARTHUR NASCIMENTO BRAGA",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "41065",
    "name": "LEONARDO ALMEIDA OLIVEIRA",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "52022",
    "name": "JULIA LIMA RAMOS",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "44104",
    "name": "LIVIA GARCIA FONTES",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "43559",
    "name": "VINICIUS PAIVA BRANDAO",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "52139",
    "name": "JULIA MARTINS LIMA",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "42430",
    "name": "PEDRO ALMEIDA DUARTE",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "42781",
    "name": "LORENZO BARROS MARTINS",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "52571",
    "name": "GUILHERME MARQUES CASTRO",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "42752",
    "name": "THEO GARCIA NOGUEIRA",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "42807",
    "name": "GABRIEL PAIVA LOPES",
    "cpf": "",
    "classId": "F-EM3A"
  },
  // --- Fundamental I (1º ao 5º Ano) ---
  { "registrationNumber": "11001", "name": "ALICE CARVALHO SILVA", "cpf": "", "classId": "F-EF11A" },
  { "registrationNumber": "11002", "name": "BERNARDO SANTOS LIMA", "cpf": "", "classId": "F-EF11A" },
  { "registrationNumber": "11003", "name": "CLARA MENDES DIAS", "cpf": "", "classId": "F-EF11A" },
  { "registrationNumber": "12001", "name": "DAVI OLIVEIRA SOUZA", "cpf": "", "classId": "F-EF12A" },
  { "registrationNumber": "12002", "name": "ELISA PEREIRA ROCHA", "cpf": "", "classId": "F-EF12A" },
  { "registrationNumber": "13001", "name": "FELIPE CARDOSO ALMEIDA", "cpf": "", "classId": "F-EF13A" },
  { "registrationNumber": "13002", "name": "GABRIELA COSTA RIBEIRO", "cpf": "", "classId": "F-EF13A" },
  { "registrationNumber": "14001", "name": "HEITOR NUNES MARTINS", "cpf": "", "classId": "F-EF14A" },
  { "registrationNumber": "14002", "name": "ISABELA LOPES TEIXEIRA", "cpf": "", "classId": "F-EF14A" },
  { "registrationNumber": "15001", "name": "JOAQUIM FERREIRA GOMES", "cpf": "", "classId": "F-EF15A" },
  { "registrationNumber": "15002", "name": "LAURA PINTO MOREIRA", "cpf": "", "classId": "F-EF15A" },
  // --- Turma Medicina (Extensivo / Alta Performance) ---
  { "registrationNumber": "99001", "name": "BEATRIZ ALENCAR RESENDE", "cpf": "", "classId": "MED-EXT" },
  { "registrationNumber": "99002", "name": "CAIO VINICIUS MEDEIROS", "cpf": "", "classId": "MED-EXT" },
  { "registrationNumber": "99003", "name": "MARIANA TEIXEIRA CAVALCANTI", "cpf": "", "classId": "MED-EXT" },
  { "registrationNumber": "99004", "name": "RODRIGO FONTES GUIMARAES", "cpf": "", "classId": "MED-EXT" }
];

export const STUDENTS: StudentData[] = RAW_STUDENTS.map((s) => {
  const room = CLASS_ID_TO_NAME[s.classId] || s.classId || '1 ANO A';
  return {
    ...s,
    id: 'std-' + s.registrationNumber,
    ra: s.registrationNumber,
    classRoom: room,
    className: room,
    class: room,
  };
});

