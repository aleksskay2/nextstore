export function formatDateLabel(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return "Сегодня";
    if (isYesterday) return "Вчера";

    const options = { day: "numeric", month: "long" };
    let formatted = date.toLocaleDateString("ru-RU", options);

    // Если год отличается — добавляем год
    if (date.getFullYear() !== today.getFullYear()) {
        formatted += ` ${date.getFullYear()}`;
    }

    return formatted;
}


