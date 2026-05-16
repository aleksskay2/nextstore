import { useProductFilter } from "../../components/store/useProductFilter";
export default function SearchBar() {
  const { search, setSearch } = useProductFilter();

  return (
    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Поиск..."
      className="search-input"
    />
  );
}