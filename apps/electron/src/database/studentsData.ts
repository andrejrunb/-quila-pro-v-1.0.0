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
    "name": "ALUNO SINTETICO 001",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "45207",
    "name": "ALUNO SINTETICO 002",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "52239",
    "name": "ALUNO SINTETICO 003",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "45063",
    "name": "ALUNO SINTETICO 004",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "44988",
    "name": "ALUNO SINTETICO 005",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "45397",
    "name": "ALUNO SINTETICO 006",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "44998",
    "name": "ALUNO SINTETICO 007",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "45457",
    "name": "ALUNO SINTETICO 008",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "51475",
    "name": "ALUNO SINTETICO 009",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "44982",
    "name": "ALUNO SINTETICO 010",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "45232",
    "name": "ALUNO SINTETICO 011",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "52468",
    "name": "ALUNO SINTETICO 012",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "45376",
    "name": "ALUNO SINTETICO 013",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "45210",
    "name": "ALUNO SINTETICO 014",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "45482",
    "name": "ALUNO SINTETICO 015",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "51034",
    "name": "ALUNO SINTETICO 016",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "45245",
    "name": "ALUNO SINTETICO 017",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "45414",
    "name": "ALUNO SINTETICO 018",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "52019",
    "name": "ALUNO SINTETICO 019",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "52357",
    "name": "ALUNO SINTETICO 020",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "45023",
    "name": "ALUNO SINTETICO 021",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "52389",
    "name": "ALUNO SINTETICO 022",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "45018",
    "name": "ALUNO SINTETICO 023",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "52578",
    "name": "ALUNO SINTETICO 024",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "52534",
    "name": "ALUNO SINTETICO 025",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "45022",
    "name": "ALUNO SINTETICO 026",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "51023",
    "name": "ALUNO SINTETICO 027",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "45379",
    "name": "ALUNO SINTETICO 028",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "45519",
    "name": "ALUNO SINTETICO 029",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "51734",
    "name": "ALUNO SINTETICO 030",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "45019",
    "name": "ALUNO SINTETICO 031",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "52267",
    "name": "ALUNO SINTETICO 032",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "45190",
    "name": "ALUNO SINTETICO 033",
    "cpf": "",
    "classId": "F-EF26A"
  },
  {
    "registrationNumber": "52478",
    "name": "ALUNO SINTETICO 034",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "52344",
    "name": "ALUNO SINTETICO 035",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45329",
    "name": "ALUNO SINTETICO 036",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45377",
    "name": "ALUNO SINTETICO 037",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45664",
    "name": "ALUNO SINTETICO 038",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45518",
    "name": "ALUNO SINTETICO 039",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45277",
    "name": "ALUNO SINTETICO 040",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45327",
    "name": "ALUNO SINTETICO 041",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "52085",
    "name": "ALUNO SINTETICO 042",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "52630",
    "name": "ALUNO SINTETICO 043",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "51459",
    "name": "ALUNO SINTETICO 044",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "51251",
    "name": "ALUNO SINTETICO 045",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45447",
    "name": "ALUNO SINTETICO 046",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45532",
    "name": "ALUNO SINTETICO 047",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "52280",
    "name": "ALUNO SINTETICO 048",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "51429",
    "name": "ALUNO SINTETICO 049",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45355",
    "name": "ALUNO SINTETICO 050",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "51727",
    "name": "ALUNO SINTETICO 051",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "52238",
    "name": "ALUNO SINTETICO 052",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45319",
    "name": "ALUNO SINTETICO 053",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45206",
    "name": "ALUNO SINTETICO 054",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45646",
    "name": "ALUNO SINTETICO 055",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "52190",
    "name": "ALUNO SINTETICO 056",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "51062",
    "name": "ALUNO SINTETICO 057",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "52043",
    "name": "ALUNO SINTETICO 058",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45062",
    "name": "ALUNO SINTETICO 059",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45221",
    "name": "ALUNO SINTETICO 060",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45017",
    "name": "ALUNO SINTETICO 061",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45259",
    "name": "ALUNO SINTETICO 062",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45691",
    "name": "ALUNO SINTETICO 063",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45496",
    "name": "ALUNO SINTETICO 064",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45083",
    "name": "ALUNO SINTETICO 065",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "52544",
    "name": "ALUNO SINTETICO 066",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "45568",
    "name": "ALUNO SINTETICO 067",
    "cpf": "",
    "classId": "F-EF26B"
  },
  {
    "registrationNumber": "51356",
    "name": "ALUNO SINTETICO 068",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45332",
    "name": "ALUNO SINTETICO 069",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "44551",
    "name": "ALUNO SINTETICO 070",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45418",
    "name": "ALUNO SINTETICO 071",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "52598",
    "name": "ALUNO SINTETICO 072",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45249",
    "name": "ALUNO SINTETICO 073",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45082",
    "name": "ALUNO SINTETICO 074",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45248",
    "name": "ALUNO SINTETICO 075",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45114",
    "name": "ALUNO SINTETICO 076",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45366",
    "name": "ALUNO SINTETICO 077",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45192",
    "name": "ALUNO SINTETICO 078",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "51971",
    "name": "ALUNO SINTETICO 079",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45250",
    "name": "ALUNO SINTETICO 080",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45202",
    "name": "ALUNO SINTETICO 081",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "44548",
    "name": "ALUNO SINTETICO 082",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "44555",
    "name": "ALUNO SINTETICO 083",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45266",
    "name": "ALUNO SINTETICO 084",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45265",
    "name": "ALUNO SINTETICO 085",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "44673",
    "name": "ALUNO SINTETICO 086",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "51422",
    "name": "ALUNO SINTETICO 087",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45048",
    "name": "ALUNO SINTETICO 088",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45261",
    "name": "ALUNO SINTETICO 089",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45216",
    "name": "ALUNO SINTETICO 090",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45252",
    "name": "ALUNO SINTETICO 091",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45317",
    "name": "ALUNO SINTETICO 092",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45226",
    "name": "ALUNO SINTETICO 093",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "44516",
    "name": "ALUNO SINTETICO 094",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45177",
    "name": "ALUNO SINTETICO 095",
    "cpf": "",
    "classId": "F-EF27A"
  },
  {
    "registrationNumber": "45535",
    "name": "ALUNO SINTETICO 096",
    "cpf": "",
    "classId": "F-EF27B"
  },
  {
    "registrationNumber": "45087",
    "name": "ALUNO SINTETICO 097",
    "cpf": "",
    "classId": "F-EF27B"
  },
  {
    "registrationNumber": "45347",
    "name": "ALUNO SINTETICO 098",
    "cpf": "",
    "classId": "F-EF27B"
  },
  {
    "registrationNumber": "51980",
    "name": "ALUNO SINTETICO 099",
    "cpf": "",
    "classId": "F-EF27B"
  },
  {
    "registrationNumber": "44817",
    "name": "ALUNO SINTETICO 100",
    "cpf": "",
    "classId": "F-EF27B"
  },
  {
    "registrationNumber": "45695",
    "name": "ALUNO SINTETICO 101",
    "cpf": "",
    "classId": "F-EF27B"
  },
  {
    "registrationNumber": "45505",
    "name": "ALUNO SINTETICO 102",
    "cpf": "",
    "classId": "F-EF27B"
  },
  {
    "registrationNumber": "52025",
    "name": "ALUNO SINTETICO 103",
    "cpf": "",
    "classId": "F-EF27B"
  },
  {
    "registrationNumber": "45045",
    "name": "ALUNO SINTETICO 104",
    "cpf": "",
    "classId": "F-EF27B"
  },
  {
    "registrationNumber": "50999",
    "name": "ALUNO SINTETICO 105",
    "cpf": "",
    "classId": "F-EF27B"
  },
  {
    "registrationNumber": "44993",
    "name": "ALUNO SINTETICO 106",
    "cpf": "",
    "classId": "F-EF27B"
  },
  {
    "registrationNumber": "51054",
    "name": "ALUNO SINTETICO 107",
    "cpf": "",
    "classId": "F-EF27B"
  },
  {
    "registrationNumber": "45420",
    "name": "ALUNO SINTETICO 108",
    "cpf": "",
    "classId": "F-EF27B"
  },
  {
    "registrationNumber": "45096",
    "name": "ALUNO SINTETICO 109",
    "cpf": "",
    "classId": "F-EF27B"
  },
  {
    "registrationNumber": "45223",
    "name": "ALUNO SINTETICO 110",
    "cpf": "",
    "classId": "F-EF27B"
  },
  {
    "registrationNumber": "51404",
    "name": "ALUNO SINTETICO 111",
    "cpf": "",
    "classId": "F-EF27B"
  },
  {
    "registrationNumber": "45025",
    "name": "ALUNO SINTETICO 112",
    "cpf": "",
    "classId": "F-EF27B"
  },
  {
    "registrationNumber": "52449",
    "name": "ALUNO SINTETICO 113",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "51468",
    "name": "ALUNO SINTETICO 114",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "44036",
    "name": "ALUNO SINTETICO 115",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "44940",
    "name": "ALUNO SINTETICO 116",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "52490",
    "name": "ALUNO SINTETICO 117",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "44745",
    "name": "ALUNO SINTETICO 118",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "44010",
    "name": "ALUNO SINTETICO 119",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "43989",
    "name": "ALUNO SINTETICO 120",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "45498",
    "name": "ALUNO SINTETICO 121",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "51458",
    "name": "ALUNO SINTETICO 122",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "51710",
    "name": "ALUNO SINTETICO 123",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "52484",
    "name": "ALUNO SINTETICO 124",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "44730",
    "name": "ALUNO SINTETICO 125",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "44640",
    "name": "ALUNO SINTETICO 126",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "45343",
    "name": "ALUNO SINTETICO 127",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "44952",
    "name": "ALUNO SINTETICO 128",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "45386",
    "name": "ALUNO SINTETICO 129",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "44990",
    "name": "ALUNO SINTETICO 130",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "44768",
    "name": "ALUNO SINTETICO 131",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "45506",
    "name": "ALUNO SINTETICO 132",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "43811",
    "name": "ALUNO SINTETICO 133",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "52366",
    "name": "ALUNO SINTETICO 134",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "45024",
    "name": "ALUNO SINTETICO 135",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "44630",
    "name": "ALUNO SINTETICO 136",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "45709",
    "name": "ALUNO SINTETICO 137",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "44164",
    "name": "ALUNO SINTETICO 138",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "44608",
    "name": "ALUNO SINTETICO 139",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "52339",
    "name": "ALUNO SINTETICO 140",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "45222",
    "name": "ALUNO SINTETICO 141",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "45097",
    "name": "ALUNO SINTETICO 142",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "44450",
    "name": "ALUNO SINTETICO 143",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "51565",
    "name": "ALUNO SINTETICO 144",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "45204",
    "name": "ALUNO SINTETICO 145",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "52309",
    "name": "ALUNO SINTETICO 146",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "45029",
    "name": "ALUNO SINTETICO 147",
    "cpf": "",
    "classId": "F-EF28A"
  },
  {
    "registrationNumber": "44587",
    "name": "ALUNO SINTETICO 148",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "43603",
    "name": "ALUNO SINTETICO 149",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "45548",
    "name": "ALUNO SINTETICO 150",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "52201",
    "name": "ALUNO SINTETICO 151",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "45155",
    "name": "ALUNO SINTETICO 152",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "43406",
    "name": "ALUNO SINTETICO 153",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "45036",
    "name": "ALUNO SINTETICO 154",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "44357",
    "name": "ALUNO SINTETICO 155",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "44696",
    "name": "ALUNO SINTETICO 156",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "44660",
    "name": "ALUNO SINTETICO 157",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "52466",
    "name": "ALUNO SINTETICO 158",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "43270",
    "name": "ALUNO SINTETICO 159",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "44028",
    "name": "ALUNO SINTETICO 160",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "44308",
    "name": "ALUNO SINTETICO 161",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "44479",
    "name": "ALUNO SINTETICO 162",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "51048",
    "name": "ALUNO SINTETICO 163",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "44004",
    "name": "ALUNO SINTETICO 164",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "44976",
    "name": "ALUNO SINTETICO 165",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "44618",
    "name": "ALUNO SINTETICO 166",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "45176",
    "name": "ALUNO SINTETICO 167",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "44646",
    "name": "ALUNO SINTETICO 168",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "45021",
    "name": "ALUNO SINTETICO 169",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "44471",
    "name": "ALUNO SINTETICO 170",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "45534",
    "name": "ALUNO SINTETICO 171",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "51106",
    "name": "ALUNO SINTETICO 172",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "45407",
    "name": "ALUNO SINTETICO 173",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "44006",
    "name": "ALUNO SINTETICO 174",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "51047",
    "name": "ALUNO SINTETICO 175",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "44765",
    "name": "ALUNO SINTETICO 176",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "52320",
    "name": "ALUNO SINTETICO 177",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "45032",
    "name": "ALUNO SINTETICO 178",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "45131",
    "name": "ALUNO SINTETICO 179",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "52507",
    "name": "ALUNO SINTETICO 180",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "52576",
    "name": "ALUNO SINTETICO 181",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "45035",
    "name": "ALUNO SINTETICO 182",
    "cpf": "",
    "classId": "F-EF28B"
  },
  {
    "registrationNumber": "44598",
    "name": "ALUNO SINTETICO 183",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "52044",
    "name": "ALUNO SINTETICO 184",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "52244",
    "name": "ALUNO SINTETICO 185",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "51103",
    "name": "ALUNO SINTETICO 186",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "44565",
    "name": "ALUNO SINTETICO 187",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "43440",
    "name": "ALUNO SINTETICO 188",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "43439",
    "name": "ALUNO SINTETICO 189",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "44755",
    "name": "ALUNO SINTETICO 190",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "45555",
    "name": "ALUNO SINTETICO 191",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "43000",
    "name": "ALUNO SINTETICO 192",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "44033",
    "name": "ALUNO SINTETICO 193",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "43926",
    "name": "ALUNO SINTETICO 194",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "45693",
    "name": "ALUNO SINTETICO 195",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "44188",
    "name": "ALUNO SINTETICO 196",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "43432",
    "name": "ALUNO SINTETICO 197",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "44564",
    "name": "ALUNO SINTETICO 198",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "43684",
    "name": "ALUNO SINTETICO 199",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "45110",
    "name": "ALUNO SINTETICO 200",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "45125",
    "name": "ALUNO SINTETICO 201",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "44652",
    "name": "ALUNO SINTETICO 202",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "42820",
    "name": "ALUNO SINTETICO 203",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "45422",
    "name": "ALUNO SINTETICO 204",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "43515",
    "name": "ALUNO SINTETICO 205",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "44309",
    "name": "ALUNO SINTETICO 206",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "52548",
    "name": "ALUNO SINTETICO 207",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "45301",
    "name": "ALUNO SINTETICO 208",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "52276",
    "name": "ALUNO SINTETICO 209",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "52557",
    "name": "ALUNO SINTETICO 210",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "43895",
    "name": "ALUNO SINTETICO 211",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "51033",
    "name": "ALUNO SINTETICO 212",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "51763",
    "name": "ALUNO SINTETICO 213",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "42817",
    "name": "ALUNO SINTETICO 214",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "45315",
    "name": "ALUNO SINTETICO 215",
    "cpf": "",
    "classId": "F-EF29A"
  },
  {
    "registrationNumber": "52516",
    "name": "ALUNO SINTETICO 216",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "52579",
    "name": "ALUNO SINTETICO 217",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "43529",
    "name": "ALUNO SINTETICO 218",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "44022",
    "name": "ALUNO SINTETICO 219",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "44504",
    "name": "ALUNO SINTETICO 220",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "43929",
    "name": "ALUNO SINTETICO 221",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "43674",
    "name": "ALUNO SINTETICO 222",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "44046",
    "name": "ALUNO SINTETICO 223",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "45091",
    "name": "ALUNO SINTETICO 224",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "51030",
    "name": "ALUNO SINTETICO 225",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "43567",
    "name": "ALUNO SINTETICO 226",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "43362",
    "name": "ALUNO SINTETICO 227",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "52573",
    "name": "ALUNO SINTETICO 228",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "44007",
    "name": "ALUNO SINTETICO 229",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "52287",
    "name": "ALUNO SINTETICO 230",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "44501",
    "name": "ALUNO SINTETICO 231",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "44325",
    "name": "ALUNO SINTETICO 232",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "43419",
    "name": "ALUNO SINTETICO 233",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "43947",
    "name": "ALUNO SINTETICO 234",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "43820",
    "name": "ALUNO SINTETICO 235",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "44184",
    "name": "ALUNO SINTETICO 236",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "44217",
    "name": "ALUNO SINTETICO 237",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "51390",
    "name": "ALUNO SINTETICO 238",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "43614",
    "name": "ALUNO SINTETICO 239",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "43996",
    "name": "ALUNO SINTETICO 240",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "45337",
    "name": "ALUNO SINTETICO 241",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "44203",
    "name": "ALUNO SINTETICO 242",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "45710",
    "name": "ALUNO SINTETICO 243",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "52288",
    "name": "ALUNO SINTETICO 244",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "44846",
    "name": "ALUNO SINTETICO 245",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "44049",
    "name": "ALUNO SINTETICO 246",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "51706",
    "name": "ALUNO SINTETICO 247",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "52392",
    "name": "ALUNO SINTETICO 248",
    "cpf": "",
    "classId": "F-EF29B"
  },
  {
    "registrationNumber": "52037",
    "name": "ALUNO SINTETICO 249",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "51726",
    "name": "ALUNO SINTETICO 250",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "51469",
    "name": "ALUNO SINTETICO 251",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "43517",
    "name": "ALUNO SINTETICO 252",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "43415",
    "name": "ALUNO SINTETICO 253",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "42741",
    "name": "ALUNO SINTETICO 254",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "52533",
    "name": "ALUNO SINTETICO 255",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "45275",
    "name": "ALUNO SINTETICO 256",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "44080",
    "name": "ALUNO SINTETICO 257",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "44571",
    "name": "ALUNO SINTETICO 258",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "44769",
    "name": "ALUNO SINTETICO 259",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "43383",
    "name": "ALUNO SINTETICO 260",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "44200",
    "name": "ALUNO SINTETICO 261",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "43422",
    "name": "ALUNO SINTETICO 262",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "43336",
    "name": "ALUNO SINTETICO 263",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "52512",
    "name": "ALUNO SINTETICO 264",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "44071",
    "name": "ALUNO SINTETICO 265",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "43084",
    "name": "ALUNO SINTETICO 266",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "52026",
    "name": "ALUNO SINTETICO 267",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "43074",
    "name": "ALUNO SINTETICO 268",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "51319",
    "name": "ALUNO SINTETICO 269",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "43621",
    "name": "ALUNO SINTETICO 270",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "51656",
    "name": "ALUNO SINTETICO 271",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "52243",
    "name": "ALUNO SINTETICO 272",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "43321",
    "name": "ALUNO SINTETICO 273",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "43436",
    "name": "ALUNO SINTETICO 274",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "51457",
    "name": "ALUNO SINTETICO 275",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "43509",
    "name": "ALUNO SINTETICO 276",
    "cpf": "",
    "classId": "F-EM1A"
  },
  {
    "registrationNumber": "51091",
    "name": "ALUNO SINTETICO 277",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "45040",
    "name": "ALUNO SINTETICO 278",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "45650",
    "name": "ALUNO SINTETICO 279",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "51400",
    "name": "ALUNO SINTETICO 280",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "51643",
    "name": "ALUNO SINTETICO 281",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "51649",
    "name": "ALUNO SINTETICO 282",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "44671",
    "name": "ALUNO SINTETICO 283",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "43843",
    "name": "ALUNO SINTETICO 284",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "43420",
    "name": "ALUNO SINTETICO 285",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "51105",
    "name": "ALUNO SINTETICO 286",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "42850",
    "name": "ALUNO SINTETICO 287",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "43438",
    "name": "ALUNO SINTETICO 288",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "41761",
    "name": "ALUNO SINTETICO 289",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "44594",
    "name": "ALUNO SINTETICO 290",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "45295",
    "name": "ALUNO SINTETICO 291",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "44581",
    "name": "ALUNO SINTETICO 292",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "45530",
    "name": "ALUNO SINTETICO 293",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "52420",
    "name": "ALUNO SINTETICO 294",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "52539",
    "name": "ALUNO SINTETICO 295",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "43452",
    "name": "ALUNO SINTETICO 296",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "43846",
    "name": "ALUNO SINTETICO 297",
    "cpf": "",
    "classId": "F-EM1B"
  },
  {
    "registrationNumber": "42775",
    "name": "ALUNO SINTETICO 298",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "43478",
    "name": "ALUNO SINTETICO 299",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "51924",
    "name": "ALUNO SINTETICO 300",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "42316",
    "name": "ALUNO SINTETICO 301",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "43247",
    "name": "ALUNO SINTETICO 302",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "43505",
    "name": "ALUNO SINTETICO 303",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "45647",
    "name": "ALUNO SINTETICO 304",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "52599",
    "name": "ALUNO SINTETICO 305",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "42933",
    "name": "ALUNO SINTETICO 306",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "44264",
    "name": "ALUNO SINTETICO 307",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "51673",
    "name": "ALUNO SINTETICO 308",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "45290",
    "name": "ALUNO SINTETICO 309",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "43864",
    "name": "ALUNO SINTETICO 310",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "42616",
    "name": "ALUNO SINTETICO 311",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "45643",
    "name": "ALUNO SINTETICO 312",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "45645",
    "name": "ALUNO SINTETICO 313",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "43378",
    "name": "ALUNO SINTETICO 314",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "51357",
    "name": "ALUNO SINTETICO 315",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "52264",
    "name": "ALUNO SINTETICO 316",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "44799",
    "name": "ALUNO SINTETICO 317",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "42627",
    "name": "ALUNO SINTETICO 318",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "41915",
    "name": "ALUNO SINTETICO 319",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "45464",
    "name": "ALUNO SINTETICO 320",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "51379",
    "name": "ALUNO SINTETICO 321",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "41814",
    "name": "ALUNO SINTETICO 322",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "44095",
    "name": "ALUNO SINTETICO 323",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "42867",
    "name": "ALUNO SINTETICO 324",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "52268",
    "name": "ALUNO SINTETICO 325",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "44663",
    "name": "ALUNO SINTETICO 326",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "51487",
    "name": "ALUNO SINTETICO 327",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "52275",
    "name": "ALUNO SINTETICO 328",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "41763",
    "name": "ALUNO SINTETICO 329",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "43341",
    "name": "ALUNO SINTETICO 330",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "44591",
    "name": "ALUNO SINTETICO 331",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "44949",
    "name": "ALUNO SINTETICO 332",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "42885",
    "name": "ALUNO SINTETICO 333",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "43400",
    "name": "ALUNO SINTETICO 334",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "43596",
    "name": "ALUNO SINTETICO 335",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "42879",
    "name": "ALUNO SINTETICO 336",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "42231",
    "name": "ALUNO SINTETICO 337",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "43318",
    "name": "ALUNO SINTETICO 338",
    "cpf": "",
    "classId": "F-EM2A"
  },
  {
    "registrationNumber": "51339",
    "name": "ALUNO SINTETICO 339",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "42789",
    "name": "ALUNO SINTETICO 340",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "42172",
    "name": "ALUNO SINTETICO 341",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "45199",
    "name": "ALUNO SINTETICO 342",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "51765",
    "name": "ALUNO SINTETICO 343",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "45419",
    "name": "ALUNO SINTETICO 344",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "44751",
    "name": "ALUNO SINTETICO 345",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "52047",
    "name": "ALUNO SINTETICO 346",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "45046",
    "name": "ALUNO SINTETICO 347",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "41765",
    "name": "ALUNO SINTETICO 348",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "42007",
    "name": "ALUNO SINTETICO 349",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "11094",
    "name": "ALUNO SINTETICO 350",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "41712",
    "name": "ALUNO SINTETICO 351",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "41760",
    "name": "ALUNO SINTETICO 352",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "41536",
    "name": "ALUNO SINTETICO 353",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "42436",
    "name": "ALUNO SINTETICO 354",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "43570",
    "name": "ALUNO SINTETICO 355",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "43526",
    "name": "ALUNO SINTETICO 356",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "41065",
    "name": "ALUNO SINTETICO 357",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "52022",
    "name": "ALUNO SINTETICO 358",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "44104",
    "name": "ALUNO SINTETICO 359",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "43559",
    "name": "ALUNO SINTETICO 360",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "52139",
    "name": "ALUNO SINTETICO 361",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "42430",
    "name": "ALUNO SINTETICO 362",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "42781",
    "name": "ALUNO SINTETICO 363",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "52571",
    "name": "ALUNO SINTETICO 364",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "42752",
    "name": "ALUNO SINTETICO 365",
    "cpf": "",
    "classId": "F-EM3A"
  },
  {
    "registrationNumber": "42807",
    "name": "ALUNO SINTETICO 366",
    "cpf": "",
    "classId": "F-EM3A"
  },
  // --- Fundamental I (1º ao 5º Ano) ---
  { "registrationNumber": "11001", "name": "ALUNO SINTETICO 367", "cpf": "", "classId": "F-EF11A" },
  { "registrationNumber": "11002", "name": "ALUNO SINTETICO 368", "cpf": "", "classId": "F-EF11A" },
  { "registrationNumber": "11003", "name": "ALUNO SINTETICO 369", "cpf": "", "classId": "F-EF11A" },
  { "registrationNumber": "12001", "name": "ALUNO SINTETICO 370", "cpf": "", "classId": "F-EF12A" },
  { "registrationNumber": "12002", "name": "ALUNO SINTETICO 371", "cpf": "", "classId": "F-EF12A" },
  { "registrationNumber": "13001", "name": "ALUNO SINTETICO 372", "cpf": "", "classId": "F-EF13A" },
  { "registrationNumber": "13002", "name": "ALUNO SINTETICO 373", "cpf": "", "classId": "F-EF13A" },
  { "registrationNumber": "14001", "name": "ALUNO SINTETICO 374", "cpf": "", "classId": "F-EF14A" },
  { "registrationNumber": "14002", "name": "ALUNO SINTETICO 375", "cpf": "", "classId": "F-EF14A" },
  { "registrationNumber": "15001", "name": "ALUNO SINTETICO 376", "cpf": "", "classId": "F-EF15A" },
  { "registrationNumber": "15002", "name": "ALUNO SINTETICO 377", "cpf": "", "classId": "F-EF15A" },
  // --- Turma Medicina (Extensivo / Alta Performance) ---
  { "registrationNumber": "99001", "name": "ALUNO SINTETICO 378", "cpf": "", "classId": "MED-EXT" },
  { "registrationNumber": "99002", "name": "ALUNO SINTETICO 379", "cpf": "", "classId": "MED-EXT" },
  { "registrationNumber": "99003", "name": "ALUNO SINTETICO 380", "cpf": "", "classId": "MED-EXT" },
  { "registrationNumber": "99004", "name": "ALUNO SINTETICO 381", "cpf": "", "classId": "MED-EXT" }
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

