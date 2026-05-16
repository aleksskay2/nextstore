import {Swiper, SwiperSlide} from 'swiper/react'
import {Navigation, Pagination} from 'swiper/modules'
import styles from './ProductGallery.module.css'

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
    pagination={{ clickable: true, }}
    spaceBetween={10}
    slidesPerView={1}
    className={styles['swiper-pagination']}
    
  >
  
    {images.map((img) => (
      
      <SwiperSlide  className={styles['swiper-class']} 
      key={img.id} >
        <img 
      
          src={img.image}
          
          alt={'Фото товара'} 
         
        />
          {    console.log('image - ', img.image)}
      </SwiperSlide>
    ))}
  </Swiper>
</div>
        
    )
    

}

export default ProductGallery;