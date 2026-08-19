/* ==========================================================================
   LABPROJ - CAMADA DE CONEXÃO DE BANCO DE DADOS & API (DB.JS)
   Conexão híbrida: API Backend (Node.js/Express e Vercel Serverless) + LocalStorage Fallback
   ========================================================================== */

const DB_KEYS = {
  USERS: 'labproj_users_v3',
  PROJECTS: 'labproj_projects_v3',
  SESSION: 'labproj_active_session'
};

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
    title: 'Dispositivo IoT de Bausto Custo para Monitoramento de Qualidade do Ar em Ambientes Laboratoriais',
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
    this.initLocal();
  }

  initLocal() {
    if (!localStorage.getItem(DB_KEYS.USERS)) {
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem(DB_KEYS.PROJECTS)) {
      localStorage.setItem(DB_KEYS.PROJECTS, JSON.stringify(INITIAL_PROJECTS));
    }
  }

  // AUTENTICAÇÃO API
  async login(email, password) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        return data.user;
      }
    } catch (err) {
      console.warn('API indisponível, usando fallback local para login.');
    }

    // Fallback Local
    const users = this.getUsersLocal();
    const user = users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
    if (!user || user.password !== password) {
      throw new Error('E-mail ou senha incorretos.');
    }
    return user;
  }

  async register(registerData) {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData)
      });
      if (res.ok) {
        const data = await res.json();
        return data.user;
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao cadastrar usuário.');
      }
    } catch (err) {
      console.warn('API offline, salvando registro no banco local.');
    }

    // Fallback Local
    const users = this.getUsersLocal();
    if (users.find(u => u.email.toLowerCase() === registerData.email.toLowerCase())) {
      throw new Error('Este e-mail já está cadastrado.');
    }

    const newUser = {
      id: `user_${Date.now()}`,
      name: registerData.name,
      email: registerData.email,
      password: registerData.password,
      role: registerData.role,
      avatar: registerData.role === 'admin' 
        ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
      lattesUrl: registerData.lattesUrl || 'http://lattes.cnpq.br/'
    };

    users.push(newUser);
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));

    if (newUser.role === 'aluno') {
      const newProj = {
        id: Date.now(),
        studentId: newUser.id,
        studentName: newUser.name,
        studentEmail: newUser.email,
        studentAvatar: newUser.avatar,
        title: `Projeto de Pesquisa - ${newUser.name}`,
        modalidade: 'PIBIC',
        cota: 'bolsista',
        agencia: 'CNPq',
        lattesUrl: newUser.lattesUrl,
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
      this.saveOrUpdateProjectLocal(newProj);
    }

    return newUser;
  }

  // BUSCA DE PROJETO E SINCRONIA
  async getProjects() {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        // Atualiza réplica local
        localStorage.setItem(DB_KEYS.PROJECTS, JSON.stringify(data.projects));
        return data.projects;
      }
    } catch (err) {
      console.warn('API indisponível, lendo projetos do banco local.');
    }

    return this.getProjectsLocal();
  }

  async saveOrUpdateProject(project) {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project)
      });
      if (res.ok) {
        const data = await res.json();
        this.saveOrUpdateProjectLocal(data.project);
        return data.project;
      }
    } catch (err) {
      console.warn('API offline, salvando alterações no banco local.');
    }

    this.saveOrUpdateProjectLocal(project);
    return project;
  }

  async removeUserByEmail(email) {
    try {
      await fetch(`/api/users/${encodeURIComponent(email)}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('API offline, removendo do banco local.');
    }

    let users = this.getUsersLocal();
    users = users.filter(u => u.email.toLowerCase() !== email.toLowerCase());
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));

    let projects = this.getProjectsLocal();
    projects = projects.filter(p => !p.studentEmail || p.studentEmail.toLowerCase() !== email.toLowerCase());
    localStorage.setItem(DB_KEYS.PROJECTS, JSON.stringify(projects));
  }

  // HELPERS LOCAIS DE RESERVA (FALLBACK)
  getUsersLocal() {
    return JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]');
  }

  getProjectsLocal() {
    const projects = JSON.parse(localStorage.getItem(DB_KEYS.PROJECTS) || '[]');
    const users = this.getUsersLocal();

    let updated = false;
    users.filter(u => u.role === 'aluno').forEach(student => {
      const hasProj = projects.some(p => p.studentId === student.id || (p.studentEmail && p.studentEmail.toLowerCase() === student.email.toLowerCase()));
      if (!hasProj) {
        projects.push({
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
        });
        updated = true;
      }
    });

    if (updated) {
      localStorage.setItem(DB_KEYS.PROJECTS, JSON.stringify(projects));
    }

    return projects;
  }

  saveOrUpdateProjectLocal(project) {
    const projects = this.getProjectsLocal();
    const index = projects.findIndex(p => p.id === project.id || p.studentId === project.studentId);
    if (index !== -1) {
      projects[index] = project;
    } else {
      projects.push(project);
    }
    localStorage.setItem(DB_KEYS.PROJECTS, JSON.stringify(projects));
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
}

export const db = new LabDB();
