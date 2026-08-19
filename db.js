/* ==========================================================================
   LABPROJ - CAMADA DE BANCO DE DADOS & PERSISTÊNCIA (DB.JS)
   Garantia de integridade e sincronização automática entre Alunos e Projetos
   ========================================================================== */

const DB_KEYS = {
  USERS: 'labproj_users_v2',
  PROJECTS: 'labproj_projects_v2',
  SESSION: 'labproj_active_session'
};

// Usuários Padrão para Iniciar o Banco de Dados
const INITIAL_USERS = [
  {
    id: 'user_admin_1',
    name: 'Prof. Dr. Carlos Andrade',
    email: 'prof.carlos@lab.uf.br',
    password: '123',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150'
  },
  {
    id: 'user_aluno_1',
    name: 'Lucas Ferreira',
    email: 'lucas.ferreira@lab.uf.br',
    password: '123',
    role: 'aluno',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    lattesUrl: 'http://lattes.cnpq.br/1234567890123456'
  },
  {
    id: 'user_aluno_2',
    name: 'Beatriz Oliveira',
    email: 'beatriz.oliveira@lab.uf.br',
    password: '123',
    role: 'aluno',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    lattesUrl: 'http://lattes.cnpq.br/9876543210987654'
  }
];

// Projetos Iniciais do Banco
const INITIAL_PROJECTS = [
  {
    id: 1,
    studentId: 'user_aluno_1',
    studentName: 'Lucas Ferreira',
    studentEmail: 'lucas.ferreira@lab.uf.br',
    studentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    title: 'Desenvolvimento de Algoritmos de Aprendizado de Máquina Aplicados à Análise de Imagens Médicas',
    modalidade: 'PIBIC',
    cota: 'bolsista',
    agencia: 'CNPq',
    lattesUrl: 'http://lattes.cnpq.br/1234567890123456',
    collaborators: 'Dr. Roberto Silva (Co-orientador), Mariane Costa (Mestranda)',
    resumo: 'Este projeto investiga a aplicação de redes neurais convolucionais (CNNs) para segmentação e classificação automática de lesões em exames dermatológicos. O objetivo é criar um pipeline computacional de alto desempenho capaz de auxiliar no diagnóstico precoce de melanomas com precisão superior a 95%.',
    cronograma: [
      { id: 101, atividade: 'Revisão Bibliográfica e Estado da Arte em CNNs', mesInicio: 'Mês 1', mesFim: 'Mês 2', status: 'Concluído' },
      { id: 102, atividade: 'Pré-processamento e Aumento do Banco de Dados de Imagens', mesInicio: 'Mês 3', mesFim: 'Mês 4', status: 'Concluído' },
      { id: 103, atividade: 'Treinamento e Ajuste de Hiperparâmetros dos Modelos', mesInicio: 'Mês 5', mesFim: 'Mês 7', status: 'Em Andamento' },
      { id: 104, atividade: 'Testes Comparativos e Redação do Relatório Final', mesInicio: 'Mês 8', mesFim: 'Mês 12', status: 'Pendente' }
    ],
    relatorios: {
      parcial: {
        status: 'Aprovado',
        link: 'https://drive.google.com/file/d/sample-relatorio-parcial-lucas/view',
        fileName: 'Relatorio_Parcial_Lucas_Ferreira.pdf',
        fileData: '',
        fileType: 'application/pdf',
        feedback: 'Excelente progresso. A fundamentação teórica e a organização da base de dados foram muito bem executadas.',
        dataEntrega: '12/03/2026'
      },
      final: {
        status: 'Em Análise',
        link: '',
        fileName: 'Relatorio_Final_Draft_v1.docx',
        fileData: '',
        fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        feedback: 'Aguardando avaliação final pelo orientador.',
        dataEntrega: '15/08/2026'
      }
    }
  },
  {
    id: 2,
    studentId: 'user_aluno_2',
    studentName: 'Beatriz Oliveira',
    studentEmail: 'beatriz.oliveira@lab.uf.br',
    studentAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    title: 'Dispositivo IoT de Baixo Custo para Monitoramento de Qualidade do Ar em Ambientes Laboratoriais',
    modalidade: 'PIBITI',
    cota: 'bolsista',
    agencia: 'FAPESP',
    lattesUrl: 'http://lattes.cnpq.br/9876543210987654',
    collaborators: 'Prof. Dr. Ricardo Mendonça',
    resumo: 'Desenvolvimento de um protótipo físico e firmware integrado para sensoriamento contínuo de gases e material particulado (PM2.5). O sistema envia dados via MQTT para um dashboard web em tempo real com alertas de segurança automáticos.',
    cronograma: [
      { id: 201, atividade: 'Modelagem do Circuito e Seleção de Sensores', mesInicio: 'Mês 1', mesFim: 'Mês 3', status: 'Concluído' },
      { id: 202, atividade: 'Montagem da Placa de PCB e Programação Firmware', mesInicio: 'Mês 4', mesFim: 'Mês 6', status: 'Concluído' },
      { id: 203, atividade: 'Integração do Dashboard Cloud e Testes de Estabilidade', mesInicio: 'Mês 7', mesFim: 'Mês 10', status: 'Em Andamento' },
      { id: 204, atividade: 'Redação da Patente / Registro de Software e Relatório Final', mesInicio: 'Mês 11', mesFim: 'Mês 12', status: 'Pendente' }
    ],
    relatorios: {
      parcial: {
        status: 'Aprovado',
        link: 'https://drive.google.com/file/d/sample-relatorio-parcial-beatriz/view',
        fileName: 'Relatorio_Parcial_Beatriz.pdf',
        fileData: '',
        fileType: 'application/pdf',
        feedback: 'Protótipo funcional demonstrado com sucesso na reunião de laboratório. Aprovado.',
        dataEntrega: '10/03/2026'
      },
      final: {
        status: 'Não Enviado',
        link: '',
        fileName: '',
        fileData: '',
        fileType: '',
        feedback: '',
        dataEntrega: ''
      }
    }
  }
];

class LabDB {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(DB_KEYS.USERS)) {
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem(DB_KEYS.PROJECTS)) {
      localStorage.setItem(DB_KEYS.PROJECTS, JSON.stringify(INITIAL_PROJECTS));
    }
  }

  getUsers() {
    return JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]');
  }

  saveUser(user) {
    const users = this.getUsers();
    users.push(user);
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
  }

  findUserByEmail(email) {
    const users = this.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  getSession() {
    const sessionStr = localStorage.getItem(DB_KEYS.SESSION);
    return sessionStr ? JSON.parse(sessionStr) : null;
  }

  setSession(user) {
    localStorage.setItem(DB_KEYS.SESSION, JSON.stringify(user));
  }

  clearSession() {
    localStorage.removeItem(DB_KEYS.SESSION);
  }

  // PROJETOS (Com auto-sincronização de todos os alunos cadastrados)
  getProjects() {
    const projects = JSON.parse(localStorage.getItem(DB_KEYS.PROJECTS) || '[]');
    const users = this.getUsers();

    let updated = false;

    // Garante que todo usuário com perfil 'aluno' tenha seu projeto no banco
    users.filter(u => u.role === 'aluno').forEach(student => {
      const hasProj = projects.some(p => p.studentId === student.id || (p.studentEmail && p.studentEmail.toLowerCase() === student.email.toLowerCase()));
      if (!hasProj) {
        const newProj = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          studentId: student.id,
          studentName: student.name,
          studentEmail: student.email,
          studentAvatar: student.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
          title: `Projeto de Pesquisa - ${student.name}`,
          modalidade: 'PIBIC',
          cota: 'bolsista',
          agencia: 'CNPq',
          lattesUrl: student.lattesUrl || 'http://lattes.cnpq.br/',
          collaborators: '',
          resumo: 'Resumo da pesquisa pendente de preenchimento pelo aluno.',
          cronograma: [
            { id: Date.now() + 1, atividade: 'Revisão Bibliográfica e Estado da Arte', mesInicio: 'Mês 1', mesFim: 'Mês 2', status: 'Pendente' }
          ],
          relatorios: {
            parcial: { status: 'Não Enviado', link: '', fileName: '', fileData: '', fileType: '', feedback: '', dataEntrega: '' },
            final: { status: 'Não Enviado', link: '', fileName: '', fileData: '', fileType: '', feedback: '', dataEntrega: '' }
          }
        };
        projects.push(newProj);
        updated = true;
      }
    });

    if (updated) {
      localStorage.setItem(DB_KEYS.PROJECTS, JSON.stringify(projects));
    }

    return projects;
  }

  saveProjects(projects) {
    localStorage.setItem(DB_KEYS.PROJECTS, JSON.stringify(projects));
  }

  getProjectByStudentId(studentId, studentEmail = null) {
    const projects = this.getProjects();
    return projects.find(p => p.studentId === studentId || (studentEmail && p.studentEmail && p.studentEmail.toLowerCase() === studentEmail.toLowerCase()));
  }

  saveOrUpdateProject(project) {
    const projects = this.getProjects();
    const index = projects.findIndex(p => p.id === project.id || p.studentId === project.studentId);
    if (index !== -1) {
      projects[index] = project;
    } else {
      projects.push(project);
    }
    this.saveProjects(projects);
  }
}

export const db = new LabDB();
