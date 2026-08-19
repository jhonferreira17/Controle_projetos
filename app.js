/* ==========================================================================
   LABPROJ - LÓGICA COMPLETA DA APLICAÇÃO (SPA)
   Autenticação, Upload PDF/Word, Banco de Dados e Orientador Admin
   ========================================================================== */

import { db } from './db.js';

// Application State
let currentUser = null;
let currentProject = null;
let allProjects = [];
let activeSelectedAdminProjectId = null;
let tempSelectedFile = null;

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  checkSession();
});

/* ==========================================================================
   AUTENTICAÇÃO & SESSÃO DE USUÁRIO
   ========================================================================== */

function checkSession() {
  const session = db.getSession();
  const authOverlay = document.getElementById('auth-overlay');

  if (session) {
    currentUser = session;
    authOverlay.classList.add('hidden');
    loadUserDataAndProjects();
  } else {
    currentUser = null;
    authOverlay.classList.remove('hidden');
  }
}

window.switchAuthTab = function(tab) {
  const btnLogin = document.getElementById('tab-login');
  const btnReg = document.getElementById('tab-register');
  const formLogin = document.getElementById('form-login');
  const formReg = document.getElementById('form-register');

  if (tab === 'login') {
    btnLogin.classList.add('active');
    btnReg.classList.remove('active');
    formLogin.classList.add('active');
    formReg.classList.remove('active');
  } else {
    btnReg.classList.add('active');
    btnLogin.classList.remove('active');
    formReg.classList.add('active');
    formLogin.classList.remove('active');
  }
};

window.fillDemoLogin = function(email) {
  document.getElementById('login-email').value = email;
  document.getElementById('login-password').value = '123';
};

window.handleLogin = function(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  const user = db.findUserByEmail(email);

  if (!user || user.password !== password) {
    alert('E-mail ou senha incorretos. Utilize os botões de demonstração se preferir.');
    return;
  }

  db.setSession(user);
  checkSession();
};

window.handleRegister = function(e) {
  e.preventDefault();
  const role = document.getElementById('reg-role').value;
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const lattesUrl = document.getElementById('reg-lattes').value.trim() || 'http://lattes.cnpq.br/';

  if (db.findUserByEmail(email)) {
    alert('Este e-mail já está cadastrado no sistema.');
    return;
  }

  const newUser = {
    id: `user_${Date.now()}`,
    name,
    email,
    password,
    role,
    avatar: role === 'admin' 
      ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150' 
      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    lattesUrl
  };

  db.saveUser(newUser);

  // Se for aluno, cria um projeto inicial para ele
  if (role === 'aluno') {
    const newProj = {
      id: Date.now(),
      studentId: newUser.id,
      studentName: newUser.name,
      studentEmail: newUser.email,
      studentAvatar: newUser.avatar,
      title: `Projeto de Iniciação Científica - ${newUser.name}`,
      modalidade: 'PIBIC',
      cota: 'bolsista',
      agencia: 'CNPq',
      lattesUrl: newUser.lattesUrl,
      collaborators: '',
      resumo: 'Preencha o resumo da sua proposta de pesquisa clicando em "Editar Dados do Projeto".',
      cronograma: [
        { id: Date.now() + 1, atividade: 'Revisão Bibliográfica', mesInicio: 'Mês 1', mesFim: 'Mês 2', status: 'Pendente' }
      ],
      relatorios: {
        parcial: { status: 'Não Enviado', link: '', fileName: '', fileData: '', fileType: '', feedback: '', dataEntrega: '' },
        final: { status: 'Não Enviado', link: '', fileName: '', fileData: '', fileType: '', feedback: '', dataEntrega: '' }
      }
    };
    db.saveOrUpdateProject(newProj);
  }

  db.setSession(newUser);
  checkSession();
  alert('Conta criada com sucesso! Seja bem-vindo ao LabProj.');
};

window.handleLogout = function() {
  if (confirm('Deseja realmente sair da sua conta?')) {
    db.clearSession();
    checkSession();
  }
};

window.toggleRegFields = function() {
  const role = document.getElementById('reg-role').value;
  const groupLattes = document.getElementById('reg-group-lattes');
  groupLattes.style.display = role === 'aluno' ? 'flex' : 'none';
};

/* ==========================================================================
   CARREGAMENTO DE DADOS & NAVEGAÇÃO
   ========================================================================== */

function loadUserDataAndProjects() {
  allProjects = db.getProjects();

  // Header User Info
  document.getElementById('user-name').textContent = currentUser.name;
  document.getElementById('user-role-badge').textContent = currentUser.role === 'admin' ? 'Orientador (Admin)' : 'Aluno Pesquisador';
  document.getElementById('user-avatar').src = currentUser.avatar;

  // Mostra/Oculta controle de visão conforme o tipo de conta
  const roleSwitcherWrapper = document.getElementById('role-switcher-wrapper');

  if (currentUser.role === 'admin') {
    roleSwitcherWrapper.style.display = 'flex';
    switchRole('admin');
  } else {
    roleSwitcherWrapper.style.display = 'none';
    currentProject = db.getProjectByStudentId(currentUser.id) || allProjects[0];
    switchRole('aluno');
  }
}

window.switchRole = function(role) {
  const btnAluno = document.getElementById('btn-role-aluno');
  const btnAdmin = document.getElementById('btn-role-admin');
  const viewAluno = document.getElementById('view-aluno');
  const viewAdmin = document.getElementById('view-admin');

  if (role === 'aluno') {
    if (btnAluno) btnAluno.classList.add('active');
    if (btnAdmin) btnAdmin.classList.remove('active');
    viewAluno.classList.add('active');
    viewAdmin.classList.remove('active');

    // Se for admin vendo a visão do aluno, pega o projeto do primeiro aluno
    if (currentUser.role === 'admin') {
      currentProject = allProjects[0];
    } else {
      currentProject = db.getProjectByStudentId(currentUser.id) || allProjects[0];
    }

    renderAlunoView();
  } else {
    if (btnAdmin) btnAdmin.classList.add('active');
    if (btnAluno) btnAluno.classList.remove('active');
    viewAdmin.classList.add('active');
    viewAluno.classList.remove('active');

    renderAdminView();
  }
};

/* ==========================================================================
   VISÃO DO ALUNO & GESTÃO DE PROJETO
   ========================================================================== */

function renderAlunoView() {
  if (!currentProject) return;

  document.getElementById('aluno-proj-titulo').textContent = currentProject.title;
  document.getElementById('aluno-badge-modalidade').textContent = currentProject.modalidade;
  
  const cotaBadge = currentProject.cota === 'bolsista'
    ? `<span class="badge badge-bolsista">Bolsista (${currentProject.agencia || 'CNPq'})</span>`
    : `<span class="badge badge-voluntario">Voluntário</span>`;
  document.getElementById('aluno-proj-cota').innerHTML = cotaBadge;

  const lattesLink = document.getElementById('aluno-proj-lattes');
  lattesLink.href = currentProject.lattesUrl || '#';

  document.getElementById('aluno-proj-colaboradores').textContent = 
    currentProject.collaborators && currentProject.collaborators.trim() !== '' 
      ? currentProject.collaborators 
      : 'Nenhum colaborador registrado.';

  document.getElementById('aluno-proj-resumo').textContent = currentProject.resumo;

  // Render Relatórios
  renderAlunoReportBox('parcial');
  renderAlunoReportBox('final');

  // Render Cronograma
  renderAlunoCronograma();
}

function renderAlunoReportBox(type) {
  const rep = currentProject.relatorios[type];

  const statusEl = document.getElementById(`aluno-status-${type}`);
  const feedbackContainer = document.getElementById(`feedback-${type}-container`);
  const feedbackText = document.getElementById(`aluno-feedback-${type}`);
  const linkBtn = document.getElementById(`aluno-link-${type}`);
  const filePill = document.getElementById(`aluno-file-pill-${type}`);

  statusEl.textContent = rep.status;
  statusEl.className = getStatusBadgeClass(rep.status);

  if (rep.feedback) {
    feedbackContainer.style.display = 'block';
    feedbackText.textContent = rep.feedback;
  } else {
    feedbackContainer.style.display = 'none';
  }

  // Link Externo
  if (rep.link) {
    linkBtn.style.display = 'inline-flex';
    linkBtn.href = rep.link;
  } else {
    linkBtn.style.display = 'none';
  }

  // Arquivo Físico Anexado (PDF ou Word)
  if (rep.fileName || rep.fileData) {
    filePill.style.display = 'flex';
    document.getElementById(`aluno-file-name-${type}`).textContent = rep.fileName || 'Relatorio_Anexado';

    const iconEl = document.getElementById(`aluno-file-icon-${type}`);
    if (rep.fileName && rep.fileName.toLowerCase().endsWith('.doc') || rep.fileName.toLowerCase().endsWith('.docx')) {
      iconEl.className = 'fa-solid fa-file-word file-icon';
    } else {
      iconEl.className = 'fa-solid fa-file-pdf file-icon';
    }
  } else {
    filePill.style.display = 'none';
  }
}

function renderAlunoCronograma() {
  const tbody = document.getElementById('tbody-cronograma-aluno');
  tbody.innerHTML = '';

  const cronograma = currentProject.cronograma || [];
  if (cronograma.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">Nenhuma etapa cadastrada no cronograma.</td></tr>`;
    updateProgressUI(0);
    return;
  }

  let completedCount = 0;
  cronograma.forEach(step => {
    if (step.status === 'Concluído') completedCount++;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${step.atividade}</strong></td>
      <td><i class="fa-regular fa-calendar-check"></i> ${step.mesInicio} até ${step.mesFim}</td>
      <td><span class="${getStepBadgeClass(step.status)}">${step.status}</span></td>
      <td>
        <button class="btn btn-xs btn-outline" onclick="openEditStepModal(${step.id})"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-xs btn-outline" style="color:var(--accent-rose)" onclick="deleteStep(${step.id})"><i class="fa-solid fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  const percent = Math.round((completedCount / cronograma.length) * 100);
  updateProgressUI(percent);
}

function updateProgressUI(percent) {
  document.getElementById('aluno-progress-percent').textContent = `${percent}% Concluído`;
  document.getElementById('aluno-progress-fill').style.width = `${percent}%`;
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'Aprovado': return 'badge badge-status';
    case 'Em Análise':
    case 'Pendente': return 'badge badge-status-pending';
    case 'Ajustes Solicitados': return 'badge badge-danger';
    default: return 'badge badge-outline';
  }
}

function getStepBadgeClass(status) {
  if (status === 'Concluído') return 'badge badge-success';
  if (status === 'Em Andamento') return 'badge badge-warning';
  return 'badge badge-outline';
}

/* ==========================================================================
   SUBMISSÃO DE RELATÓRIOS (PDF & WORD & LINK)
   ========================================================================== */

window.openSubmitReportModal = function(type) {
  document.getElementById('report-type-hidden').value = type;
  document.getElementById('modal-submit-report-title').innerHTML = `<i class="fa-solid fa-file-upload"></i> Submeter Relatório ${type === 'parcial' ? 'Parcial' : 'Final'}`;

  tempSelectedFile = null;
  document.getElementById('file-selected-preview').style.display = 'none';
  document.getElementById('report-file-input').value = '';
  document.getElementById('report-link').value = currentProject.relatorios[type].link || '';
  document.getElementById('report-observacoes').value = '';

  openModal('modal-submit-report');
};

window.toggleUploadMethod = function() {
  const method = document.querySelector('input[name="uploadMethod"]:checked').value;
  const groupFile = document.getElementById('group-upload-file');
  const groupLink = document.getElementById('group-upload-link');

  if (method === 'file') {
    groupFile.style.display = 'block';
    groupLink.style.display = 'none';
  } else {
    groupFile.style.display = 'none';
    groupLink.style.display = 'block';
  }
};

window.handleFileSelect = function(e) {
  const file = e.target.files[0];
  if (!file) return;

  tempSelectedFile = file;

  const preview = document.getElementById('file-selected-preview');
  const previewName = document.getElementById('preview-file-name');
  const previewIcon = document.getElementById('preview-file-icon');

  previewName.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
  
  if (file.name.toLowerCase().endsWith('.doc') || file.name.toLowerCase().endsWith('.docx')) {
    previewIcon.className = 'fa-solid fa-file-word file-icon';
  } else {
    previewIcon.className = 'fa-solid fa-file-pdf file-icon';
  }

  preview.style.display = 'flex';
};

window.removeSelectedFile = function() {
  tempSelectedFile = null;
  document.getElementById('report-file-input').value = '';
  document.getElementById('file-selected-preview').style.display = 'none';
};

window.saveReportSubmission = function(e) {
  e.preventDefault();
  const type = document.getElementById('report-type-hidden').value;
  const method = document.querySelector('input[name="uploadMethod"]:checked').value;
  const obs = document.getElementById('report-observacoes').value;

  const rep = currentProject.relatorios[type];
  rep.status = 'Em Análise';
  rep.dataEntrega = new Date().toLocaleDateString('pt-BR');
  if (obs) rep.feedback = `Nota do Aluno: ${obs}`;

  if (method === 'link') {
    rep.link = document.getElementById('report-link').value;
    finishReportSave(type);
  } else {
    if (!tempSelectedFile && !rep.fileData) {
      alert('Por favor, selecione um arquivo no formato PDF ou Word (.doc, .docx).');
      return;
    }

    if (tempSelectedFile) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        rep.fileName = tempSelectedFile.name;
        rep.fileType = tempSelectedFile.type;
        rep.fileData = evt.target.result; // Base64 Data URL
        finishReportSave(type);
      };
      reader.readAsDataURL(tempSelectedFile);
    } else {
      finishReportSave(type);
    }
  }
};

function finishReportSave(type) {
  db.saveOrUpdateProject(currentProject);
  allProjects = db.getProjects();
  renderAlunoView();
  closeModal('modal-submit-report');
  alert(`Relatório ${type === 'parcial' ? 'Parcial' : 'Final'} submetido com sucesso!`);
}

window.downloadOrViewFile = function(type, projectId = null) {
  const proj = projectId ? allProjects.find(p => p.id === projectId) : currentProject;
  if (!proj) return;

  const rep = proj.relatorios[type];
  if (rep.fileData) {
    const link = document.createElement('a');
    link.href = rep.fileData;
    link.download = rep.fileName || `Relatorio_${type}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else if (rep.link) {
    window.open(rep.link, '_blank');
  } else {
    alert('Nenhum arquivo físico ou link foi anexado para este relatório.');
  }
};

/* ==========================================================================
   EDITAR PROJETO & CRONOGRAMA
   ========================================================================== */

window.openEditProjectModal = function() {
  document.getElementById('form-titulo').value = currentProject.title;
  document.getElementById('form-modalidade').value = currentProject.modalidade;
  document.getElementById('form-cota-tipo').value = currentProject.cota;
  document.getElementById('form-agencia').value = currentProject.agencia || '';
  document.getElementById('form-lattes').value = currentProject.lattesUrl || '';
  document.getElementById('form-colaboradores').value = currentProject.collaborators || '';
  document.getElementById('form-resumo').value = currentProject.resumo || '';

  toggleFormAgencia();
  openModal('modal-edit-project');
};

window.toggleFormAgencia = function() {
  const cotaVal = document.getElementById('form-cota-tipo').value;
  document.getElementById('group-agencia').style.display = cotaVal === 'bolsista' ? 'flex' : 'none';
};

window.saveProjectForm = function(e) {
  e.preventDefault();
  currentProject.title = document.getElementById('form-titulo').value;
  currentProject.modalidade = document.getElementById('form-modalidade').value;
  currentProject.cota = document.getElementById('form-cota-tipo').value;
  currentProject.agencia = currentProject.cota === 'bolsista' ? document.getElementById('form-agencia').value : 'Nenhum (Voluntário)';
  currentProject.lattesUrl = document.getElementById('form-lattes').value;
  currentProject.collaborators = document.getElementById('form-colaboradores').value;
  currentProject.resumo = document.getElementById('form-resumo').value;

  db.saveOrUpdateProject(currentProject);
  renderAlunoView();
  closeModal('modal-edit-project');
};

window.openAddStepModal = function() {
  document.getElementById('step-id-hidden').value = '';
  document.getElementById('step-nome').value = '';
  document.getElementById('step-mes-inicio').value = 'Mês 1';
  document.getElementById('step-mes-fim').value = 'Mês 2';
  document.getElementById('step-status').value = 'Pendente';
  openModal('modal-cronograma-step');
};

window.openEditStepModal = function(stepId) {
  const step = currentProject.cronograma.find(s => s.id === stepId);
  if (!step) return;

  document.getElementById('step-id-hidden').value = step.id;
  document.getElementById('step-nome').value = step.atividade;
  document.getElementById('step-mes-inicio').value = step.mesInicio;
  document.getElementById('step-mes-fim').value = step.mesFim;
  document.getElementById('step-status').value = step.status;

  openModal('modal-cronograma-step');
};

window.saveCronogramaStep = function(e) {
  e.preventDefault();
  const stepId = document.getElementById('step-id-hidden').value;
  const atividade = document.getElementById('step-nome').value;
  const mesInicio = document.getElementById('step-mes-inicio').value;
  const mesFim = document.getElementById('step-mes-fim').value;
  const status = document.getElementById('step-status').value;

  if (stepId) {
    const step = currentProject.cronograma.find(s => s.id == stepId);
    if (step) {
      step.atividade = atividade;
      step.mesInicio = mesInicio;
      step.mesFim = mesFim;
      step.status = status;
    }
  } else {
    currentProject.cronograma.push({ id: Date.now(), atividade, mesInicio, mesFim, status });
  }

  db.saveOrUpdateProject(currentProject);
  renderAlunoView();
  closeModal('modal-cronograma-step');
};

window.deleteStep = function(stepId) {
  if (!confirm('Deseja remover esta etapa do cronograma?')) return;
  currentProject.cronograma = currentProject.cronograma.filter(s => s.id !== stepId);
  db.saveOrUpdateProject(currentProject);
  renderAlunoView();
};

/* ==========================================================================
   VISÃO DO ORIENTADOR (ADMIN)
   ========================================================================== */

function renderAdminView() {
  allProjects = db.getProjects();
  updateAdminStats();
  filterAdminProjects();
}

function updateAdminStats() {
  const total = allProjects.length;
  const bolsistas = allProjects.filter(p => p.cota === 'bolsista').length;
  const voluntarios = total - bolsistas;
  const pibic = allProjects.filter(p => p.modalidade === 'PIBIC').length;
  const pibiti = allProjects.filter(p => p.modalidade === 'PIBITI').length;

  let pendentes = 0;
  allProjects.forEach(p => {
    if (p.relatorios.parcial.status === 'Em Análise') pendentes++;
    if (p.relatorios.final.status === 'Em Análise') pendentes++;
  });

  document.getElementById('stat-total-projetos').textContent = total;
  document.getElementById('stat-total-bolsistas').textContent = `${bolsistas} / ${voluntarios}`;
  document.getElementById('stat-total-modalidades').textContent = `${pibic} PIBIC / ${pibiti} PIBITI`;
  document.getElementById('stat-relatorios-pendentes').textContent = pendentes;
}

window.filterAdminProjects = function() {
  const searchText = document.getElementById('search-input').value.toLowerCase();
  const modalidadeFilter = document.getElementById('filter-modalidade').value;
  const cotaFilter = document.getElementById('filter-cota').value;
  const relatorioFilter = document.getElementById('filter-relatorio').value;

  const filtered = allProjects.filter(p => {
    const matchesSearch = p.studentName.toLowerCase().includes(searchText) || 
                          p.title.toLowerCase().includes(searchText);

    const matchesModalidade = modalidadeFilter === 'todos' || p.modalidade === modalidadeFilter;
    const matchesCota = cotaFilter === 'todos' || p.cota === cotaFilter;

    let matchesRelatorio = true;
    if (relatorioFilter === 'pendente') {
      matchesRelatorio = p.relatorios.parcial.status === 'Em Análise' || p.relatorios.final.status === 'Em Análise';
    } else if (relatorioFilter === 'aprovado') {
      matchesRelatorio = p.relatorios.parcial.status === 'Aprovado' && p.relatorios.final.status === 'Aprovado';
    }

    return matchesSearch && matchesModalidade && matchesCota && matchesRelatorio;
  });

  renderAdminProjectsGrid(filtered);
};

function renderAdminProjectsGrid(projects) {
  const container = document.getElementById('admin-projects-container');
  container.innerHTML = '';

  if (projects.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem;" class="glass-card">
        <i class="fa-solid fa-folder-open" style="font-size:2.5rem; color:var(--text-muted); margin-bottom:1rem;"></i>
        <p style="color:var(--text-secondary)">Nenhum projeto encontrado com os filtros aplicados.</p>
      </div>
    `;
    return;
  }

  projects.forEach(p => {
    const completed = p.cronograma.filter(s => s.status === 'Concluído').length;
    const progressPercent = p.cronograma.length > 0 ? Math.round((completed / p.cronograma.length) * 100) : 0;

    const card = document.createElement('div');
    card.className = 'glass-card admin-project-card';
    card.innerHTML = `
      <div class="admin-card-header">
        <div class="student-info-row">
          <img src="${p.studentAvatar}" alt="${p.studentName}" class="student-avatar">
          <div>
            <h4 class="student-name-h4">${p.studentName}</h4>
            <span class="student-sub">${p.studentEmail}</span>
          </div>
        </div>
      </div>

      <div class="admin-card-body">
        <div style="margin-bottom: 0.5rem; display:flex; gap:6px;">
          <span class="badge badge-modalidade">${p.modalidade}</span>
          <span class="${p.cota === 'bolsista' ? 'badge badge-bolsista' : 'badge badge-voluntario'}">
            ${p.cota === 'bolsista' ? `Bolsista (${p.agencia})` : 'Voluntário'}
          </span>
        </div>
        <h5>${p.title}</h5>
        <p class="admin-card-resumo">${p.resumo}</p>

        <div class="admin-card-progress">
          <div class="flex-between" style="font-size:0.78rem; color:var(--text-muted);">
            <span>Progresso do Cronograma</span>
            <strong style="color:var(--text-primary)">${progressPercent}%</strong>
          </div>
          <div class="mini-progress-track">
            <div class="mini-progress-fill" style="width: ${progressPercent}%"></div>
          </div>
        </div>

        <div class="reports-badges-row">
          <span class="${getStatusBadgeClass(p.relatorios.parcial.status)}">Parcial: ${p.relatorios.parcial.status}</span>
          <span class="${getStatusBadgeClass(p.relatorios.final.status)}">Final: ${p.relatorios.final.status}</span>
        </div>
      </div>

      <div class="admin-card-footer">
        <button class="btn btn-primary btn-sm" style="width:100%; justify-content:center;" onclick="openAdminProjectDetailModal(${p.id})">
          <i class="fa-solid fa-clipboard-check"></i> Ver Detalhes e Avaliar
        </button>
      </div>
    `;

    container.appendChild(card);
  });
}

window.openAdminProjectDetailModal = function(projectId) {
  activeSelectedAdminProjectId = projectId;
  const p = allProjects.find(proj => proj.id === projectId);
  if (!p) return;

  document.getElementById('admin-modal-student-name').textContent = `Projeto de ${p.studentName}`;
  document.getElementById('admin-modal-project-title').textContent = p.title;
  document.getElementById('admin-modal-modalidade').textContent = p.modalidade;
  
  const cotaBadge = document.getElementById('admin-modal-cota');
  cotaBadge.textContent = p.cota === 'bolsista' ? `Bolsista (${p.agencia})` : 'Voluntário';
  cotaBadge.className = p.cota === 'bolsista' ? 'badge badge-bolsista' : 'badge badge-voluntario';

  document.getElementById('admin-modal-lattes-btn').href = p.lattesUrl || '#';
  document.getElementById('admin-modal-resumo').textContent = p.resumo;
  document.getElementById('admin-modal-colaboradores').textContent = p.collaborators || 'Nenhum colaborador registrado.';

  // Cronograma Table
  const completed = p.cronograma.filter(s => s.status === 'Concluído').length;
  const progressPercent = p.cronograma.length > 0 ? Math.round((completed / p.cronograma.length) * 100) : 0;
  document.getElementById('admin-modal-progress-badge').textContent = `Progresso: ${progressPercent}%`;

  const tbody = document.getElementById('admin-modal-tbody-cronograma');
  tbody.innerHTML = '';
  p.cronograma.forEach(step => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${step.atividade}</strong></td>
      <td>${step.mesInicio} - ${step.mesFim}</td>
      <td><span class="${getStepBadgeClass(step.status)}">${step.status}</span></td>
    `;
    tbody.appendChild(tr);
  });

  // Relatório Parcial Admin File / Link
  renderAdminReportEvalCard('parcial', p);
  renderAdminReportEvalCard('final', p);

  openModal('modal-admin-project-detail');
};

function renderAdminReportEvalCard(type, proj) {
  const rep = proj.relatorios[type];
  const statusEl = document.getElementById(`admin-eval-status-${type}`);
  statusEl.textContent = rep.status;
  statusEl.className = getStatusBadgeClass(rep.status);

  const container = document.getElementById(`admin-eval-doc-${type}-container`);
  container.innerHTML = '';

  if (rep.fileName || rep.fileData) {
    const icon = rep.fileName.toLowerCase().endsWith('.doc') || rep.fileName.toLowerCase().endsWith('.docx') 
      ? 'fa-file-word' 
      : 'fa-file-pdf';
    
    container.innerHTML = `
      <div class="attached-file-pill">
        <i class="fa-solid ${icon} file-icon"></i>
        <span class="file-name">${rep.fileName}</span>
        <button class="btn btn-xs btn-primary" onclick="downloadOrViewFile('${type}', ${proj.id})">
          <i class="fa-solid fa-download"></i> Baixar Arquivo
        </button>
      </div>
    `;
  } else if (rep.link) {
    container.innerHTML = `
      <a href="${rep.link}" target="_blank" class="btn btn-sm btn-outline"><i class="fa-solid fa-external-link"></i> Abrir Link Externo</a>
    `;
  } else {
    container.innerHTML = `<span style="font-size:0.8rem; color:var(--text-muted);">Nenhum documento ou link enviado ainda.</span>`;
  }

  document.getElementById(`admin-parecer-${type}`).value = rep.feedback || '';
}

window.evaluateReport = function(type, newStatus) {
  if (!activeSelectedAdminProjectId) return;
  const p = allProjects.find(proj => proj.id === activeSelectedAdminProjectId);
  if (!p) return;

  const feedbackText = type === 'parcial' 
    ? document.getElementById('admin-parecer-parcial').value 
    : document.getElementById('admin-parecer-final').value;

  p.relatorios[type].status = newStatus;
  p.relatorios[type].feedback = feedbackText;

  db.saveOrUpdateProject(p);
  allProjects = db.getProjects();
  
  openAdminProjectDetailModal(activeSelectedAdminProjectId);
  renderAdminView();

  alert(`Relatório ${type === 'parcial' ? 'Parcial' : 'Final'} alterado para "${newStatus}"!`);
};

/* ==========================================================================
   MODAL UTILITIES
   ========================================================================== */

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

window.closeModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
};

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('active');
    }
  });
});
