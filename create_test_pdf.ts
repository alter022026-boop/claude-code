#!/usr/bin/env bun
import * as fs from 'fs';
import * as path from 'path';
import pdf from 'html-pdf';

const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Currículo João Silva</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; }
        h2 { color: #666; margin-top: 20px; }
        ul { margin: 10px 0; }
        li { margin: 5px 0; }
    </style>
</head>
<body>
    <h1>Currículo de João Silva</h1>

    <h2>Informações Pessoais</h2>
    <p><strong>Nome:</strong> João Silva</p>
    <p><strong>Localização:</strong> São Paulo, SP</p>
    <p><strong>Email:</strong> joao.silva@email.com</p>

    <h2>Habilidades Técnicas</h2>
    <ul>
        <li>JavaScript</li>
        <li>TypeScript</li>
        <li>React</li>
        <li>Node.js</li>
        <li>Python</li>
        <li>SQL</li>
        <li>Git</li>
        <li>HTML/CSS</li>
        <li>Express.js</li>
        <li>MongoDB</li>
    </ul>

    <h2>Experiência Profissional</h2>
    <h3>Desenvolvedor Full Stack (2020-2023)</h3>
    <p>Empresa: Tech Solutions Ltda</p>
    <p>Trabalhei com desenvolvimento web usando React e Node.js. Desenvolvi aplicações completas do frontend ao backend, implementei APIs REST, integrei com bancos de dados e colaborei em equipes ágeis.</p>

    <h3>Estagiário de Desenvolvimento (2019-2020)</h3>
    <p>Empresa: Startup Inovadora</p>
    <p>Participei do desenvolvimento de aplicações web, aprendendo tecnologias modernas e melhores práticas de desenvolvimento.</p>

    <h2>Educação</h2>
    <h3>Bacharel em Ciência da Computação (2016-2020)</h3>
    <p>Universidade Federal de São Paulo</p>
    <p>Formação completa em Ciência da Computação com foco em desenvolvimento de software, algoritmos e estruturas de dados.</p>
</body>
</html>
`;

const options = {
    format: 'A4',
    border: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
    }
};

pdf.create(html, options).toFile('./curriculo_teste.pdf', (err, res) => {
    if (err) {
        console.error('Erro ao criar PDF:', err);
    } else {
        console.log('PDF criado com sucesso:', res.filename);
    }
});