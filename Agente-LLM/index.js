import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

app.post("/interpretar", async (req, res) => {
  try {
    const { analise } = req.body;

    if (!analise) {
      return res.status(400).json({ erro: "Nenhum dado recebido do gateway." });
    }

    const resposta = await gerarRespostaLLM(analise);

    res.json({
      mensagem: resposta,
      valores: analise,
      imagem: analise.imagem_resultado_base64
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Falha no agente LLM" });
  }
});

async function gerarRespostaLLM(analise) {
  const apiKey = process.env.OPENAI_API_KEY;

  const prompt = `
Você é um especialista agrícola.
O usuário enviou uma imagem, e o agente de imagem calculou:

${JSON.stringify(analise, null, 2)}

Explique o que significa, dê insights,
e se coloque à disposição para dúvidas.
  `;

  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Você é um assistente agrícola especializado." },
        { role: "user", content: prompt },
      ],
    },
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );

  return response.data.choices[0].message.content;
}

const port = process.env.PORT || 5002;
app.listen(port, () => {
    console.log(`🤖 Agente LLM rodando na porta ${port}`);
});
