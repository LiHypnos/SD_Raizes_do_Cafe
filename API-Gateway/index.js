const express = require('express');
const axios = require('axios');
const multer = require('multer');

const upload = multer();
const app = express();

app.post("/analisar", upload.single("imagem"), async (req, res) => {
  try {
    // ---- 1. Envia a imagem pro agente de imagem (Python) ----
    const formData = new FormData();
    formData.append("file", req.file.buffer, req.file.originalname);

    const respostaImagem = await axios.post(
      "http://agente_imagem:5001/processar",
      formData,
      { headers: formData.getHeaders() }
    );

    const dadosImagem = respostaImagem.data;
    console.log("📸 Resultado do agente de imagem:", dadosImagem);

    // ---- 2. Envia o resultado pro agente LLM ----
    const respostaLLM = await axios.post("http://agente_llm:5002/interpretar", {
      analise: dadosImagem,
    });

    const resultadoFinal = respostaLLM.data;
    console.log("🧠 Resposta do agente LLM:", resultadoFinal);

    // ---- 3. Retorna pro front-end ----
    res.json({
      sucesso: true,
      mensagem: resultadoFinal.mensagem,
      imagem: dadosImagem.imagem_resultado,
      valores: dadosImagem,
    });
  } catch (err) {
    console.error("❌ Erro no Gateway:", err.message);
    res.status(500).json({ erro: "Falha na análise da imagem" });
  }
});


const port = process.env.port || 5000;
app.listen(port, () => {
    console.log(`😎 API Gateway rodando na porta ${PORT}`);
});