export const compressImageWeb = (file, { maxWidth = 1200, quality = 0.7 } = {}) => {
    return new Promise((resolve) => {
        if (!file.type.startsWith('image/')) return resolve(file);

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // 🔥 Меняем 'image/jpeg' на 'image/webp'
                canvas.toBlob(
                    (blob) => {
                        if (!blob) return resolve(file);
                        
                        // Создаем файл с расширением .webp
                        const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
                        const compressedFile = new File([blob], newFileName, {
                            type: 'image/webp',
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    },
                    'image/webp', // Формат
                    quality       // Качество
                );
            };
        };
    });
};