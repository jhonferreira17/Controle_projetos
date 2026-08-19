import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DB_PATH = path.join(__dirname, 'data', 'database.json');

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Helper de leitura/escrita do Banco de Dados
function readDB() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return { users: [], projects: [] };
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Erro ao salvar database.json:', err);
  }
}

// --------------------------------------------------
// ROTAS DA API DE AUTENTICAÇÃO E USUÁRIOS
// --------------------------------------------------

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());

  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
  }

  res.json({ user });
});

// Cadastro de Usuário
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role, lattesUrl } = req.body;
  const db = readDB();

  if (db.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase())) {
    return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
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
    lattesUrl: lattesUrl || 'http://lattes.cnpq.br/'
  };

  db.users.push(newUser);

  // Se for aluno, cria o projeto correspondente imediatamente
  if (role === 'aluno') {
    const newProject = {
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
    db.projects.push(newProject);
  }

  writeDB(db);
  res.json({ user: newUser });
});

// Remover Aluno
app.delete('/api/users/:email', (req, res) => {
  const email = req.params.email;
  const db = readDB();

  db.users = db.users.filter(u => u.email.toLowerCase() !== email.toLowerCase());
  db.projects = db.projects.filter(p => !p.studentEmail || p.studentEmail.toLowerCase() !== email.toLowerCase());

  writeDB(db);
  res.json({ success: true, message: 'Usuário e projeto removidos com sucesso.' });
});

// --------------------------------------------------
// ROTAS DA API DE PROJETOS E RELATÓRIOS
// --------------------------------------------------

// Obter Todos os Projetos (Garantindo sincronia de todos os alunos)
app.get('/api/projects', (req, res) => {
  const db = readDB();

  // Garante que todo aluno tenha um projeto vinculado
  let updated = false;
  db.users.filter(u => u.role === 'aluno').forEach(student => {
    const hasProj = db.projects.some(p => p.studentId === student.id || (p.studentEmail && p.studentEmail.toLowerCase() === student.email.toLowerCase()));
    if (!hasProj) {
      db.projects.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email,
        studentAvatar: student.avatar,
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

  if (updated) writeDB(db);

  res.json({ projects: db.projects });
});

// Criar / Atualizar Projeto
app.post('/api/projects', (req, res) => {
  const project = req.body;
  const db = readDB();

  const index = db.projects.findIndex(p => p.id === project.id || p.studentId === project.studentId);
  if (index !== -1) {
    db.projects[index] = project;
  } else {
    db.projects.push(project);
  }

  writeDB(db);
  res.json({ project });
});

app.listen(PORT, () => {
  console.log(`[LabProj Server] API rodando na porta ${PORT}`);
});
