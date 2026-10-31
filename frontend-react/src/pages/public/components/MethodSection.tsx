import React from 'react';

export const MethodSection: React.FC = () => {
  return (
    <section className="method" id="metodo">
      <div className="methodHead">
        <p className="eyebrow">Una ruta sencilla</p>
        <h2>De la necesidad a una solución ejecutable.</h2>
        <p>
          Estructuramos cada etapa para que sepas qué esperar, quién interviene y cómo se asegura el
          resultado.
        </p>
      </div>
      <div className="methodSteps">
        <article>
          <span>1</span>
          <div>
            <small>CONTACTO</small>
            <h3>Entendemos tu necesidad</h3>
            <p>Revisamos tipo de espacio, servicios requeridos y tiempos de respuesta esperados.</p>
          </div>
        </article>
        <article>
          <span>2</span>
          <div>
            <small>DIAGNÓSTICO</small>
            <h3>Evaluamos y cotizamos</h3>
            <p>Asignamos especialistas y preparamos una propuesta clara y sin sorpresas.</p>
          </div>
        </article>
        <article>
          <span>3</span>
          <div>
            <small>EJECUCIÓN</small>
            <h3>Coordinamos el trabajo</h3>
            <p>Planeación, personal, seguridad y comunicación en un mismo frente.</p>
          </div>
        </article>
        <article>
          <span>4</span>
          <div>
            <small>CIERRE</small>
            <h3>Damos seguimiento</h3>
            <p>La solicitud conserva su folio hasta quedar terminada.</p>
          </div>
        </article>
      </div>
    </section>
  );
};
