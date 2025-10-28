import React, { useState } from 'react';
import { ValidationStatus, ValidationStatusType, CertificateRecord } from '../types';
import { generatePdf } from '../services/pdfService';
import { getFlexibleProperty, formatDate } from '../utils/helpers';
import ErrorIcon from './icons/ErrorIcon';
import SuccessIcon from './icons/SuccessIcon';
import DownloadIcon from './icons/DownloadIcon';
import SpinnerIcon from './icons/SpinnerIcon';

interface ValidationResultProps {
  status: ValidationStatusType;
  result: CertificateRecord | null;
}

const ValidationResult: React.FC<ValidationResultProps> = ({ status, result }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownload = async () => {
    if (!result) return;
    setIsGeneratingPdf(true);
    try {
      await generatePdf(result);
    } catch (error) {
      console.error("PDF Generation failed", error);
      alert("Hubo un error al generar el PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (status === ValidationStatus.IDLE) return null;

  if (status === ValidationStatus.NOT_FOUND) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-8 p-6 bg-red-50 border-l-4 border-red-500 animate-fade-in rounded-r-lg shadow">
        <div className="flex items-center">
          <ErrorIcon className="w-8 h-8 text-red-500 mr-4 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-bold text-red-800">Documento no Encontrado</h3>
            <p className="text-red-700">El folio ingresado no fue encontrado en la base de datos. Por favor, verifique el folio e intente de nuevo.</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (status === ValidationStatus.SUCCESS && result) {
    const documentTypeRaw = getFlexibleProperty(result, ['tipo']);
    const documentType = documentTypeRaw ? String(documentTypeRaw).trim().toLowerCase() : '';

    let validationTitleText = "Documento Válido";
    if (documentType === 'constancia') {
        validationTitleText = 'Constancia Válida';
    } else if (documentType === 'reconocimiento') {
        validationTitleText = 'Reconocimiento Válido';
    }
    
    const formatDuration = (value: any) => {
        if (value === null || value === undefined) return 'N/A';
        const valueStr = String(value).trim();
        const upperValue = valueStr.toUpperCase();
        if (upperValue.includes('HORAS')) return upperValue;
        if (!isNaN(parseFloat(valueStr)) && valueStr !== '') return `${valueStr} HORAS`;
        return upperValue;
    };

    const displayData = {
      'Folio': getFlexibleProperty(result, ['Folio', 'ID']),
      'Nombre del Titular': getFlexibleProperty(result, ['Nombre', 'Nombre del Titular']),
      'Nombre del curso-taller': getFlexibleProperty(result, ['Curso', 'Nombre del curso-taller']),
      'Fecha del curso-taller': formatDate(getFlexibleProperty(result, ['Fecha', 'Fecha del curso-taller'])),
      'Departamento': getFlexibleProperty(result, ['Departamento']),
      'Duración': formatDuration(getFlexibleProperty(result, ['Duracion', 'Duración'])),
    };

    return (
      <div className="w-full max-w-2xl mx-auto mt-8 bg-green-50 border-l-4 border-green-500 animate-fade-in rounded-r-lg shadow">
        <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center">
                    <SuccessIcon className="w-8 h-8 text-green-500 mr-4 flex-shrink-0" />
                    <h3 className="text-lg font-bold text-green-800">{validationTitleText}</h3>
                </div>
                <button 
                    onClick={handleDownload} 
                    disabled={isGeneratingPdf}
                    className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition duration-200 disabled:bg-blue-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    {isGeneratingPdf ? (
                        <React.Fragment>
                            <SpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                            Generando...
                        </React.Fragment>
                    ) : (
                        <React.Fragment>
                            <DownloadIcon className="w-5 h-5 mr-2" />
                            Descargar Validación
                        </React.Fragment>
                    )}
                </button>
            </div>
        </div>
        <div className="bg-white p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm rounded-b-lg border-t border-green-200">
          {Object.entries(displayData).map(([key, value]) => (
            value ? (
              <div key={key}>
                <p className="text-gray-500">{key}</p>
                <p className="font-bold text-gray-800 break-words">{String(value).toUpperCase()}</p>
              </div>
            ) : null
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default ValidationResult;
