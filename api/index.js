// Vercel Serverless Function Handler
import fs from 'fs';
import path from 'path';

let inMemoryDb = null;

function getDbPath() {
  return path.join(process.cwd(), 'data', 'database.json');
}

function readDB() {
  if (inMemoryDb) return inMemoryDb;
  try {
    const data = fs.readFileSync(getDbPath(), 'utf8');
    inMemoryDb = JSON.parse(data);
    return inMemoryDb;
  } catch (err) {
    return { users: [], projects: [] };
  }
}

function writeDB(data) {
  inMemoryDb = data;
  try {
    fs.writeFileSync(getDbPath(), JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    // Vercel serverless environment is read-only file system for root, so we maintain inMemoryDb
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url || '';
  const db = readDB();

  // LOGIN
  if (url.includes('/api/auth/login') && req.method === 'POST') {
    const { email, password } = req.body || {};
    const user = db.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }
    return res.json({ user });
  }

  // REGISTER
  if (url.includes('/api/auth/register') && req.method === 'POST') {
    const { name, email, password, role, lattesUrl } = req.body || {};
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
    return res.json({ user: newUser });
  }

  // GET PROJECTS
  if (url.includes('/api/projects') && req.method === 'GET') {
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

    return res.json({ projects: db.projects });
  }

  // SAVE/UPDATE PROJECT
  if (url.includes('/api/projects') && req.method === 'POST') {
    const project = req.body;
    const index = db.projects.findIndex(p => p.id === project.id || p.studentId === project.studentId);
    if (index !== -1) {
      db.projects[index] = project;
    } else {
      db.projects.push(project);
    }
    writeDB(db);
    return res.json({ project });
  }

  // DELETE USER
  if (url.includes('/api/users/') && req.method === 'DELETE') {
    const email = url.split('/api/users/')[1] || '';
    db.users = db.users.filter(u => u.email.toLowerCase() !== decodeURIComponent(email).toLowerCase());
    db.projects = db.projects.filter(p => !p.studentEmail || p.studentEmail.toLowerCase() !== decodeURIComponent(email).toLowerCase());
    writeDB(db);
    return res.json({ success: true });
  }

  res.status(444).json({ error: 'Endpoint API não encontrado.' });
}
