//ATENÇÃO:
//ESSE CÓDIGO TAMBÉM DEVE RODAR NO DOCKER, 
//ENTÃO A INTERAÇÃO COM O USUÁRIO DEVE SER FEITA VIA REQUISIÇÕES HTTP.

import express from "express";
import { execFile } from "child_process";
import multer from "multer";
import fs from "fs";

const app = express();
const upload = multer({ dest: "uploads/" });

// 📷 Endpoint para processar imagem
app.post("/processar", upload.single("imagem"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ erro: "Nenhuma imagem enviada." });
  }

  const imagemPath = req.file.path;

  // Executa o script Python que faz o cálculo
  execFile("python3", ["calcular.py", imagemPath], (error, stdout, stderr) => {
    if (error) {
      console.error("Erro no processamento:", stderr);
      fs.unlinkSync(imagemPath); // limpa o arquivo mesmo com erro
      return res.status(500).json({ erro: "Falha ao processar imagem" });
    }

    // O Python deve retornar um JSON como string
    const resultado = JSON.parse(stdout);

    // Apaga imagem temporária após o uso
    fs.unlinkSync(imagemPath);

    // Retorna o resultado final
    res.json(resultado);
  });
});


const port = process.env.PORT || 5001;
app.listen(port, () => {
    console.log(`📷 Agente de Imagem rodando na porta ${port}`);
});