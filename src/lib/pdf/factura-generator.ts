"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface FacturaData {
  // Datos de la factura
  numero: string;
  fecha: string;
  fechaVencimiento?: string;

  // Datos del emisor (Cerecilla)
  emisor: {
    nombre: string;
    cif: string;
    direccion: string;
    poblacion: string;
    provincia: string;
    codigoPostal: string;
    telefono?: string;
    email?: string;
  };

  // Datos del cliente
  cliente: {
    nombre: string;
    nif?: string;
    direccion?: string;
    poblacion?: string;
    provincia?: string;
    codigoPostal?: string;
    email?: string;
    telefono?: string;
  };

  // Líneas de factura
  lineas: {
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    iva: number; // porcentaje (21, 10, 4, 0)
  }[];

  // Método de pago
  metodoPago?: string;
  cuentaBancaria?: string;

  // Notas
  notas?: string;
}

export interface FacturaResult {
  blob: Blob;
  filename: string;
}

// Logo en base64 - lo cargaremos dinámicamente
async function loadLogoBase64(): Promise<string | null> {
  try {
    const response = await fetch("/logos/logo-horizontal.png");
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateFacturaPDF(data: FacturaData): Promise<FacturaResult> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Colores corporativos Cerecilla (tuplas)
  const colorPrimario: [number, number, number] = [187, 41, 42]; // #BB292A
  const colorSecundario: [number, number, number] = [135, 206, 235]; // #87CEEB
  const colorTexto: [number, number, number] = [51, 51, 51]; // #333333
  const colorGris: [number, number, number] = [128, 128, 128];

  // Cargar logo
  const logoBase64 = await loadLogoBase64();

  // Header con logo
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", 15, 10, 50, 18);
    } catch {
      // Si falla el logo, escribimos el nombre
      doc.setFontSize(24);
      doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
      doc.setFont("helvetica", "bold");
      doc.text("CERECILLA", 15, 22);
    }
  } else {
    doc.setFontSize(24);
    doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.setFont("helvetica", "bold");
    doc.text("CERECILLA", 15, 22);
  }

  // Título FACTURA
  doc.setFontSize(28);
  doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
  doc.setFont("helvetica", "bold");
  doc.text("FACTURA", pageWidth - 15, 22, { align: "right" });

  // Número de factura
  doc.setFontSize(11);
  doc.setTextColor(colorGris[0], colorGris[1], colorGris[2]);
  doc.setFont("helvetica", "normal");
  doc.text(`Nº ${data.numero}`, pageWidth - 15, 30, { align: "right" });

  // Línea decorativa
  doc.setDrawColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
  doc.setLineWidth(1);
  doc.line(15, 35, pageWidth - 15, 35);

  // Datos del emisor
  let yPos = 45;
  doc.setFontSize(10);
  doc.setTextColor(colorTexto[0], colorTexto[1], colorTexto[2]);
  doc.setFont("helvetica", "bold");
  doc.text(data.emisor.nombre, 15, yPos);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  yPos += 5;
  doc.text(`CIF: ${data.emisor.cif}`, 15, yPos);
  yPos += 4;
  doc.text(data.emisor.direccion, 15, yPos);
  yPos += 4;
  doc.text(`${data.emisor.codigoPostal} ${data.emisor.poblacion} (${data.emisor.provincia})`, 15, yPos);
  if (data.emisor.telefono) {
    yPos += 4;
    doc.text(`Tel: ${data.emisor.telefono}`, 15, yPos);
  }
  if (data.emisor.email) {
    yPos += 4;
    doc.text(data.emisor.email, 15, yPos);
  }

  // Datos del cliente (caja a la derecha)
  const clienteBoxX = pageWidth - 85;
  const clienteBoxY = 42;
  const clienteBoxWidth = 70;

  // Fondo de la caja cliente
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(clienteBoxX, clienteBoxY, clienteBoxWidth, 38, 3, 3, "F");

  // Borde izquierdo decorativo
  doc.setFillColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
  doc.rect(clienteBoxX, clienteBoxY, 3, 38, "F");

  // Texto del cliente
  let clienteY = clienteBoxY + 8;
  doc.setFontSize(8);
  doc.setTextColor(colorGris[0], colorGris[1], colorGris[2]);
  doc.setFont("helvetica", "bold");
  doc.text("FACTURAR A:", clienteBoxX + 6, clienteY);

  clienteY += 6;
  doc.setFontSize(10);
  doc.setTextColor(colorTexto[0], colorTexto[1], colorTexto[2]);
  doc.setFont("helvetica", "bold");
  doc.text(data.cliente.nombre, clienteBoxX + 6, clienteY, { maxWidth: clienteBoxWidth - 10 });

  clienteY += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  if (data.cliente.nif) {
    doc.text(`NIF: ${data.cliente.nif}`, clienteBoxX + 6, clienteY);
    clienteY += 4;
  }
  if (data.cliente.direccion) {
    doc.text(data.cliente.direccion, clienteBoxX + 6, clienteY, { maxWidth: clienteBoxWidth - 10 });
    clienteY += 4;
  }
  if (data.cliente.poblacion) {
    const ubicacion = [data.cliente.codigoPostal, data.cliente.poblacion].filter(Boolean).join(" ");
    doc.text(ubicacion, clienteBoxX + 6, clienteY, { maxWidth: clienteBoxWidth - 10 });
  }

  // Fechas
  const fechaBoxY = 85;

  // Caja de fecha emisión (fondo azul claro, texto oscuro)
  doc.setFillColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
  doc.roundedRect(15, fechaBoxY, 55, 16, 2, 2, "F");
  doc.setTextColor(0, 51, 102); // Azul marino oscuro
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("FECHA EMISIÓN", 18, fechaBoxY + 6);
  doc.setFontSize(11);
  doc.text(data.fecha, 18, fechaBoxY + 12);

  // Caja de fecha vencimiento (fondo azul claro, texto oscuro)
  if (data.fechaVencimiento) {
    doc.setFillColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
    doc.roundedRect(75, fechaBoxY, 55, 16, 2, 2, "F");
    doc.setTextColor(0, 51, 102); // Azul marino oscuro
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("FECHA VENCIMIENTO", 78, fechaBoxY + 6);
    doc.setFontSize(11);
    doc.text(data.fechaVencimiento, 78, fechaBoxY + 12);
  }

  // Tabla de productos/servicios
  const tableStartY = 110;

  // Calcular subtotales por tipo de IVA
  const lineasConTotales = data.lineas.map((linea) => ({
    ...linea,
    subtotal: linea.cantidad * linea.precioUnitario,
    ivaImporte: (linea.cantidad * linea.precioUnitario * linea.iva) / 100,
    total: linea.cantidad * linea.precioUnitario * (1 + linea.iva / 100),
  }));

  const tableData = lineasConTotales.map((linea) => [
    linea.descripcion,
    linea.cantidad.toString(),
    `${linea.precioUnitario.toFixed(2)} €`,
    `${linea.iva}%`,
    `${linea.subtotal.toFixed(2)} €`,
  ]);

  autoTable(doc, {
    startY: tableStartY,
    head: [["Descripción", "Cant.", "Precio Unit.", "IVA", "Importe"]],
    body: tableData,
    theme: "plain",
    styles: {
      fontSize: 9,
      cellPadding: 4,
      textColor: colorTexto,
    },
    headStyles: {
      fillColor: colorPrimario,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 30, halign: "right" },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 30, halign: "right" },
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable?.finalY || tableStartY + 50;

  // Calcular totales
  const baseImponible = lineasConTotales.reduce((sum, l) => sum + l.subtotal, 0);
  const totalFactura = lineasConTotales.reduce((sum, l) => sum + l.total, 0);

  // Desglose de IVA por tipo
  const ivaDesglose: Record<number, { base: number; iva: number }> = {};
  for (const linea of lineasConTotales) {
    if (!ivaDesglose[linea.iva]) {
      ivaDesglose[linea.iva] = { base: 0, iva: 0 };
    }
    ivaDesglose[linea.iva].base += linea.subtotal;
    ivaDesglose[linea.iva].iva += linea.ivaImporte;
  }

  // Caja de totales
  const totalesX = pageWidth - 80;
  let totalesY = finalY + 10;
  const totalesWidth = 65;

  // Base imponible
  doc.setFontSize(9);
  doc.setTextColor(colorGris[0], colorGris[1], colorGris[2]);
  doc.text("Base imponible:", totalesX, totalesY);
  doc.setTextColor(colorTexto[0], colorTexto[1], colorTexto[2]);
  doc.text(`${baseImponible.toFixed(2)} €`, pageWidth - 15, totalesY, { align: "right" });

  // Desglose IVA
  for (const [porcentaje, valores] of Object.entries(ivaDesglose)) {
    totalesY += 6;
    doc.setTextColor(colorGris[0], colorGris[1], colorGris[2]);
    doc.text(`IVA ${porcentaje}%:`, totalesX, totalesY);
    doc.setTextColor(colorTexto[0], colorTexto[1], colorTexto[2]);
    doc.text(`${valores.iva.toFixed(2)} €`, pageWidth - 15, totalesY, { align: "right" });
  }

  // Línea separadora
  totalesY += 5;
  doc.setDrawColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
  doc.setLineWidth(0.5);
  doc.line(totalesX, totalesY, pageWidth - 15, totalesY);

  // Total
  totalesY += 8;
  doc.setFillColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
  doc.roundedRect(totalesX - 5, totalesY - 6, totalesWidth + 5, 12, 2, 2, "F");

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("TOTAL:", totalesX, totalesY + 2);
  doc.text(`${totalFactura.toFixed(2)} €`, pageWidth - 18, totalesY + 2, { align: "right" });

  // Método de pago
  if (data.metodoPago || data.cuentaBancaria) {
    const pagoY = totalesY + 25;
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(15, pagoY, pageWidth - 30, 20, 2, 2, "F");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colorTexto[0], colorTexto[1], colorTexto[2]);
    doc.text("FORMA DE PAGO", 20, pagoY + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    if (data.metodoPago) {
      doc.text(data.metodoPago, 20, pagoY + 14);
    }
    if (data.cuentaBancaria) {
      doc.text(`IBAN: ${data.cuentaBancaria}`, 80, pagoY + 14);
    }
  }

  // Notas al pie
  if (data.notas) {
    const notasY = doc.internal.pageSize.getHeight() - 35;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(colorGris[0], colorGris[1], colorGris[2]);
    doc.text(data.notas, 15, notasY, { maxWidth: pageWidth - 30 });
  }

  // Pie de página
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colorGris[0], colorGris[1], colorGris[2]);
  doc.text(
    `${data.emisor.nombre} · CIF: ${data.emisor.cif} · ${data.emisor.direccion}, ${data.emisor.poblacion}`,
    pageWidth / 2,
    footerY,
    { align: "center" }
  );

  // Generar blob
  const blob = doc.output("blob");
  const filename = `Factura_${data.numero.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

  return { blob, filename };
}

// Función helper para descargar el PDF
export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Función helper para abrir el PDF en nueva pestaña
export function openPDF(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}
