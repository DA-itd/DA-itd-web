import React, { useState } from "react";

export default function App() {
  const [formData, setFormData] = useState({
    nombre: "",
    curp: "",
    email: "",
    departamento: "",
    curso: "",
  });

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbzYJgSKAg0uVC3Z_EQbCGNXwCnPh8x2Y195nrOshyHh0rGHgZABcBZy_2uuJAyVprte/exec", // 🔗 Reemplaza con tu URL real del Apps Script
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      }
    );

    const result = await response.json();

    if (result.status === "success") {
      alert("✅ Registro enviado correctamente.");
      // Limpia el formulario
      setFormData({
        nombre: "",
        curp: "",
        email: "",
        departamento: "",
        curso: "",
      });
    } else {
      alert("⚠️ Error: " + result.message);
    }
  } catch (error) {
    alert("❌ No se pudo conectar con el servidor: " + error);
  }
};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Datos enviados:", formData);
    alert("Registro enviado correctamente (simulado). ✅");
    // Aquí puedes conectar con Google Sheets API o un endpoint
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <h1 className="text-3xl font-bold text-blue-600 mb-2 text-center">
        Sistema de Inscripción a Cursos
      </h1>
      <p className="text-gray-600 mb-8 text-center">
        Completa el siguiente formulario para registrarte.
      </p>

      {/* FORMULARIO */}
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-md space-y-4"
      >
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre completo
          </label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej. Juan Pérez"
          />
        </div>

        {/* CURP */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CURP
          </label>
          <input
            type="text"
            name="curp"
            value={formData.curp}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded-lg uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej. PEXJ800101HDFRZN09"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Correo institucional
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej. juan.perez@itdurango.edu.mx"
          />
        </div>

        {/* Departamento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Departamento
          </label>
          <select
            name="departamento"
            value={formData.departamento}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecciona una opción</option>
            <option value="Sistemas y Computación">Sistemas y Computación</option>
            <option value="Industrial">Industrial</option>
            <option value="Electrónica">Electrónica</option>
            <option value="Gestión Empresarial">Gestión Empresarial</option>
            <option value="Química">Química</option>
            <option value="Ciencias Básicas">Ciencias Básicas</option>
            <option value="Administración">Administración</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        {/* Curso */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Curso solicitado
          </label>
          <select
            name="curso"
            value={formData.curso}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecciona un curso</option>
            <option value="Inteligencia Artificial para Docentes">
              Inteligencia Artificial para Docentes
            </option>
            <option value="Metodologías Activas de Enseñanza">
              Metodologías Activas de Enseñanza
            </option>
            <option value="Seguridad y Hacking Ético con IA">
              Seguridad y Hacking Ético con IA
            </option>
            <option value="Marco Legal en la Ética de la Investigación">
              Marco Legal en la Ética de la Investigación
            </option>
          </select>
        </div>

        {/* Botón */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Enviar inscripción
        </button>
      </form>

      {/* Mensaje */}
      <p className="text-gray-500 text-sm mt-6">
        Tu información será enviada al sistema de actualización docente.
      </p>
    </div>
  );
}
