// agente-imagem/index.js
const express = require("express");
const { execFile } = require("child_process");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const upload = multer({ dest: "uploads/" });

app.post("/processar", upload.single("imagem"), (req, res) => {
  if (!req.file) return res.status(400).json({ erro: "Nenhuma imagem enviada." });

  const imagemPath = req.file.path;

  execFile("python3", ["calcular.py", imagemPath], { cwd: __dirname }, (error, stdout, stderr) => {
    // limpa sempre a imagem temporária
    try { if (fs.existsSync(imagemPath)) fs.unlinkSync(imagemPath); } catch (e) {}

    if (error) {
      console.error("Erro no processamento (stderr):", stderr);
      return res.status(500).json({ erro: "Falha ao processar imagem", detalhe: stderr || error.message });
    }

    try {
      const resultado = JSON.parse(stdout);
      return res.json(resultado);
    } catch (e) {
      console.error("Erro ao parsear JSON do Python:", e, "stdout:", stdout);
      return res.status(500).json({ erro: "Resposta inválida do serviço de imagem", detalhe: e.message });
    }
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`📷 Agente de Imagem rodando na porta ${PORT}`);
});
