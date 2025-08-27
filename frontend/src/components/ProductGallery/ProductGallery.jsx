import {Swiper, SwiperSlide} from 'swiper/react'
import {Navigation, Pagination} from 'swiper/modules'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

const ProductGallery = ({images}) => {
    if (!images || images.length === 0)
        return <p className='text-gray-500' >Нет изображений</p>


    return (
       <div>
  <Swiper
    modules={[Navigation, Pagination]}
    navigation
    pagination={{ clickable: true }}
    spaceBetween={10}
    slidesPerView={1}
    
  >
    {images.map((img) => (
      <SwiperSlide  style={{display:'flex', justifyContent:'center'}} className='item' key={img.id} >
        <img
          src={img.image}
          alt={img.alt_text || 'Фото товара'} width={150}
         
        />
      </SwiperSlide>
    ))}
  </Swiper>
</div>
        
    )
    

}

export default ProductGallery;