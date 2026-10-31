import React from 'react';

export const FaqSection: React.FC = () => {
  return (
    <section className="faq" id="preguntas">
      <div className="sectionHead">
        <div>
          <p className="eyebrow dark">Información útil</p>
          <h2>Preguntas frecuentes</h2>
        </div>
      </div>
      <div className="faqGrid">
        <details>
          <summary>¿Por qué se requiere un programa de limpieza y sanitización en silos?</summary>
          <p>
            Para mantener equipos salubres e inocuos y cumplir los requerimientos aplicables a la
            industria alimentaria.
          </p>
        </details>
        <details>
          <summary>¿Cuándo se recomienda fumigar el interior de los silos?</summary>
          <p>
            Cuando existe evidencia que justifique el tratamiento, como parte de un programa
            controlado de sanidad.
          </p>
        </details>
        <details>
          <summary>¿Quién determina la frecuencia de limpieza?</summary>
          <p>
            Se define considerando humedad, presencia de insectos, operación, presupuesto y los
            criterios del equipo HACCP.
          </p>
        </details>
        <details>
          <summary>¿Qué se logra con un programa anual?</summary>
          <p>
            Equipos más salubres, menor contaminación de producto, reducción de mermas y mejor
            control de costos.
          </p>
        </details>
      </div>
    </section>
  );
};
