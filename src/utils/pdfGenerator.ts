import { jsPDF } from 'jspdf';
import { Comanda, ConsignmentOrder } from '../types';

export function calculateComandaTotal(comanda: Comanda) {
  const subtotal = comanda.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  let total = subtotal;
  if (comanda.serviceCharge) {
    total += subtotal * 0.10;
  }
  if (comanda.discount) {
    total -= comanda.discount;
  }
  return Math.max(0, total);
}

export function generateEstablishmentPDF(comandas: Comanda[], paidComandas: Comanda[]) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const paidTotal = paidComandas.reduce((sum, c) => sum + calculateComandaTotal(c), 0);
  const openTotal = comandas.reduce((sum, c) => sum + calculateComandaTotal(c), 0);
  const totalBarActivity = paidTotal + openTotal;

  // Calculate best-selling products by quantity sold
  const productQuantitySold: { [key: string]: { name: string, qty: number, revenue: number, category: string } } = {};

  const tallyItems = (comandasArray: Comanda[]) => {
    comandasArray.forEach(c => {
      c.items.forEach(item => {
        if (!productQuantitySold[item.productId]) {
          productQuantitySold[item.productId] = {
            name: item.name,
            qty: 0,
            revenue: 0,
            category: item.category
          };
        }
        productQuantitySold[item.productId].qty += item.quantity;
        productQuantitySold[item.productId].revenue += item.price * item.quantity;
      });
    });
  };

  tallyItems(comandas);
  tallyItems(paidComandas);

  const bestSellers = Object.values(productQuantitySold)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const paymentMethodSums = { PIX: 0, Cartão: 0, Dinheiro: 0 };
  paidComandas.forEach(c => {
    if (c.paymentMethod && paymentMethodSums[c.paymentMethod] !== undefined) {
      paymentMethodSums[c.paymentMethod] += calculateComandaTotal(c);
    }
  });

  const totalPaidSum = paymentMethodSums.PIX + paymentMethodSums.Cartão + paymentMethodSums.Dinheiro || 1;

  // Draw luxury top banner matching brand guidelines
  doc.setFillColor(9, 9, 11); // Black body background (#09090b)
  doc.rect(0, 0, 210, 42, 'F');
  
  // Luxury Premium Gold ribbon separating banner
  doc.setFillColor(228, 188, 96); // #e4bc60 (Gold Brand Color)
  doc.rect(0, 42, 210, 3, 'F');

  // Header Branding Logotype
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("PITSTOP", 16, 18);

  doc.setFontSize(8);
  doc.setTextColor(228, 188, 96); // Gold label
  doc.setFont("helvetica", "bold");
  doc.text("SISTEMA INTELIGENTE DE COMANDAS & GESTÃO", 16, 24);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(161, 161, 170); // Zinc text
  doc.setFontSize(10);
  doc.text("RELATÓRIO DE DESEMPENHO FINANCEIRO CONSOLIDADO", 16, 32);

  const emissionDate = new Date().toLocaleString('pt-BR');
  doc.setFontSize(8);
  doc.text(`Gerado em: ${emissionDate}`, 145, 18);
  doc.text("Status: Caixa Consolidado", 145, 23);

  // Section 1: RESUMO FINANCEIRO
  doc.setTextColor(9, 9, 11);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("1. Resumo Geral de Faturamento", 16, 58);

  // Subtle container grey box
  doc.setDrawColor(228, 228, 231);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(16, 62, 178, 30, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(80, 80, 80);
  doc.text("FATURAMENTO TOTAL COMPROVADO (COMANDAS PAGAS):", 22, 70);
  doc.text("ATUAL EM ABERTO CIRCULANTE (COMANDAS ATIVAS):", 22, 78);
  doc.text("VOLUME TOTAL DE VENDAS REGISTRADAS (HOJE):", 22, 86);

  doc.setFontSize(10);
  doc.setTextColor(16, 124, 65); // Green faturado
  doc.text(`R$ ${paidTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 140, 70);
  
  doc.setTextColor(190, 60, 60); // Red em aberto
  doc.text(`R$ ${openTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 140, 78);
  
  doc.setTextColor(9, 9, 11); // Standard text
  doc.text(`R$ ${totalBarActivity.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 140, 86);

  // Section 2: FORMAS DE RECEBIMENTO
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("2. Distribuição por Método de Recebimento", 16, 106);

  doc.setFillColor(250, 250, 250);
  doc.roundedRect(16, 110, 178, 30, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("PIX BANCÁRIO DIRETÍSSIMO:", 22, 118);
  doc.text("CARTÕES DE CRÉDITO E DÉBITO:", 22, 126);
  doc.text("DINHEIRO EM ESPÉCIE ATENDIDO:", 22, 134);

  doc.setTextColor(9, 9, 11);
  const pixPercent = totalPaidSum > 0 ? (paymentMethodSums.PIX / totalPaidSum) * 100 : 0;
  const cardPercent = totalPaidSum > 0 ? (paymentMethodSums.Cartão / totalPaidSum) * 100 : 0;
  const cashPercent = totalPaidSum > 0 ? (paymentMethodSums.Dinheiro / totalPaidSum) * 100 : 0;

  doc.text(`R$ ${paymentMethodSums.PIX.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}   (${pixPercent.toFixed(1)}%)`, 140, 118);
  doc.text(`R$ ${paymentMethodSums.Cartão.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}   (${cardPercent.toFixed(1)}%)`, 140, 126);
  doc.text(`R$ ${paymentMethodSums.Dinheiro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}   (${cashPercent.toFixed(1)}%)`, 140, 134);

  // Section 3: PRODUTOS MAIS VENDIDOS
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("3. Top 5 Produtos Mais Consumidos", 16, 154);

  // Products table header
  doc.setFillColor(9, 9, 11);
  doc.roundedRect(16, 159, 178, 8, 1, 1, 'F');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text("POS", 20, 164.5);
  doc.text("PRODUTO", 32, 164.5);
  doc.text("CATEGORIA", 88, 164.5);
  doc.text("QUANTIDADE", 125, 164.5);
  doc.text("FATURADO BRUTO", 154, 164.5);

  let currentY = 173;
  if (bestSellers.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120, 120, 120);
    doc.text("Nenhuma venda registrada ainda no estabelecimento.", 22, currentY);
  } else {
    bestSellers.forEach((item, index) => {
      // Soft alternating row backgrounds
      if (index % 2 === 0) {
        doc.setFillColor(244, 244, 245);
        doc.rect(16, currentY - 5, 178, 7, 'F');
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(50, 50, 50);

      doc.text(`${index + 1}`, 21, currentY);
      doc.text(item.name.substring(0, 26), 32, currentY);
      doc.text(item.category.toUpperCase(), 88, currentY);
      doc.text(`${item.qty} un`, 125, currentY);
      doc.text(`R$ ${item.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 154, currentY);

      currentY += 7;
    });
  }

  // Section 4: INFO DO OPERADOR E AUDITORIA
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(9, 9, 11);
  doc.text("4. Log de Auditoria Física", 16, 218);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  doc.text(`Total de comandas abertas ativas: ${comandas.filter(c => c.status === 'open').length} comanda(s)`, 16, 224);
  doc.text(`Total de comandas devidamente liquidadas: ${paidComandas.length} comanda(s)`, 16, 229);

  // Corporate branding footer
  doc.setFillColor(228, 188, 96); // gold separator
  doc.rect(16, 260, 178, 0.8, 'F');

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(115, 115, 115);
  doc.text("PitStop Automação de Bares e Restaurantes - Relatório Financeiro Inteligente.", 16, 266);
  doc.text("Dados protegidos administrativamente e armazenados em nuvem via Firebase Firestore.", 16, 270);

  // Save PDF
  const safeDate = new Date().toISOString().substring(0, 10);
  doc.save(`pitstop-relatorio-${safeDate}.pdf`);
}

export function generateConsignmentNotePDF(order: ConsignmentOrder) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const itemsTotal = order.items.reduce((sum, item) => {
    const consumed = Math.max(0, item.quantityConsigned - item.quantityReturned);
    return sum + (consumed * item.price);
  }, 0);

  const pendingAssetsValue = order.assets.reduce((sum, asset) => {
    return sum + (asset.securityDepositValue * asset.quantity);
  }, 0);

  const deliveryFee = order.deliveryFee || 0;
  const serviceFee = order.serviceFee || 0;
  const otherFees = order.otherFees || 0;
  const grandTotal = itemsTotal + pendingAssetsValue + deliveryFee + serviceFee + otherFees;

  // Header Banner (matching our dark and gold aesthetic)
  doc.setFillColor(9, 9, 11); // Slate-950 block
  doc.rect(0, 0, 210, 42, 'F');

  // Separator gold bar
  doc.setFillColor(228, 188, 96); // Gold ribbon #e4bc60
  doc.rect(0, 42, 210, 3, 'F');

  // PitStop Logo Brand Text
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("PITSTOP COHAB", 16, 18);

  doc.setFontSize(8.5);
  doc.setTextColor(228, 188, 96); // Gold
  doc.text("DISTRIBUIDORA & CONVENIÊNCIA - EVENTOS EM CONSIGNAÇÃO", 16, 24);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(161, 161, 170); // Light gray
  doc.setFontSize(8.5);
  doc.text("CNPJ: 64.712.625/0001-69  |  Ligar/WhatsApp: (18) 99623-8015  |  Insta: @pitstop_cohab", 16, 31);
  doc.text("Endereço: Av. Ana Jacinta, n. 2039 - PITSTOP COHAB", 16, 36);

  // Status Indicator Badge (Top Right)
  const statusLabels = {
    consignado: "CONSIGNAÇÃO EM ABERTO",
    finalizado: "CONTA LIQUIDADA",
    cancelado: "ANULADO / CANCELADO"
  };
  const statusLabel = statusLabels[order.status] || order.status.toUpperCase();
  
  if (order.status === 'finalizado') {
    doc.setFillColor(16, 124, 65); // Green for paid
  } else if (order.status === 'cancelado') {
    doc.setFillColor(180, 50, 50); // Red
  } else {
    doc.setFillColor(190, 140, 40); // Amber/Gold for open
  }
  doc.roundedRect(142, 12, 52, 10, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text(statusLabel, 144.5, 18.5);

  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`GUIA DE EVENTO #${order.id.toUpperCase()}`, 142, 27);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(161, 161, 170);
  doc.text(`Data Emissão: ${order.createdAt}`, 142, 32);

  // Section 1: DADOS DO CLIENTE E DO EVENTO
  doc.setTextColor(9, 9, 11);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("1. Informações do Cliente e Local", 16, 54);

  doc.setDrawColor(228, 228, 231);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(16, 58, 178, 32, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);
  doc.text("CONTRATANTE:", 22, 65);
  doc.text("TELEFONE:", 22, 71);
  doc.text("CPF/CNPJ:", 22, 77);
  doc.text("LOCAL DE DESTINO (ENTREGA):", 22, 83);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(24, 24, 27);
  doc.text(order.customerName.toUpperCase(), 75, 65);
  doc.text(order.phone, 75, 71);
  doc.text(order.cpf || "NÃO CONSTA", 75, 77);
  doc.text(order.address || "RETIRADA EM LOJA / RETIRA NO PITSTOP", 75, 83);

  // Event timelines on right side of client card
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);
  doc.text("DATA DO EVENTO:", 135, 65);
  doc.text("DATA DE ENTREGA:", 135, 71);
  doc.text("DATA DE ACERTO:", 135, 77);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(24, 24, 27);
  doc.text(order.eventDate, 168, 65);
  doc.text(order.deliveryDate, 168, 71);
  doc.text(order.returnDate || order.updatedAt || "-", 168, 77);

  // Section 2: PRODUTOS CONSUMIDOS (TABELA)
  doc.setTextColor(9, 9, 11);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("2. Controle de Consumo de Bebidas", 16, 100);

  // Table header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(16, 104, 178, 7, 1, 1, 'F');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("PRODUTO / BEBIDA", 20, 109);
  doc.text("CEDIDA", 90, 109, { align: "center" });
  doc.text("DEVOLVIDA", 115, 109, { align: "center" });
  doc.text("CONSUMIDA", 140, 109, { align: "center" });
  doc.text("UNITÁRIO", 162, 109, { align: "center" });
  doc.text("SUBTOTAL", 184, 109, { align: "center" });

  let curY = 116;
  order.items.forEach((item, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(244, 244, 245); // Alternating light gray
      doc.rect(16, curY - 5, 178, 7.5, 'F');
    }
    
    // Calculate consumed
    const consumed = Math.max(0, item.quantityConsigned - item.quantityReturned);
    const sub = consumed * item.price;

    doc.setFont("helvetica", "bold");
    doc.setTextColor(24, 24, 27);
    doc.setFontSize(8.5);
    doc.text(item.name.substring(0, 36), 20, curY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(`${item.quantityConsigned} un`, 90, curY, { align: "center" });
    doc.text(`${item.quantityReturned} un`, 115, curY, { align: "center" });
    
    doc.setFont("helvetica", "bold");
    if (consumed > 0) {
      doc.setTextColor(190, 24, 24); // Reddish for consumption
      doc.text(`${consumed} un`, 140, curY, { align: "center" });
    } else {
      doc.setTextColor(80, 80, 80);
      doc.text("0 un", 140, curY, { align: "center" });
    }

    doc.setTextColor(80, 80, 80);
    doc.setFont("helvetica", "normal");
    doc.text(`R$ ${item.price.toFixed(2)}`, 162, curY, { align: "center" });
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(24, 24, 27);
    doc.text(`R$ ${sub.toFixed(2)}`, 184, curY, { align: "center" });

    curY += 7.5;
  });

  // Section 3: EQUIPAMENTOS / VASILHAMES EM COMODATO (only if assets or vasilhames exist)
  if (order.assets && order.assets.length > 0) {
    curY += 2;
    doc.setTextColor(9, 9, 11);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("3. Custo de Equipamentos do Patrimônio & Comodato", 16, curY);
    curY += 4;

    // Table Header
    doc.setFillColor(24, 24, 27); // slate-900
    doc.roundedRect(16, curY, 178, 7, 1, 1, 'F');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text("EQUIPAMENTO DESCRIÇÃO", 20, curY + 5);
    doc.text("CEDIDO", 100, curY + 5, { align: "center" });
    doc.text("RETORNADO?", 135, curY + 5, { align: "center" });
    doc.text("VALOR UNIT.", 160, curY + 5, { align: "center" });
    doc.text("VALOR COBRADO", 184, curY + 5, { align: "center" });

    curY += 12;
    order.assets.forEach((asset, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(244, 244, 245);
        doc.rect(16, curY - 5, 178, 7, 'F');
      }

      doc.setFont("helvetica", "bold");
      doc.setTextColor(24, 24, 27);
      doc.setFontSize(8);
      doc.text(asset.name.substring(0, 48), 20, curY);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text(`${asset.quantity} un`, 100, curY, { align: "center" });

      if (asset.returned) {
        doc.setTextColor(16, 124, 65); // Green OK
        doc.text("SIM (OK)", 135, curY, { align: "center" });
      } else {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(180, 40, 40); // Red alert for pending return
        doc.text("NÃO (PENDENTE)", 135, curY, { align: "center" });
      }

      // Always charge the asset value regardless of return status
      doc.setTextColor(24, 24, 27);
      doc.setFont("helvetica", "normal");
      doc.text(`R$ ${asset.securityDepositValue.toFixed(2)}`, 160, curY, { align: "center" });
      const mult = asset.securityDepositValue * asset.quantity;
      doc.setFont("helvetica", "bold");
      doc.text(`R$ ${mult.toFixed(2)}`, 184, curY, { align: "center" });

      curY += 7;
    });
  }

  // Section 4: OBSERVATIONS (if any)
  if (order.observation && order.observation.trim().length > 0) {
    curY += 3;
    doc.setTextColor(9, 9, 11);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Observações e Notas Especiais:", 16, curY);
    curY += 4;
    
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(order.observation.substring(0, 110), 18, curY);
    curY += 4;
  }

  // Section 5: VALORES TOTAIS (FINANCIAL SHEET)
  curY = Math.max(curY + 2, 212);
  doc.setDrawColor(200, 200, 200);
  doc.rect(16, curY, 178, 30, 'D');

  // Let's divide the box into PIX CNPJ instructions on left, and Totals on right
  doc.setFillColor(248, 250, 252);
  doc.rect(16, curY, 95, 30, 'F'); // Pix gray side

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42); // slate
  doc.text("INSTRUÇÕES PARA QUITAÇÃO PIX:", 20, curY + 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(190, 140, 40); // gold
  doc.text("64.712.625/0001-69", 20, curY + 12);
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text("Beneficiário: PitStop Distribuidora COHAB  |  Banco: Sicredi", 20, curY + 17);
  doc.text("Por favor, envie o comprovante de PIX para seu gerente.", 20, curY + 22);

  // Totals calculations on right side of total box
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("CONSUMO DE BEBIDAS:", 116, curY + 6);
  doc.text("CUSTO PATRIMÔNIOS:", 116, curY + 12);
  
  const additionalFees = deliveryFee + serviceFee + otherFees;
  doc.text("TAXAS / CORREIOS / FRETE:", 116, curY + 18);

  doc.text("TOTAL DO ACERTO:", 116, curY + 25);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(24, 24, 27);
  doc.text(`R$ ${itemsTotal.toFixed(2)}`, 188, curY + 6, { align: "right" });
  if (pendingAssetsValue > 0) {
    doc.setTextColor(180, 40, 40);
  }
  doc.text(`R$ ${pendingAssetsValue.toFixed(2)}`, 188, curY + 12, { align: "right" });
  doc.setTextColor(24, 24, 27);
  doc.text(`R$ ${additionalFees.toFixed(2)}`, 188, curY + 18, { align: "right" });

  doc.setFontSize(11);
  doc.setTextColor(16, 124, 65); // Green total
  doc.text(`R$ ${grandTotal.toFixed(2)}`, 188, curY + 26, { align: "right" });

  // Clause for terms
  curY += 36;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(120, 120, 120);
  doc.text("Termo comercial: Declaramos para fins legais que as quantidades conferidas e recipientes devolvidos foram devidamente certificados pelas", 16, curY);
  doc.text("partes no fechamento formal do lote. O contratante concorda com o balanço comercial, assumindo total responsabilidade pelas quitações pecuniárias.", 16, curY + 3);

  // Signatures
  curY += 16;
  doc.setLineWidth(0.3);
  doc.setDrawColor(180, 180, 180);
  
  doc.line(20, curY, 95, curY); // line 1
  doc.line(115, curY, 190, curY); // line 2

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text("RESPONSÁVEL PITSTOP COHAB", 57.5, curY + 4, { align: "center" });
  doc.text(order.customerName.toUpperCase(), 152.5, curY + 4, { align: "center" });

  // Custom watermark footer brand
  doc.setFillColor(228, 188, 96); // gold line separator
  doc.rect(16, 282, 178, 0.5, 'F');
  doc.setFont("helvetica", "italic");
  doc.setFontSize(6.5);
  doc.text("Impresso em nuvem através do Sistema ERP Integrado PitStop COHAB.", 16, 287);
  
  // Save PDF
  const safeName = order.customerName.toLowerCase().replace(/\s+/g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  doc.save(`pitstop-consignado-${order.id}-${safeName}.pdf`);
}

