import React, { useEffect } from 'react' ;
import Select from 'react-select'
import { useState } from 'react';
import useDictionary from '../store/useDictionary';
import { useProductFilter } from '../store/useProductFilter';

const RegionSelect = ({ region, onChange}) => {
    
    const {regions, fetchRegions, IsloadingRegions} = useDictionary()
    const { setRegion} = useProductFilter()
    
    const regionId = region?.value
    const options = [
       {value:'', label:'Все регионы'},
        ...regions.map((region) => ({
        value:region.id,
        label:region.nameRegions,
    }))
    ] 

    useEffect(() => {
        console.log('region', region)
    }, [])
     // Находим то, что сейчас выбрано в Zustand

    const selectedOption =
        options.find(opt => opt.value === region) || options[0]
    

    

    const handleChange = (option) => {
        // onChange(option.value || null); // просто передаём наверх
        // handleShowSearch(true)
        setRegion(option.value)
    };

    const isMobile = window.innerWidth <= 500;

    return (
        
        <Select
            options={options}
            value={selectedOption }
            onChange = {handleChange}
            
            isSearchable={false}
            styles ={{
                
                 menu:(base) => ({
                    ...base,
                    maxHeight:300,
                    // overflowY:'auto',
                    // maxWidth:"150px",
                     fontSize: isMobile ? "12px" : "14px",
                    // // height:"20px"
                }),
                container:(base) => ({
                    ...base,
                    margin:'0px',
                    // overflowY:'auto',
                    maxWidth:"150px",
                    //  maxHeight:'10px',
                  
                }),
                control:(base) => ({
                    ...base,
                  
                    minHeight:'6px',
                    backgroundColor:'#c5eaf4',
                    border:'1px',
                    fontSize: isMobile ? "12px" : "14px",
                    width: "130px",
                    padding: '0px 16px',
                    background: 'rgb(186, 220, 246)',
                    color: 'white',
                 
                    fontWeight: '600',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    transition: '0.25s ease',
                    
                }),
                
                dropdownIndicator:(base) => ({
                    ...base,
                    padding:'0px',
                    minHeight:'10px',
                    color:'#000',
                    svg :{
                        width:'14px',
                        height:'14px',
                    },
                    backgroundColor:'#c5eaf4',
                    fontSize:'12px'
                
                }),
                singleValue:(base) => ({
                    ...base,
                    fontSize:'12px',
                    
                }),
                
                valueContainer:(base) => ({
                    ...base,
                    padding:'0px 0px',
                    // width:"180px",
                  
                   
                    
                }),
                input:(base) => ({
                    ...base,
                    padding:'0',
                    margin:'0',
                    //  width:"180px",
                     
                    
                }),
                option:(base, state) => ({
                    ...base,
                   padding:'4px 4px',
                 
                    fontSize: isMobile ? "12px" : "12px",
                  
                    
                })
            }}

       />
    )
}

export default RegionSelect;