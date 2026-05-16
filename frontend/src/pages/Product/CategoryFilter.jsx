import { useProductFilter } from "../../components/store/UseProductFilter";

export default function CategoryFilter({ categories }) {
  const { category, setCategory } = useProductFilter();

  return (
    <select
      value={category}
      onChange={(e) => setCategory(e.target.value)}
      className="filter-select"
    >
      <option value="">Все категории</option>
      {categories?.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
