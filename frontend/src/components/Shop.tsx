import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Shop.module.css';

// Matches the backend product shape from backend/routes/products.js
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
}

// Dummy items for now — will be replaced with data from GET /api/products.
const DUMMY_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'The Legend of Zelda: Ocarina of Time',
    category: 'Videogame CD',
    price: 49.99,
    stock: 4,
    image: 'https://placehold.co/300x300/161210/ffd700?text=Zelda+OOT',
  },
  {
    id: 'p2',
    name: 'Final Fantasy VII',
    category: 'Videogame CD',
    price: 39.99,
    stock: 0,
    image: 'https://placehold.co/300x300/161210/ffd700?text=FF+VII',
  },
];

const Shop: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.shopContainer}>
      <h2 className={styles.shopTitle}>{t('shop.title')}</h2>
      <p className={styles.shopSubtitle}>{t('shop.subtitle')}</p>

      <div className={styles.productGrid}>
        {DUMMY_PRODUCTS.map((product) => {
          const outOfStock = product.stock === 0;
          return (
            <div key={product.id} className={styles.productCard}>
              <img
                src={product.image}
                alt={product.name}
                className={styles.productImage}
              />
              <p className={styles.productCategory}>{product.category}</p>
              <h3 className={styles.productName}>{product.name}</h3>
              <p
                className={`${styles.productStock} ${
                  outOfStock ? styles.outOfStock : ''
                }`}
              >
                {outOfStock
                  ? t('shop.outOfStock')
                  : t('shop.inStock', { count: product.stock })}
              </p>
              <div className={styles.productFooter}>
                <span className={styles.productPrice}>
                  ${product.price.toFixed(2)}
                </span>
                <button className={styles.addButton} disabled={outOfStock}>
                  {t('shop.addToCart')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Shop;
