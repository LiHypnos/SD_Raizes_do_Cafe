const express = require('express');
const axios = require('axios');
const multer = require('multer');
const cors = require('cors');
const FormData = require('form-data');

const app = express();

// === CORS ===
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// === LIMITES DE TAMANHO ===
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// === MULTER EM MEMÓRIA + FILTRO DE MIMETYPE (MITIGAÇÃO #1) ===
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
    fileFilter: (req, file, cb) => {
        // Aceitamos apenas imagens PNG e JPEG
        if (file.mimetype !== "image/png" && file.mimetype !== "image/jpeg") {
            return cb(new Error("Tipo de arquivo inválido. Envie apenas PNG ou JPEG."));
        }
        cb(null, true);
    }
});

// =========================================================
// ROTA 1 — /analisar (processa imagens)
// =========================================================
app.post("/analisar", upload.single("imagem"), async (req, res) => {
    try {
        // === VALIDAÇÃO DO ARQUIVO ===
        if (!req.file) {
            return res.status(400).json({ erro: "Nenhuma imagem enviada." });
        }

        // === PREPARA FORM DATA PARA O AGENTE DE IMAGEM ===
        const formData = new FormData();
        formData.append("imagem", req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        // === 1) CHAMA O AGENTE DE IMAGEM ===
        const respostaImagem = await axios.post(
            "http://agente_imagem:5001/processar",
            formData,
            { headers: formData.getHeaders() }
        );

        const rawData = respostaImagem.data;
        const dadosImagem = rawData.analise || rawData;

        // === REMOVER BASE64 PARA PROTEGER PRIVACIDADE ===
        const dadosParaLLM = { ...dadosImagem };
        delete dadosParaLLM.imagem_resultado_base64;
        delete dadosParaLLM.imagem_original_base64;

        // === 2) CHAMAR O LLM ===
        const respostaLLM = await axios.post(
            "http://agente_llm:5002/interpretar",
            { analise: dadosParaLLM }
        );

        const resultadoFinal = respostaLLM.data;

        // === 3) RETORNO PRO FRONT ===
        res.json({
            sucesso: true,
            comprimento: (dadosImagem.comprimento_cm || 0).toFixed(2) + " cm",
            area: (dadosImagem.area_raiz_cm2 || 0).toFixed(2) + " cm²",
            volume: (dadosImagem.volume_estimado_cm3 || 0).toFixed(2) + " cm³",
            mensagem: resultadoFinal.mensagem,
            dados_brutos: dadosParaLLM
        });

        // === MITIGAÇÃO DE SEGURANÇA ===
        // Limpa buffer do arquivo para evitar retenção em memória
        req.file.buffer = null;

    } catch (err) {
        console.error("❌ Erro no Gateway:", err);

        // Caso multer detecte arquivo inválido
        if (err.message.includes("Tipo de arquivo inválido")) {
            return res.status(400).json({ erro: err.message });
        }

        res.status(500).json({ erro: "Falha completa no fluxo de análise" });
    }
});

// =========================================================
// ROTA 2 — CHAT
// =========================================================
app.post("/chat", async (req, res) => {
    try {
        const { pergunta, contexto } = req.body;

        const resp = await axios.post(
            "http://agente_llm:5002/chat",
            { pergunta, contexto }
        );

        res.json(resp.data);

    } catch (err) {
        console.error("Erro chat:", err.message);
        res.status(500).json({ erro: "Erro no Chat" });
    }
});

// =========================================================
// INÍCIO DO SERVIDOR
// =========================================================
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`😎 API Gateway rodando na porta ${port}`);
});
