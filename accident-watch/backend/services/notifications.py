"""Notification helpers."""

from config import settings


def send_severe_sms(incident: dict) -> bool:
    if not settings.TWILIO_ACCOUNT_SID or settings.TWILIO_ACCOUNT_SID.startswith("ACXXXX"):
        print(f"[MOCK SMS] SEVERE incident at {incident.get('address', 'unknown location')}")
        return False

    try:
        from twilio.rest import Client

        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        maps_link = f"https://maps.google.com/?q={incident['lat']},{incident['lng']}"
        message = (
            f"AccidentWatch ALERT: {incident['severity']} incident detected. "
            f"Location: {incident.get('address', 'Unknown')}. Map: {maps_link}"
        )
        client.messages.create(
            body=message,
            from_=settings.TWILIO_FROM_NUMBER,
            to=settings.TWILIO_FROM_NUMBER,  # Replace with coordinator number in production
        )
        return True
    except Exception as exc:
        print(f"[SMS ERROR] {exc}")
        return False


async def broadcast_incident(incident: dict):
    from ws import manager

    await manager.broadcast({"type": "incident", "incident": incident})
