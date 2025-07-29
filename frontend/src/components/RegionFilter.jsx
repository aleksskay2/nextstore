import { useEffect, useState } from "react";
import api from '../api/axios';


const RegionFilter = ({onFilter}) => {
    const [regions, setRegions] = useState([])
    const [selectRegion, setSelectRegion] = useState('')
    const [query, setQuery] = useState('')
    const [debouncedQuery, setDebouncedQuery] = useState('')


    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query.trim());
            
        }, (500));
        return () => clearTimeout(timer);
    }, [query])



    useEffect(() => {
        
        const fetchRegions = async () => {
            try {
                const response = await api.get('regions/')
                setRegions(response.data);
 
            }
            catch (error) {
                console.error('error in RegionFilter', error)
            }
        }
        fetchRegions();
    }, [])

    useEffect(() => {
        fetchResults();
    }, [debouncedQuery, query])

    // получение регионов по возрастанию цен
    const fetchResults = async () => {
        try {
            let url = `/products/?ordering=price`;
            console.log('selectRegion to regFilter  = ', selectRegion)
            if (debouncedQuery) url += `&search=${encodeURI(selectRegion)}`;
            if (regions) url += `&region=${regions}`

            const res = await api.get(url);
            onFilter(res.data);
        }
        catch(error) {
            console.error('Ошибка при поиске', error)
        }
    }




    const handleChange = async (e) => {
        const regionId = e.target.value;
        console.log('regionId', regionId)
        setSelectRegion(regionId);
        if (regionId) {
            const response = await api.get(`products/?region=${regionId}`);
            onFilter(response.data)
        }
        else {
            const response = await api.get('products/')
            onFilter(response.data)
        }
    }

    // const handleChange = (e) => {
    //     setRegions(e.target.value)
    //     setSelectRegion(e.target.value)
    //     console.log('selectRegion to regFilter change  = ', selectRegion)
    // }



    return (
        <select value={selectRegion} onChange={(e) =>handleChange(e)} 
         >
            <option value="">Все регионы</option>
            
            {regions.map (region => (
                <option key={region.id} value={region.id} >
                    {region.nameRegions}
                </option>
            ))}
        </select>
    )

}

export default RegionFilter;
