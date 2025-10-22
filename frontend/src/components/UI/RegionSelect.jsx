import React from 'react' ;
import Select from 'react-select'
import { useState } from 'react';

const RegionSelect = ({regions, value, onChange}) => {
    
    const options = [
       {value:'0', label:'Все регионы'},
        ...regions.map((region) => ({
        value:region.id,
        label:region.nameRegions,
    }))
    ] 

    // по умолчанию "Все регионы"
  const [selectedOption, setSelectedOption] = useState(options[0]);

  const handleChange = (option) => {
    setSelectedOption(option);        // обновляем локально
    onChange(option.value);           // прокидываем наверх (all или id)
  };


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
                    fontSize:'14px',
                    // // height:"20px"
                }),
                container:(base) => ({
                    ...base,
                    margin:'0px',
                    // overflowY:'auto',
                    maxWidth:"200px",
                    //  maxHeight:'10px',
                  
                }),
                control:(base) => ({
                    ...base,
                    padding:'0px 5px',
                    minHeight:'12px',
                    backgroundColor:'#c5eaf4',
                    border:'1px'
                  
                    
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
                   fontSize:'12px'
                  
                    
                })
            }}

       />
    )
}

export default RegionSelect;