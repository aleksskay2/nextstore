from django.conf import settings
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator

def send_activation_email():
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    activation_link = f"{settings.FRONTEND_URL}/activate?uid={uid}&token={token}"

    context = {'user':user, 'activation_link':activation_link}

    subject = 'Потвердите ваш email'
    text_body = render_to_string('emails/activation.txt', context)
    html_body = render_to_string('emails/activation.html', context)

    msg = EmailMultiAlternatives(subject, text_body, settings.DEFAULT_FROM_EMAIL, [user.email])
    msg.attach_alternative(html_body, 'text/html')
    msg.send()


