import React from 'react';
import styles from './Shop.module.css';

const PLACEHOLDER_IMAGE = 'https://placehold.co/300x300/161210/ffd700?text=No+Image';

interface Props {
  src: string;
  alt: string;
}

const ProductImageHover: React.FC<Props> = ({ src, alt }) => {
  return (
    <div
      className={styles.productImage}
      style={{ position: 'relative', overflow: 'hidden', padding: 0 }}
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
        }}
      />
    </div>
  );
};

export default ProductImageHover;
