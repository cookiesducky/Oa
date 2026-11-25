/* ==========================================================================
   OÁ Odontologia Afetiva: interações da página
   ========================================================================== */

(() => {
  "use strict";

  const WHATSAPP_NUMERO = "5551991922299";

  /* ----------------------------------------------------------------------
     Cabeçalho: sombra ao rolar e menu no celular
     ---------------------------------------------------------------------- */
  function iniciarCabecalho() {
    const cabecalho = document.getElementById("cabecalho");
    const botao = document.getElementById("botao-menu");
    const menu = document.getElementById("menu");
    if (!cabecalho || !botao || !menu) return;

    const atualizarSombra = () => {
      cabecalho.classList.toggle("is-rolado", window.scrollY > 8);
    };

    const alternarMenu = (abrir) => {
      botao.setAttribute("aria-expanded", String(abrir));
      menu.classList.toggle("is-aberto", abrir);
    };

    window.addEventListener("scroll", atualizarSombra, { passive: true });
    atualizarSombra();

    botao.addEventListener("click", () => {
      alternarMenu(botao.getAttribute("aria-expanded") !== "true");
    });

    menu.addEventListener("click", (evento) => {
      if (evento.target.closest("a")) alternarMenu(false);
    });

    document.addEventListener("keydown", (evento) => {
      if (evento.key === "Escape") alternarMenu(false);
    });
  }

  /* ----------------------------------------------------------------------
     Abas de tratamentos (navegação por setas, Home e End)
     ---------------------------------------------------------------------- */
  function iniciarAbas() {
    const lista = document.querySelector(".abas__lista");
    if (!lista) return;

    const abas = Array.from(lista.querySelectorAll('[role="tab"]'));

    const selecionar = (aba, moverFoco = false) => {
      abas.forEach((item) => {
        const ativa = item === aba;
        item.setAttribute("aria-selected", String(ativa));
        item.tabIndex = ativa ? 0 : -1;
        document.getElementById(item.getAttribute("aria-controls")).hidden = !ativa;
      });
      if (moverFoco) aba.focus();
    };

    abas.forEach((aba) => {
      aba.addEventListener("click", () => selecionar(aba));
    });

    lista.addEventListener("keydown", (evento) => {
      const indice = abas.indexOf(document.activeElement);
      if (indice === -1) return;

      const total = abas.length;
      const destinos = {
        ArrowDown: (indice + 1) % total,
        ArrowRight: (indice + 1) % total,
        ArrowUp: (indice - 1 + total) % total,
        ArrowLeft: (indice - 1 + total) % total,
        Home: 0,
        End: total - 1,
      };

      if (evento.key in destinos) {
        evento.preventDefault();
        selecionar(abas[destinos[evento.key]], true);
      }
    });
  }

  /* ----------------------------------------------------------------------
     Galeria: ampliar foto
     ---------------------------------------------------------------------- */
  function iniciarGaleria() {
    const caixa = document.getElementById("lightbox");
    const imagem = document.getElementById("lightbox-imagem");
    const legenda = document.getElementById("lightbox-legenda");
    if (!caixa || !imagem || !legenda) return;

    document.querySelectorAll("[data-ampliar]").forEach((item) => {
      item.addEventListener("click", () => {
        imagem.src = item.dataset.ampliar;
        imagem.alt = item.querySelector("img")?.alt ?? "";
        legenda.textContent = item.dataset.legenda ?? "";
        caixa.showModal();
      });
    });

    // Clique fora da foto fecha a janela
    caixa.addEventListener("click", (evento) => {
      if (evento.target === caixa) caixa.close();
    });
  }

  /* ----------------------------------------------------------------------
     Formulário de agendamento
     ---------------------------------------------------------------------- */
  function montarLinkWhatsapp({ nome, assunto, mensagem }) {
    const linhas = [
      "Olá! Gostaria de agendar uma consulta na OÁ Odontologia.",
      nome ? `Meu nome é ${nome}.` : "",
      assunto ? `Estou procurando: ${assunto}.` : "",
      mensagem ? mensagem : "",
    ].filter(Boolean);

    return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(linhas.join("\n"))}`;
  }

  function validar(dados) {
    const erros = {};

    if (dados.nome.trim().length < 2) {
      erros.nome = "Informe seu nome.";
    }

    const digitos = dados.telefone.replace(/\D/g, "");
    if (digitos.length < 10 || digitos.length > 13) {
      erros.telefone = "Informe um telefone com DDD, por exemplo (51) 90000-0000.";
    }

    if (!dados.assunto) {
      erros.assunto = "Escolha o que você procura.";
    }

    return erros;
  }

  function mostrarErros(formulario, erros) {
    formulario.querySelectorAll(".campo").forEach((campo) => {
      const nome = campo.querySelector("input, select, textarea")?.name;
      const mensagem = erros[nome] ?? "";
      const saida = campo.querySelector(".campo__erro");

      campo.classList.toggle("tem-erro", Boolean(mensagem));
      if (saida) saida.textContent = mensagem;
    });
  }

  function iniciarFormulario() {
    const formulario = document.getElementById("formulario");
    const status = document.getElementById("status-formulario");
    if (!formulario || !status) return;

    const botao = formulario.querySelector('button[type="submit"]');

    const definirStatus = (html, erro = false) => {
      status.innerHTML = html;
      status.classList.toggle("is-erro", erro);
    };

    formulario.addEventListener("submit", async (evento) => {
      evento.preventDefault();
      definirStatus("");

      const dados = Object.fromEntries(new FormData(formulario));
      const erros = validar(dados);
      mostrarErros(formulario, erros);

      const primeiroErro = Object.keys(erros)[0];
      if (primeiroErro) {
        formulario.elements[primeiroErro].focus();
        return;
      }

      botao.disabled = true;
      botao.textContent = "Enviando...";

      const linkWhatsapp = montarLinkWhatsapp(dados);

      try {
        const resposta = await fetch(formulario.action, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dados),
        });

        if (!resposta.ok) throw new Error(`Erro ${resposta.status}`);

        formulario.reset();
        definirStatus(
          `Recebemos o seu pedido. Para agilizar, <a href="${linkWhatsapp}" target="_blank" rel="noopener">continue a conversa pelo WhatsApp</a>.`
        );
      } catch (erro) {
        definirStatus(
          `Não foi possível enviar agora. <a href="${linkWhatsapp}" target="_blank" rel="noopener">Fale com a gente pelo WhatsApp</a>.`,
          true
        );
      } finally {
        botao.disabled = false;
        botao.textContent = "Enviar pedido de consulta";
      }
    });
  }

  /* ----------------------------------------------------------------------
     Ano do rodapé
     ---------------------------------------------------------------------- */
  function iniciarAno() {
    const ano = document.getElementById("ano");
    if (ano) ano.textContent = new Date().getFullYear();
  }

  iniciarCabecalho();
  iniciarAbas();
  iniciarGaleria();
  iniciarFormulario();
  iniciarAno();
})();
