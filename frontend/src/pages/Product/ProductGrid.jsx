
export default function ProductGrid({ products }) {
  return (
    <div className="product-grid">
      {products.map((p) => (
        <div className="product-card" key={p.id}>
          <img src={p.main_image} alt={p.productName} />
          <h3>{p.productName}</h3>
          <p>{p.price} ₽</p>
        </div>
      ))}
    </div>
  );
}