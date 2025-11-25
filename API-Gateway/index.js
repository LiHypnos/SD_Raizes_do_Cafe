const express = require('express');
const axios = require('axios');
const multer = require('multer');
const cors = require('cors'); 
const app = express();

app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'OPTIONS'], 
    allowedHeaders: ['Content-Type', 'Authorization'] 
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
upload = multer({ limits: { fileSize: 20 * 1024 * 1024 } });

// ROTA 1: ANÁLISE
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

    const rawData = respostaImagem.data;
    const dadosImagem = rawData.analise || rawData;

    // ===== Remover base64 antes de mandar ao LLM =====
    const dadosParaLLM = { ...dadosImagem };
    delete dadosParaLLM.imagem_resultado_base64;
    delete dadosParaLLM.imagem_original_base64; 

    // ===== 2 - Envia resultado ao agente LLM =====
    const respostaLLM = await axios.post(
      "http://agente_llm:5002/interpretar",
      { analise: dadosParaLLM }
    );

    const resultadoFinal = respostaLLM.data;

    res.json({
      sucesso: true,
      comprimento: (dadosImagem.comprimento_cm || 0).toFixed(2) + " cm",
      area: (dadosImagem.area_raiz_cm2 || 0).toFixed(2) + " cm²",
      volume: (dadosImagem.volume_estimado_cm3 || 0).toFixed(2) + " cm³",
      mensagem: resultadoFinal.mensagem,
      dados_brutos: dadosParaLLM
    });

  } catch (err) {
    console.error("❌ Erro no Gateway:", err);
    res.status(500).json({ erro: "Falha completa no fluxo de análise" });
  }
});

// ROTA 2: CHAT
app.post("/chat", async (req, res) => {
    try {
        const { pergunta, contexto } = req.body;
        // Repassa para o LLM responder
        const resp = await axios.post("http://agente_llm:5002/chat", { pergunta, contexto });
        res.json(resp.data);
    } catch (err) {
        console.error("Erro chat:", err.message);
        res.status(500).json({ erro: "Erro no Chat" });
    }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`😎 API Gateway rodando na porta ${port}`);
});

