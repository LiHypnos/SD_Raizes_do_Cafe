import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

// Endpoint que recebe dados do gateway (imagem + resultados numéricos)
app.post("/analisar", async (req, res) => {
  try {
    const { valores, imagemURL } = req.body;

    // Aqui o agente LLM interpreta o resultado com base no retorno do Python
    // modelos disponiveis: OpenAI, Ollama, HuggingFace etc. 
    // VAMOS PENSAR EM USAR LLAMA PARA NÃO FICAR PESADO
    const resposta = await gerarRespostaLLM(valores, imagemURL);

    res.json({
      respostaLLM: resposta,
      imagem: imagemURL,
      valores,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Falha no agente LLM" });
  }
});

async function gerarRespostaLLM(valores, imagemURL) {
  // Exemplo com OpenAI
  const apiKey = process.env.OPENAI_API_KEY;
  const prompt = `
  Você é um especialista em análise de imagens agrícolas.
  O usuário enviou uma imagem e os valores retornados foram:
  ${JSON.stringify(valores, null, 2)}

  Explique o que esses valores significam e dê um parecer.
  `;

  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Você é um assistente técnico." },
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