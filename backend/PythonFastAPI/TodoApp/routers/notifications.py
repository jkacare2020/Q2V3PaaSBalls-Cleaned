from fastapi import APIRouter, HTTPException, Depends
import smtplib
from email.message import EmailMessage
import os
from twilio.rest import Client

router = APIRouter(prefix="/notify", tags=["Notifications"])

# ✅ Email Configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
EMAIL_ADDRESS = os.getenv("EMAIL_USER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASS")

# ✅ Twilio SMS Configuration
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH")
TWILIO_PHONE = os.getenv("TWILIO_PHONE")

# ✅ Send Email
@router.post("/email")
async def send_email(recipient: str, subject: str, body: str):
    msg = EmailMessage()
    msg.set_content(body)
    msg["Subject"] = subject
    msg["From"] = EMAIL_ADDRESS
    msg["To"] = recipient

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            server.send_message(msg)
        return {"message": "Email sent"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ✅ Send SMS
@router.post("/sms")
async def send_sms(to: str, body: str):
    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            body=body,
            from_=TWILIO_PHONE,
            to=to
        )
        return {"message": "SMS sent", "sid": message.sid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
