import { useEffect, useState } from "react";
import styles from "./ImageGallery.module.css";

const ImageGallery = ({ images, startIndex, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(startIndex);

    const prevImage = () => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const nextImage = () => {
        setCurrentIndex((prev) => {
            prev === images.length - 1 ? 0 : prev + 1;
        });
    };

    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft") prevImage();
            if (e.key === "ArrowRight") nextImage();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, []);

    return (
        <div className={styles["image__full"]} onClick={onClose}>
            <button
                className={styles["image__prev"]}
                onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                }}
            >
                ⬅
            </button>

            <img
                className={styles["image__photo"]}
                src={images[currentIndex].image}
                alt="gallery"
                onClick={(e) => e.stopPropagation()}
            />
            <button className={styles["image__next"]}>➡</button>
        </div>
    );
};

export default ImageGallery;
