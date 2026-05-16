import { useProductFilter } from "../../components/store/UseProductFilter";
export default function RegionFilter({ regions }) {
  const { region, setRegion } = useProductFilter();

  return (
    <select
      value={region}
      onChange={(e) => setRegion(e.target.value)}
      className="filter-select"
    >
      <option value="">Все регионы</option>
      {regions?.map((r) => (
        <option key={r.id} value={r.id}>
          {r.name}
        </option>
      ))}
    </select>
  );
}