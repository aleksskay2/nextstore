import {useState} from 'react'
import axios from 'axios';

const Resend = () => {
    const [email, setEmail] = useState('')
    const [status, setStatus] = useState(null)
    const [loading, setLoading] = useState(false);

    const  COOLDOWN_MS = 5 * 60 * 1000;
    const lastSent = localStorage.getItem('resend_activation_last');

    const canSend = !lastSent || (Date.now() - parseInt(lastSent, 10) > COOLDOWN_MS);

    const handleSumbit = async (e) => {
        e.preventDefault();

        if (!canSend) {
            setStatus('Письмо уже отправлено. Подождите немного и попробуйте снова.')
            return;
        }

        setLoading(true)
        setStatus(null)

        try {
            await axios.post('/resend-activation/', {email});
            setStatus('Если аккаунт существует, письмо отправлено. Проверьте почту и папку Спам)')
            localStorage.setItem('resend_activation_last', Date.now().toString());
        }
        catch (error) {
            console.log(error)
            setStatus(error.response?.data?.detail || "Ошибка при отправке. Попробуйте позже")
        }
        finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <h3>Повторная отправка письма активации</h3>
            <form onSubmit={handleSumbit}>
                <input 
                    type="text" 
                    placeholder='Email'
                    value={email}
                    required
                    onChange={(e) => setEmail(e.target.value)}
                    style={{width:'100%', padding:8, marginBottom:8}}
                />
                <button type='sumbit' disabled={loading || !canSend} >
                    {loading ? 'Отправка...': 'Отправить письмо'}
                </button>
                {status && <p style={{marginTop:12}}>{status}</p>}
            </form>
        </div>
    )

}

export default Resend;