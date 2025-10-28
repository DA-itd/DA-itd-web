import { ITD_LOGO_URL, TECNM_LOGO_URL } from '../constants';
import { getFlexibleProperty, formatDate } from '../utils/helpers';
import { CertificateRecord } from '../types';

declare const window: any;

const getImageDataFromURL = (url: string): Promise<{ dataURL: string; width: number; height: number; }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/jpeg');
        resolve({ dataURL, width: img.width, height: img.height });
      } else {
        reject(new Error('Could not get canvas context.'));
      }
    };
    img.onerror = (err) => reject(err);
    img.src = url;
  });
};

const getPdfDisplayValue = (key: string, value: any): string => {
  if (value === null || value === undefined) return 'N/A';
  let valueStr = String(value).trim();
  if (key === 'Fecha') return formatDate(value);
  if (key === 'Duración') {
     const upperValue = valueStr.toUpperCase();
     if (upperValue.includes('HORAS')) return upperValue;
     if (!isNaN(parseFloat(valueStr)) && valueStr !== '') return `${valueStr} HORAS`;
     return upperValue;
  }
  return valueStr.toUpperCase();
};

export const generatePdf = async (result: CertificateRecord) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    try {
        // Cargar ambos logos en paralelo para mayor eficiencia
        const [itdLogo, tecNmLogo] = await Promise.all([
            getImageDataFromURL(ITD_LOGO_URL),
            getImageDataFromURL(TECNM_LOGO_URL)
        ]);

        // Logo del ITD a la izquierda
        const itdAspectRatio = itdLogo.width / itdLogo.height;
        const itdPdfImageHeight = 25; // Aumentado de 20 a 25
        const itdPdfImageWidth = itdPdfImageHeight * itdAspectRatio;
        doc.addImage(itdLogo.dataURL, 'JPEG', 15, 12, itdPdfImageWidth, itdPdfImageHeight);

        // Logo del TecNM a la derecha
        const tecNmAspectRatio = tecNmLogo.width / tecNmLogo.height;
        const tecNmpdfImageHeight = 20;
        const tecNmpdfImageWidth = tecNmpdfImageHeight * tecNmAspectRatio;
        // Calcular posición X para alinear a la derecha con un margen de 15
        const tecNmXPosition = doc.internal.pageSize.getWidth() - 15 - tecNmpdfImageWidth;
        doc.addImage(tecNmLogo.dataURL, 'JPEG', tecNmXPosition, 12, tecNmpdfImageWidth, tecNmpdfImageHeight);

    } catch (error) {
        console.error("No se pudieron cargar los logos para el PDF:", error);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("TECNOLÓGICO NACIONAL DE MÉXICO", 105, 20, { align: 'center' });
    doc.text("INSTITUTO TECNOLÓGICO DE DURANGO", 105, 27, { align: 'center' });

    const documentTypeRaw = getFlexibleProperty(result, ['tipo']);
    const documentType = documentTypeRaw ? String(documentTypeRaw).trim().toLowerCase() : '';
    
    let titleText = 'Documento de Validez';
    if (documentType === 'constancia') {
        titleText = 'Constancia de Validez';
    } else if (documentType === 'reconocimiento') {
        titleText = 'Reconocimiento de Validez';
    }

    doc.setFontSize(18);
    doc.text(titleText, 105, 45, { align: 'center' });
    
    const data = {
        'Folio': getFlexibleProperty(result, ['Folio', 'ID']),
        'Nombre del Titular': getFlexibleProperty(result, ['Nombre', 'Nombre del Titular']),
        'Curso/Taller': getFlexibleProperty(result, ['Curso', 'Nombre del curso-taller']),
        'Fecha': getFlexibleProperty(result, ['Fecha', 'Fecha del curso-taller']),
        'Departamento': getFlexibleProperty(result, ['Departamento']),
        'Duración': getFlexibleProperty(result, ['Duracion', 'Duración']),
    };
    
    let y = 65;
    doc.setFontSize(11);
    const labelX = 20;
    const valueX = 70;

    Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        doc.setFont("helvetica", "bold");
        doc.text(`${key}:`, labelX, y);
        doc.setFont("helvetica", "normal");
        const displayValue = getPdfDisplayValue(key, value);
        const lines = doc.splitTextToSize(displayValue, 120);
        doc.text(lines, valueX, y);
        y += (lines.length * 7) + 5;
    });

    y += 5;

    doc.setLineWidth(0.2);
    doc.line(20, y, 190, y);
    y += 10;
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text("Este documento es una representación digital para la verificación de la constancia.", 105, y, { align: 'center' });
    y += 5;
    const now = new Date();
    const generatedDate = now.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    const generatedTime = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    doc.text(`Generado el: ${generatedDate}, ${generatedTime}`, 105, y, { align: 'center' });
    y += 5;
    doc.text("Contacto para dudas o aclaraciones: coord_actualizaciondocente@itdurango.edu.mx", 105, y, { align: 'center' });

    const folio = getFlexibleProperty(result, ['Folio', 'ID']) || 'Certificado';
    doc.save(`Validacion-${folio}.pdf`);
};