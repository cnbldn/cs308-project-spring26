import React, { useState, lazy, Suspense } from 'react';
import styles from './Shop.module.css';

const CDDisk3D = lazy(() => import('./CDDisk3D'));
const PLACEHOLDER_IMAGE = 'https://placehold.co/300x300/161210/ffd700?text=No+Image';

interface Props {
  src: string;
  alt: string;
}

const ProductImageHover: React.FC<Props> = ({ src, alt }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={styles.productImage}
      style={{ position: 'relative', overflow: 'hidden', padding: 0 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={src}
        alt={alt}
        onError={(event) => {
          if (event.currentTarget.src !== PLACEHOLDER_IMAGE) {
            event.currentTarget.src = PLACEHOLDER_IMAGE;
          }
        }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          opacity: hovered ? 0 : 1,
          transition: 'opacity 0.25s ease',
        }}
      />
      {hovered && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
          }}
        >
          <Suspense fallback={null}>
            <CDDisk3D />
          </Suspense>
        </div>
      )}
    </div>
  );
};

export default ProductImageHover;
