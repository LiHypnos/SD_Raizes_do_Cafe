const express = require('express');
const axios = require('axios');
const multer = require('multer');

const upload = multer();
const app = express();

app.post("/analisar", upload.single("imagem"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ erro: "Nenhuma imagem enviada." });
    }

    const FormData = require("form-data");
    const formData = new FormData();
    formData.append("imagem", req.file.buffer, { filename: req.file.originalname });

    // ===== 1 - Envia imagem ao agente de imagem =====
    const respostaImagem = await axios.post(
      "http://agente_imagem:5001/processar",
      formData,
      { headers: formData.getHeaders() }
    );

    const dadosImagem = respostaImagem.data;

    // ===== 2 - Envia resultado ao agente LLM =====
    const respostaLLM = await axios.post(
      "http://agente_llm:5002/interpretar",
      { analise: dadosImagem }
    );

    const resultadoFinal = respostaLLM.data;

    // ===== 3 - Retorna tudo ao front =====
    res.json({
      sucesso: true,
      mensagem: resultadoFinal.mensagem,
      valores: dadosImagem,
      imagem: dadosImagem.imagem_resultado_base64
    });

  } catch (err) {
    console.error("❌ Erro no Gateway:", err);
    res.status(500).json({ erro: "Falha completa no fluxo de análise" });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`😎 API Gateway rodando na porta ${port}`);
});
