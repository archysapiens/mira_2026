import React from 'react';

export const ValueSection: React.FC = () => {
  return (
    <section className="valueSection">
      <div className="valueLead">
        <p className="eyebrow dark">Por qué elegir MIRA</p>
        <h2>
          Menos proveedores.
          <br />
          Más control.
        </h2>
        <p>
          Centralizamos distintas especialidades para reducir coordinación, retrasos y riesgos
          operativos. Tú mantienes visibilidad del proyecto; nosotros nos ocupamos de la ejecución.
        </p>
        <a href="#cotizar" style={{ textDecoration: 'none' }}>
          <button type="button">Evaluar mi proyecto →</button>
        </a>
      </div>
      <div className="valueCards">
        <article>
          <span>01</span>
          <h3>Respuesta clara</h3>
          <p>
            Recopilamos la información esencial desde el inicio para asignar al especialista
            correcto.
          </p>
        </article>
        <article>
          <span>02</span>
          <h3>Ejecución segura</h3>
          <p>
            Equipos preparados, procedimientos definidos y atención a las condiciones particulares
            del sitio.
          </p>
        </article>
        <article>
          <span>03</span>
          <h3>Seguimiento real</h3>
          <p>
            Cada solicitud recibe un folio y estatus para que el avance no se pierda entre llamadas o
            mensajes.
          </p>
        </article>
      </div>
    </section>
  );
};
