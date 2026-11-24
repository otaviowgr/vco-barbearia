import type { Barbeiro, Cliente, ConfigBarbearia, Servico, Usuario } from "@/types";

const unsplash = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

export const IMAGEM_HERO = unsplash("photo-1585747860715-2ba37e788b70", 1600);
export const IMAGEM_LOGIN = unsplash("photo-1503951914875-452162b0f3f1", 1400);

export const configSeed: ConfigBarbearia = {
  nome: "VCO Barbearia",
  slogan: "Estilo, precisão e um bom papo.",
  sobre:
    "Desde 2018 cuidando do visual de quem não abre mão de estilo. Ambiente climatizado, café e cerveja gelada por conta da casa, e uma equipe que entende de corte clássico e moderno.",
  endereco: "Rua das Palmeiras, 123 – Centro",
  cidade: "Florianópolis – SC",
  telefone: "(48) 99999-1234",
  whatsapp: "5548999991234",
  instagram: "@vcobarbearia",
  horarios: [
    null, // domingo
    { abre: "09:00", fecha: "20:00" },
    { abre: "09:00", fecha: "20:00" },
    { abre: "09:00", fecha: "20:00" },
    { abre: "09:00", fecha: "20:00" },
    { abre: "09:00", fecha: "20:00" },
    { abre: "08:00", fecha: "18:00" }, // sábado
  ],
  intervaloSlotsMin: 30,
  fidelidade: { meta: 5, percentual: 20 },
};

export const servicosSeed: Servico[] = [
  {
    id: "srv-corte",
    nome: "Corte masculino",
    descricao: "Corte na tesoura e/ou máquina, lavagem, finalização com pomada e acabamento na navalha.",
    duracaoMin: 40,
    preco: 45,
    foto: unsplash("photo-1503951914875-452162b0f3f1"),
    ativo: true,
    destaque: true,
  },
  {
    id: "srv-barba",
    nome: "Barba",
    descricao: "Toalha quente, desenho com navalha, hidratação com óleo e balm pós-barba.",
    duracaoMin: 30,
    preco: 35,
    foto: unsplash("photo-1621605815971-fbc98d665033"),
    ativo: true,
    destaque: true,
  },
  {
    id: "srv-combo",
    nome: "Corte + Barba",
    descricao: "O combo completo: corte, barba com toalha quente e finalização. Sai mais em conta!",
    duracaoMin: 60,
    preco: 70,
    foto: unsplash("photo-1599351431202-1e0f0137899a"),
    ativo: true,
    destaque: true,
  },
  {
    id: "srv-degrade",
    nome: "Degradê",
    descricao: "Fade com transição suave (low, mid ou high), acabamento na navalha e risquinho opcional.",
    duracaoMin: 45,
    preco: 50,
    foto: unsplash("photo-1622286342621-4bd786c2447c"),
    ativo: true,
    destaque: true,
  },
  {
    id: "srv-pigmentacao",
    nome: "Pigmentação",
    descricao: "Preenchimento de falhas na barba ou no cabelo com pigmento, para um visual mais uniforme.",
    duracaoMin: 30,
    preco: 40,
    foto: unsplash("photo-1605497788044-5a32c7078486"),
    ativo: true,
    destaque: false,
  },
  {
    id: "srv-sobrancelha",
    nome: "Sobrancelha",
    descricao: "Limpeza e alinhamento da sobrancelha com navalha ou pinça, mantendo o aspecto natural.",
    duracaoMin: 15,
    preco: 15,
    foto: unsplash("photo-1512690459411-b9245aed614b"),
    ativo: true,
    destaque: false,
  },
  {
    id: "srv-hidratacao",
    nome: "Hidratação",
    descricao: "Lavagem com shampoo específico, máscara hidratante e massagem capilar relaxante.",
    duracaoMin: 30,
    preco: 30,
    foto: unsplash("photo-1517832606299-7ae9b720a186"),
    ativo: true,
    destaque: false,
  },
];

export const barbeirosSeed: Barbeiro[] = [
  {
    id: "brb-carlos",
    nome: "Carlos",
    especialidade: "Cortes clássicos e barba",
    bio: "Fundador da VCO, 12 anos de navalha. Mestre na barba com toalha quente.",
    foto: unsplash("photo-1500648767791-00dcc994a43e", 400),
    telefone: "(48) 99999-1234",
    cor: "#d99a2b",
    ativo: true,
    temLogin: true,
  },
  {
    id: "brb-rafael",
    nome: "Rafael Souza",
    especialidade: "Degradê e freestyle",
    bio: "Especialista em fade e desenhos. Se tem risquinho, é com ele.",
    foto: unsplash("photo-1507003211169-0a1dd7228f2d", 400),
    telefone: "(48) 98888-2222",
    cor: "#2f9ad8",
    ativo: true,
    temLogin: false,
  },
  {
    id: "brb-lucas",
    nome: "Lucas Mendes",
    especialidade: "Pigmentação e visagismo",
    bio: "Visagista: analisa o formato do rosto para indicar o corte ideal.",
    foto: unsplash("photo-1506794778202-cad84cf45f1d", 400),
    telefone: "(48) 97777-3333",
    cor: "#e0607e",
    ativo: true,
    temLogin: false,
  },
];

export const CLIENTE_DEMO_ID = "cli-joao";
export const BARBEIRO_DEMO_ID = "brb-carlos";

export const clientesSeed: Cliente[] = [
  { id: CLIENTE_DEMO_ID, nome: "João Silva", email: "cliente@demo.com", telefone: "(48) 99999-0000", criadoEm: "2025-09-02T10:00:00.000Z" },
  { id: "cli-pedro", nome: "Pedro Henrique Costa", email: "pedro.costa@email.com", telefone: "(48) 99812-4471", criadoEm: "2025-08-11T10:00:00.000Z" },
  { id: "cli-marcos", nome: "Marcos Vinícius Rocha", email: "marcos.rocha@email.com", telefone: "(48) 99654-2208", criadoEm: "2025-08-15T10:00:00.000Z" },
  { id: "cli-felipe", nome: "Felipe Andrade", email: "felipe.andrade@email.com", telefone: "(48) 98431-7765", criadoEm: "2025-09-20T10:00:00.000Z" },
  { id: "cli-gabriel", nome: "Gabriel Martins", email: "gabriel.m@email.com", telefone: "(48) 99127-3390", criadoEm: "2025-10-03T10:00:00.000Z" },
  { id: "cli-thiago", nome: "Thiago Ramos", email: "thiago.ramos@email.com", telefone: "(48) 98822-6014", criadoEm: "2025-10-28T10:00:00.000Z" },
  { id: "cli-bruno", nome: "Bruno Carvalho", email: "bruno.carvalho@email.com", telefone: "(48) 99703-5582", criadoEm: "2025-11-09T10:00:00.000Z" },
  { id: "cli-andre", nome: "André Luiz Pereira", email: "andre.pereira@email.com", telefone: "(48) 98546-1127", criadoEm: "2026-01-14T10:00:00.000Z" },
  { id: "cli-rodrigo", nome: "Rodrigo Nunes", email: "rodrigo.nunes@email.com", telefone: "(48) 99288-9043", criadoEm: "2026-02-02T10:00:00.000Z" },
  { id: "cli-matheus", nome: "Matheus Lima", email: "matheus.lima@email.com", telefone: "(48) 98015-6630", criadoEm: "2026-03-19T10:00:00.000Z" },
  { id: "cli-diego", nome: "Diego Fernandes", email: "diego.f@email.com", telefone: "(48) 99476-8812", criadoEm: "2026-05-07T10:00:00.000Z" },
  { id: "cli-vitor", nome: "Vitor Hugo Alves", email: "vitor.alves@email.com", telefone: "(48) 98367-2451", criadoEm: "2026-07-22T10:00:00.000Z" },
];

export const usuariosSeed: Usuario[] = [
  {
    id: "usr-cliente-demo",
    nome: "João Silva",
    email: "cliente@demo.com",
    senha: "123456",
    telefone: "(48) 99999-0000",
    perfil: "cliente",
    clienteId: CLIENTE_DEMO_ID,
  },
  {
    id: "usr-barbeiro-demo",
    nome: "Carlos",
    email: "barbeiro@demo.com",
    senha: "123456",
    telefone: "(48) 99999-1234",
    perfil: "barbeiro",
    barbeiroId: BARBEIRO_DEMO_ID,
    isAdmin: true,
  },
];
