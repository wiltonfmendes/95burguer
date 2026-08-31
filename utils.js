// ============================================
// 95 BURGER — utilitários compartilhados
// ============================================

/**
 * Converte um link comum do Google Drive (o link de "Compartilhar")
 * em um link de imagem que pode ser usado direto numa tag <img>.
 * Aceita também links do Imgur, do Google Fotos publicado e URLs
 * "normais" de imagem (já retorna como está).
 */
function resolverLinkImagem(url) {
  if (!url) return "";
  url = url.trim();

  // Padrão: https://drive.google.com/file/d/ID_DO_ARQUIVO/view?usp=sharing
  const padraoDrive1 = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (padraoDrive1) {
    return `https://lh3.googleusercontent.com/d/${padraoDrive1[1]}`;
  }

  // Padrão: https://drive.google.com/open?id=ID_DO_ARQUIVO
  const padraoDrive2 = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
  if (padraoDrive2) {
    return `https://lh3.googleusercontent.com/d/${padraoDrive2[1]}`;
  }

  // Padrão: já é o link direto uc?id=
  const padraoDrive3 = url.match(/drive\.google\.com\/uc\?(?:export=view&)?id=([^&]+)/);
  if (padraoDrive3) {
    return `https://lh3.googleusercontent.com/d/${padraoDrive3[1]}`;
  }

  // Qualquer outra URL (Imgur, CDN próprio, etc.) — usa como veio.
  return url;
}

/** Formata número como moeda brasileira. */
function formatarMoeda(valor) {
  return (Number(valor) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** Gera um id simples (para itens de carrinho, extras, etc). */
function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Remove acentos e baixa a caixa — usado na busca. */
function normalizarTexto(texto) {
  return (texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Monta a mensagem do pedido formatada para o WhatsApp. */
function montarMensagemPedido({ itens, nomeCliente, telefoneCliente, endereco, observacaoGeral, totalProdutos, taxaEntrega, total, nomeLoja }) {
  let msg = `*Novo pedido — ${nomeLoja}*\n\n`;
  msg += `*Cliente:* ${nomeCliente}\n`;
  msg += `*Telefone:* ${telefoneCliente}\n`;
  msg += `*Endereço:* ${endereco}\n\n`;
  msg += `*Itens do pedido:*\n`;

  itens.forEach((item) => {
    msg += `\n▪ ${item.quantidade}x ${item.nome} — ${formatarMoeda(item.precoUnitario * item.quantidade)}`;
    if (item.extrasEscolhidos && item.extrasEscolhidos.length) {
      item.extrasEscolhidos.forEach((ex) => {
        msg += `\n   + ${ex.nome}${ex.preco ? ` (${formatarMoeda(ex.preco)})` : ""}`;
      });
    }
    if (item.observacao) {
      msg += `\n   obs: ${item.observacao}`;
    }
  });

  msg += `\n\n*Subtotal:* ${formatarMoeda(totalProdutos)}`;
  if (taxaEntrega) {
    msg += `\n*Taxa de entrega:* ${formatarMoeda(taxaEntrega)}`;
  }
  msg += `\n*Total:* ${formatarMoeda(total)}`;
  msg += `\n\n*Pagamento:* na entrega, com o motoboy (maquininha ou dinheiro)`;

  if (observacaoGeral) {
    msg += `\n\n*Observação geral:* ${observacaoGeral}`;
  }

  return msg;
}

/** Abre o WhatsApp com a mensagem já preenchida. */
function abrirWhatsApp(numeroWhatsApp, mensagem) {
  const numeroLimpo = (numeroWhatsApp || "").replace(/\D/g, "");
  const url = `https://wa.me/${numeroLimpo}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, "_blank");
}
