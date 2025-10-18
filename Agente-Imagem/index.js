//ATENÇÃO:
//ESSE CÓDIGO TAMBÉM DEVE RODAR NO DOCKER, 
//ENTÃO A INTERAÇÃO COM O USUÁRIO DEVE SER FEITA VIA REQUISIÇÕES HTTP.

import express from "express";
import { execFile } from "child_process";
import multer from "multer";
import path from "path";
import fs from "fs";

const app = express();
const upload = multer({ dest: "uploads/" });

app.post("/processar", upload.single("imagem"), (req, res) => {
  const imagemPath = req.file.path;

  // Executa o script Python que faz o cálculo
  execFile("python3", ["calcular.py", imagemPath], (error, stdout, stderr) => {
    if (error) {
      console.error("Erro no processamento:", stderr);
      return res.status(500).json({ erro: "Falha ao processar imagem" });
    }

    // O Python deve retornar um JSON como string
    const resultado = JSON.parse(stdout);

    // Apaga imagem temporária após o uso
    fs.unlinkSync(imagemPath);

    res.json(resultado);
  });
});

const port = process.env.port || 5001;
app.listen(port, () => {
    console.log(`📷 Agente de Imagem rodando na porta ${PORT}`);
});