import { useEffect, useState, useSyncExternalStore } from "react";
import api from "../api/axios";

const StartRatingDisplay = ({rating}) => {
	return (
		<div>
		
			<div style={{display:'flex', gap: '5px', fontSize:'20px', cursor:'pointer'}}>
				{
					[...Array(5)].map((star, index) => (
						<span key={index} style={{
                                    color :(index < rating) ? '#ffc107':'#e4e5e9'
						}}>
                                ★
						</span>

						
					))
				}
		
		</div>
		</div>
		
	)
}


function ProductReviews({productId }) {
	const [reviews, setReviews] = useState([]);
	const [rating, setRating] = useState(0);
	const [hover, setHover] = useState(0)
	const [comment, setComment] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState(null)
	const [created_at, setCreated_at] = useState(new Date().toLocaleDateString())

  

  useEffect(() => {

    api.get(`product-reviews/?product=${productId}`)
      .then(res => setReviews(res.data))
      .catch(err => console.error(err));
	  	// {console.log('reviews -', reviews)}
  }, [productId]);


   

  	const fetchReviews = () => {
		   api.get(`product-reviews/?product=${productId}`)
      .then(res => setReviews(res.data))
      .catch(err => console.error(err));
	  	{console.log('reviews -', reviews)}
  	}

   const handleSubmitReview = async (e) => {
		  e.preventDefault();
		  setSubmitting(true);
		  
		  try {
				if (rating) {
					
					console.log('cre' ,created_at)
					await api.post(
						`product-reviews/${productId}/add_review/`,
						{ rating, comment }
						);
					alert("Отзыв отправлен!");
					setComment("");
					fetchReviews()
				}
				else {
					alert('ВЫ не поставили оценку!')
				}
			  
		  } catch (error) {
				const errorMessage = error.response?.data.error || 'Ошибка при отправке отзыва'
				setError(errorMessage)
			  console.error(error);
			
		  } finally {
			  setSubmitting(false);
		  }
	  };
  
	const setDate = (created_at) => {
		const date = new Date(created_at);
		const moscow = new Date(date.getTime() + 3 * 60 * 60 * 1000);
		
		// сдвигаем на +3 часа (Москва)
		return  moscow
	}


  return (
    <div>
      	
		<h3>Отзывы</h3>
		
			{
				
			reviews.map((review, index) => (
				<div key={index} >
					<div>
						{review.reviewer_name && review.reviewer_name} 
					{ new Date(review.created_at).toLocaleDateString()}
					</div>
			
					<StartRatingDisplay rating={review.rating}/>
					<div>
					{review.comment && <span>{review.comment}</span>}
					
					</div>
				</div>	))
				
					
			}
			
					
															
     
			<br /><br />
					<hr />


	<h4>Оставить отзыв продавцу</h4>
                <div style={{display:'flex', gap: '5px', fontSize:'20px', cursor:'pointer'}}>
                    {[...Array(5)].map((star, index) => {
                        const starValue = index + 1
                        return(
							<div key={index}>
								 <span key={starValue}
								
                                onClick={() => setRating(starValue)}
                                onMouseEnter={() => setHover(starValue)}
                                onMouseLeave={() => setHover(0)}
                                style={{
                                    color:starValue <= (hover || rating) ? '#ffc107':'#e4e5e9'
                                }}>
                                ★
                            </span>
							</div>
                           
                        );
                    })}
                </div>



                    Комментарий:
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows="3"
                    />
               	{<p>{error && <p style={{color:'red'}}>{error}</p> }</p>}
                <br />
                <button onClick={handleSubmitReview} disabled={submitting}>
                    {submitting ? "Отправка..." : "Отправить отзыв"}
                </button>

				<hr />
				
           


    </div>
  );
}

export default ProductReviews;


