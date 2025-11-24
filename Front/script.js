const API_URL = "http://localhost:5000/analisar"

async function enviarImagem() {
    const input = document.getElementById('imagemInput');
    const resultadoDiv = document.getElementById('resultado');
    const btn = document.getElementById('btnEnviar');
    const textoIADiv = document.getElementById('resTextoIA');

    // 1. Validação
    if (input.files.length === 0) {
        alert("Por favor, selecione uma imagem!");
        return;
    }

    const arquivo = input.files[0];

    const formData = new FormData();
    formData.append('imagem', arquivo); 

    btn.innerText = "Processando...";
    btn.disabled = true;
    resultadoDiv.classList.add('hidden');
    textoIADiv.innerText = ""; 

    try {
        const resposta = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });

        if (!resposta.ok) {
            throw new Error(`Erro do Servidor: ${resposta.status}`);
        }

        const dados = await resposta.json();

        // Preenche com os dados retornados pelo backend
        document.getElementById('resComprimento').innerText = dados.valores?.comprimento || dados.comprimento || "-";
        document.getElementById('resArea').innerText = dados.valores?.area || dados.area || "-";
        document.getElementById('resVolume').innerText = dados.valores?.volume || dados.volume || "-";
        
        // texto interpretado do agente LLM
        textoIADiv.innerText = dados.mensagem || dados.analise_llm || "Análise concluída.";
        
        // Mostra o resultado
        resultadoDiv.classList.remove('hidden');

    } catch (erro) {
        console.error(erro);
        alert("Não foi possível conectar ao servidor. \nVerifique se o backend está rodando.");
        
    } finally {
        btn.innerText = "Analisar Raiz";
        btn.disabled = false;
    }
}

async function enviarPergunta() {
    const input = document.getElementById('chatInput');
    const history = document.getElementById('chat-history');
    const btn = document.getElementById('btnChat');
    const pergunta = input.value;

    if (!pergunta) return;

    // 1. Adiciona pergunta na tela
    history.innerHTML += `<p class="chat-msg usuario"><strong>Você:</strong> ${pergunta}</p>`;
    input.value = "";
    history.scrollTop = history.scrollHeight;
    btn.disabled = true;
    btn.innerText = "...";

    try {
        // 2. Envia para o Backend
        const resposta = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pergunta: pergunta,
                contexto: contextoAtual || {} // Manda os dados da raiz junto
            })
        });

        const dados = await resposta.json();

        // 3. Adiciona resposta na tela
        history.innerHTML += `<p class="chat-msg sistema"><strong>IA:</strong> ${dados.resposta}</p>`;

    } catch (erro) {
        history.innerHTML += `<p class="chat-msg erro">Erro ao conectar com o chat.</p>`;
    } finally {
        history.scrollTop = history.scrollHeight;
        btn.disabled = false;
        btn.innerText = "Enviar";
    }
}

const inputArquivo = document.getElementById('imagemInput');
const spanNomeArquivo = document.getElementById('nomeArquivo');

inputArquivo.addEventListener('change', function() {
    if (this.files && this.files.length > 0) {
        spanNomeArquivo.innerText = this.files[0].name;
        spanNomeArquivo.style.color = 'var(--cor-verde)';
        spanNomeArquivo.style.fontWeight = 'bold';
    } else {
        spanNomeArquivo.innerText = 'Nenhum arquivo selecionado';
        spanNomeArquivo.style.color = '#666';
        spanNomeArquivo.style.fontWeight = 'normal';
    }
});