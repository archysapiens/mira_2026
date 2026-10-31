import React from 'react';

export const MobileSalesBar: React.FC = () => {
  return (
    <div className="mobileSalesBar">
      <div>
        <small>¿Tienes un proyecto?</small>
        <b>Recibe una propuesta</b>
      </div>
      <a href="#cotizar" style={{ textDecoration: 'none' }}>
        <button type="button">Cotizar →</button>
      </a>
    </div>
  );
};
