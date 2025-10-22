const SmoothStar = ({ filled, size = 17 }) => (
  <svg
    viewBox="0 -2 24 24"
    width={size}
    height={size}
    fill={"#ffc107" }
    stroke="#999"
    strokeWidth="0.3"
    style={{ borderRadius: "50%" }}
  >
    <path d="M12 2.5c.6 0 1.2.4 1.4.9l2 4.1 4.5.6c.6.1 1 .6 1 1.2 0 .4-.2.7-.5 1l-3.3 3.3.8 4.6c.1.7-.2 1.3-.8 1.6-.3.1-.5.2-.8.2-.3 0-.6-.1-.9-.3L12 18l-4 2.1c-.6.3-1.3.2-1.7-.3s-.6-1.1-.5-1.7l.8-4.6-3.3-3.3c-.3-.3-.5-.6-.5-1 0-.6.4-1.1 1-1.2l4.5-.6 2-4.1c.3-.5.8-.9 1.4-.9z" />
  </svg>
);


export default SmoothStar;