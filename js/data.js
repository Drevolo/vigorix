// Vigorix - Dados dos Treinos
// Extraídos do plano: "Plano de Treino Semanal e Metas.xlsx"

export const RODADAS = 3;
export const DESCANSO_EXERCICIO_MIN = 30;
export const DESCANSO_EXERCICIO_MAX = 40;
export const DESCANSO_RODADA = 60;

export const DIAS_PARA_TREINO = {
  0: "A", // Domingo
  1: "A", // Segunda
  2: "B", // Terça
  3: "A", // Quarta
  4: "B", // Quinta
  5: "A", // Sexta
  6: "B"  // Sábado
};

export const NOMES_DIAS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado"
];

export const TREINO_A = [
  {
    id: "polichinelos",
    nome: "Polichinelos",
    foco: "Aquecimento e Cardio",
    instrucao: "Movimento completo dos braços e pernas.",
    meta: {
      "Semana 1": "15 reps",
      "Semana 2": "20 reps",
      "Semana 3": "25 reps",
      "Semana 4+": "30 reps"
    }
  },
  {
    id: "agachamento_livre",
    nome: "Agachamento Livre",
    foco: "Pernas e Glúteos",
    instrucao: "Descer até 90 graus, mantendo o tronco reto.",
    meta: {
      "Semana 1": "10 reps",
      "Semana 2": "12 reps",
      "Semana 3": "15 reps",
      "Semana 4+": "18 reps"
    }
  },
  {
    id: "escaladores",
    nome: "Escaladores (Mountain Climbers)",
    foco: "Core e Cardio",
    instrucao: "Trazer os joelhos em direção ao peito alternadamente em posição de prancha.",
    meta: {
      "Semana 1": "16 reps (8/perna)",
      "Semana 2": "20 reps (10/perna)",
      "Semana 3": "24 reps (12/perna)",
      "Semana 4+": "30 reps (15/perna)"
    }
  },
  {
    id: "flexao_braco",
    nome: "Flexão de Braço",
    foco: "Peitoral e Tríceps",
    instrucao: "Corpo reto, descer até o peito quase tocar o chão (pode usar os joelhos se precisar).",
    meta: {
      "Semana 1": "8 reps",
      "Semana 2": "10 reps",
      "Semana 3": "12 reps",
      "Semana 4+": "15 reps"
    }
  },
  {
    id: "toque_pes_a",
    nome: "Toque nos Pés (Touch Toes)",
    foco: "Abdômen",
    instrucao: "Deitado de costas, pernas para cima, tentar tocar a ponta dos pés.",
    meta: {
      "Semana 1": "30 seg",
      "Semana 2": "30 seg",
      "Semana 3": "45 seg",
      "Semana 4+": "45 seg"
    }
  }
];

export const TREINO_B = [
  {
    id: "anjos_parede",
    nome: "Anjos na Parede (Wall Angels)",
    foco: "Postura e Ombros",
    instrucao: "Costas e braços encostados na parede, deslizar os braços para cima e para baixo.",
    meta: {
      "Semana 1": "8 reps",
      "Semana 2": "10 reps",
      "Semana 3": "12 reps",
      "Semana 4+": "15 reps"
    }
  },
  {
    id: "cadeira_parede",
    nome: "Cadeira na Parede (Wall Sit)",
    foco: "Isometria de Pernas",
    instrucao: "Costas na parede, joelhos a 90 graus, segurar a posição.",
    meta: {
      "Semana 1": "20 seg",
      "Semana 2": "30 seg",
      "Semana 3": "40 seg",
      "Semana 4+": "45 seg"
    }
  },
  {
    id: "elevacao_tibial",
    nome: "Elevação de Tibial (Tib Raises)",
    foco: "Canelas (Prevenção)",
    instrucao: "Calcanhares no chão, costas na parede, levantar as pontas dos pés.",
    meta: {
      "Semana 1": "12 reps",
      "Semana 2": "15 reps",
      "Semana 3": "18 reps",
      "Semana 4+": "20 reps"
    }
  },
  {
    id: "elevacao_panturrilha",
    nome: "Elevação de Panturrilha (Calf Raises)",
    foco: "Panturrilhas",
    instrucao: "Ficar na ponta dos pés o mais alto possível e descer devagar.",
    meta: {
      "Semana 1": "15 reps",
      "Semana 2": "20 reps",
      "Semana 3": "25 reps",
      "Semana 4+": "30 reps"
    }
  },
  {
    id: "toque_pes_b",
    nome: "Toque nos Pés (Touch Toes)",
    foco: "Abdômen",
    instrucao: "Deitado de costas, pernas para cima, tentar tocar a ponta dos pés.",
    meta: {
      "Semana 1": "30 seg",
      "Semana 2": "30 seg",
      "Semana 3": "45 seg",
      "Semana 4+": "45 seg"
    }
  }
];

export const SEMANAS = ["Semana 1", "Semana 2", "Semana 3", "Semana 4+"];
