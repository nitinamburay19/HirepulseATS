"""
Email notification service for ATS candidate lifecycle events.
"""
from __future__ import annotations

from datetime import datetime
from email.mime.text import MIMEText
import smtplib
from typing import Any, Dict

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.notification import NotificationLog


class NotificationService:
    def __init__(self, db: Session):
        self.db = db

    def send_candidate_event(
        self,
        *,
        event: str,
        to_email: str,
        candidate_name: str,
        user_id: int | None = None,
        candidate_id: int | None = None,
        payload: Dict[str, Any] | None = None,
    ) -> Dict[str, Any]:
        payload = payload or {}
        subject, body = self._build_template(event, candidate_name, payload)

        log = NotificationLog(
            user_id=user_id,
            candidate_id=candidate_id,
            event=event,
            to_email=to_email,
            subject=subject,
            body=body,
            status="queued",
            payload=payload,
        )
        self.db.add(log)
        self.db.flush()

        try:
            sent = self._dispatch_email(to_email=to_email, subject=subject, body=body)
            log.status = "sent" if sent else "simulated"
            log.sent_at = datetime.utcnow()
            log.error_message = None
        except Exception as exc:
            log.status = "failed"
            log.error_message = str(exc)

        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return {"id": log.id, "status": log.status}

    def _dispatch_email(self, *, to_email: str, subject: str, body: str) -> bool:
        if not settings.EMAIL_ENABLED:
            return False

        if not settings.SMTP_HOST:
            return False

        msg = MIMEText(body, "plain", "utf-8")
        msg["Subject"] = subject
        msg["From"] = settings.EMAIL_FROM
        msg["To"] = to_email

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAIL_FROM, [to_email], msg.as_string())

        return True

    def _build_template(self, event: str, candidate_name: str, payload: Dict[str, Any]) -> tuple[str, str]:
        company = str(payload.get("company", "HirePulse"))
        job_title = str(payload.get("job_title", "the role"))
        interview_date = str(payload.get("interview_date", "TBD"))
        interview_time = str(payload.get("interview_time", "TBD"))
        interview_mode = str(payload.get("interview_mode", "Virtual"))
        offer_code = str(payload.get("offer_code", ""))
        joining_date = str(payload.get("joining_date", "TBD"))

        templates = {
            "application_submitted": (
                f"Thank you for applying - {job_title}",
                f"Hi {candidate_name},\n\nThank you for applying for {job_title} at {company}. "
                "Your application has been received successfully and is now under review.\n\n"
                "We will update you with the next steps soon.\n\nRegards,\nHiring Team",
            ),
            "interview_scheduled": (
                f"Interview scheduled - {job_title}",
                f"Hi {candidate_name},\n\nYour interview for {job_title} has been scheduled.\n"
                f"Date: {interview_date}\nTime: {interview_time}\nMode: {interview_mode}\n\n"
                "Please be available 10 minutes early.\n\nRegards,\nHiring Team",
            ),
            "selected": (
                f"You have been shortlisted - {job_title}",
                f"Hi {candidate_name},\n\nCongratulations. You have been shortlisted for {job_title} at {company}.\n"
                "Our team will share the next selection steps shortly.\n\nRegards,\nHiring Team",
            ),
            "offer_released": (
                f"Offer letter released - {job_title}",
                f"Hi {candidate_name},\n\nGreat news. Your offer letter for {job_title} has been released.\n"
                f"Offer Code: {offer_code}\n"
                "Please review and respond from your candidate portal.\n\nRegards,\nHiring Team",
            ),
            "rejected": (
                f"Update on your application - {job_title}",
                f"Hi {candidate_name},\n\nThank you for your interest in {job_title} at {company}. "
                "After careful review, we are unable to move forward with your application at this time.\n\n"
                "We appreciate your time and wish you success ahead.\n\nRegards,\nHiring Team",
            ),
            "joined": (
                f"Welcome to {company}",
                f"Hi {candidate_name},\n\nThank you for joining {company}. "
                f"We are excited to have you onboard as {job_title}.\n"
                f"Date of joining: {joining_date}\n\nWelcome aboard.\n\nRegards,\nHR Team",
            ),
        }

        return templates.get(
            event,
            (
                "Application update",
                f"Hi {candidate_name},\n\nYour application status has been updated.\n\nRegards,\nHiring Team",
            ),
        )


def notification_service(db: Session) -> NotificationService:
    return NotificationService(db)
