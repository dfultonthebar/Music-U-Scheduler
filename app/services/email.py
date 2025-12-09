"""
Email service for Music U Scheduler
Handles SMTP email sending and email settings management
"""

import smtplib
import ssl
import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from sqlalchemy.orm import Session

from ..models import SystemSettings


@dataclass
class EmailSettings:
    """Email server configuration"""
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_use_tls: bool = True
    smtp_use_ssl: bool = False
    imap_host: Optional[str] = None
    imap_port: Optional[int] = None
    imap_username: Optional[str] = None
    imap_password: Optional[str] = None
    from_email: str = ""
    from_name: str = "Music U Scheduler"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "smtp_host": self.smtp_host,
            "smtp_port": self.smtp_port,
            "smtp_username": self.smtp_username,
            "smtp_password": self.smtp_password,
            "smtp_use_tls": self.smtp_use_tls,
            "smtp_use_ssl": self.smtp_use_ssl,
            "imap_host": self.imap_host,
            "imap_port": self.imap_port,
            "imap_username": self.imap_username,
            "imap_password": self.imap_password,
            "from_email": self.from_email,
            "from_name": self.from_name,
        }

    def to_safe_dict(self) -> Dict[str, Any]:
        """Return settings with password masked"""
        d = self.to_dict()
        if d["smtp_password"]:
            d["smtp_password"] = "********"
        if d["imap_password"]:
            d["imap_password"] = "********"
        return d

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "EmailSettings":
        return cls(
            smtp_host=data.get("smtp_host", ""),
            smtp_port=data.get("smtp_port", 587),
            smtp_username=data.get("smtp_username", ""),
            smtp_password=data.get("smtp_password", ""),
            smtp_use_tls=data.get("smtp_use_tls", True),
            smtp_use_ssl=data.get("smtp_use_ssl", False),
            imap_host=data.get("imap_host"),
            imap_port=data.get("imap_port"),
            imap_username=data.get("imap_username"),
            imap_password=data.get("imap_password"),
            from_email=data.get("from_email", ""),
            from_name=data.get("from_name", "Music U Scheduler"),
        )


class EmailService:
    """Service for sending emails and managing email settings"""

    SETTINGS_KEY = "email_settings"

    def __init__(self, db: Session):
        self.db = db
        self._settings: Optional[EmailSettings] = None

    def get_settings(self) -> EmailSettings:
        """Get email settings from database"""
        if self._settings is None:
            setting = self.db.query(SystemSettings).filter(
                SystemSettings.key == self.SETTINGS_KEY
            ).first()

            if setting:
                try:
                    data = json.loads(setting.value)
                    self._settings = EmailSettings.from_dict(data)
                except (json.JSONDecodeError, TypeError):
                    self._settings = EmailSettings()
            else:
                self._settings = EmailSettings()

        return self._settings

    def save_settings(self, settings: EmailSettings) -> None:
        """Save email settings to database"""
        setting = self.db.query(SystemSettings).filter(
            SystemSettings.key == self.SETTINGS_KEY
        ).first()

        settings_json = json.dumps(settings.to_dict())

        if setting:
            setting.value = settings_json
        else:
            setting = SystemSettings(
                key=self.SETTINGS_KEY,
                value=settings_json,
                description="Email server configuration"
            )
            self.db.add(setting)

        self.db.commit()
        self._settings = settings

    def update_settings(self, updates: Dict[str, Any]) -> EmailSettings:
        """Update specific email settings"""
        current = self.get_settings()
        current_dict = current.to_dict()

        # Only update provided fields, preserve passwords if not provided
        for key, value in updates.items():
            if key in current_dict:
                # Don't overwrite password if masked value is sent
                if key in ("smtp_password", "imap_password") and value == "********":
                    continue
                current_dict[key] = value

        new_settings = EmailSettings.from_dict(current_dict)
        self.save_settings(new_settings)
        return new_settings

    def is_configured(self) -> bool:
        """Check if email settings are configured"""
        settings = self.get_settings()
        return bool(settings.smtp_host and settings.from_email)

    def send_email(
        self,
        to_email: str,
        subject: str,
        body_text: str,
        body_html: Optional[str] = None,
        reply_to: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Send an email using configured SMTP settings

        Returns:
            Dict with 'success' boolean and 'message' string
        """
        settings = self.get_settings()

        if not self.is_configured():
            return {
                "success": False,
                "message": "Email settings not configured"
            }

        try:
            # Create message
            if body_html:
                msg = MIMEMultipart("alternative")
                msg.attach(MIMEText(body_text, "plain"))
                msg.attach(MIMEText(body_html, "html"))
            else:
                msg = MIMEText(body_text, "plain")

            msg["Subject"] = subject
            msg["From"] = f"{settings.from_name} <{settings.from_email}>"
            msg["To"] = to_email

            if reply_to:
                msg["Reply-To"] = reply_to

            # Connect and send
            if settings.smtp_use_ssl:
                # SSL connection (port 465)
                context = ssl.create_default_context()
                with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, context=context) as server:
                    if settings.smtp_username and settings.smtp_password:
                        server.login(settings.smtp_username, settings.smtp_password)
                    server.send_message(msg)
            else:
                # Standard connection with optional STARTTLS
                with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
                    if settings.smtp_use_tls:
                        context = ssl.create_default_context()
                        server.starttls(context=context)
                    if settings.smtp_username and settings.smtp_password:
                        server.login(settings.smtp_username, settings.smtp_password)
                    server.send_message(msg)

            return {
                "success": True,
                "message": f"Email sent successfully to {to_email}"
            }

        except smtplib.SMTPAuthenticationError as e:
            return {
                "success": False,
                "message": f"SMTP authentication failed: {str(e)}"
            }
        except smtplib.SMTPConnectError as e:
            return {
                "success": False,
                "message": f"Failed to connect to SMTP server: {str(e)}"
            }
        except smtplib.SMTPException as e:
            return {
                "success": False,
                "message": f"SMTP error: {str(e)}"
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Failed to send email: {str(e)}"
            }

    def send_bulk_emails(
        self,
        recipients: List[str],
        subject: str,
        body_text: str,
        body_html: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Send the same email to multiple recipients

        Returns:
            Dict with overall results and per-recipient status
        """
        results = {
            "total": len(recipients),
            "sent": 0,
            "failed": 0,
            "details": []
        }

        for email in recipients:
            result = self.send_email(email, subject, body_text, body_html)
            if result["success"]:
                results["sent"] += 1
            else:
                results["failed"] += 1
            results["details"].append({
                "email": email,
                **result
            })

        return results

    def test_connection(self) -> Dict[str, Any]:
        """
        Test SMTP connection without sending an email

        Returns:
            Dict with 'success' boolean and 'message' string
        """
        settings = self.get_settings()

        if not settings.smtp_host:
            return {
                "success": False,
                "message": "SMTP host not configured"
            }

        try:
            if settings.smtp_use_ssl:
                context = ssl.create_default_context()
                with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, context=context, timeout=10) as server:
                    if settings.smtp_username and settings.smtp_password:
                        server.login(settings.smtp_username, settings.smtp_password)
                    server.noop()
            else:
                with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
                    if settings.smtp_use_tls:
                        context = ssl.create_default_context()
                        server.starttls(context=context)
                    if settings.smtp_username and settings.smtp_password:
                        server.login(settings.smtp_username, settings.smtp_password)
                    server.noop()

            return {
                "success": True,
                "message": f"Successfully connected to {settings.smtp_host}:{settings.smtp_port}"
            }

        except smtplib.SMTPAuthenticationError as e:
            return {
                "success": False,
                "message": f"Authentication failed: Invalid username or password"
            }
        except smtplib.SMTPConnectError as e:
            return {
                "success": False,
                "message": f"Connection failed: Unable to reach {settings.smtp_host}:{settings.smtp_port}"
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Connection test failed: {str(e)}"
            }


# Email template functions
def get_password_reset_email(reset_url: str, user_name: str) -> Dict[str, str]:
    """Generate password reset email content"""
    text = f"""Hello {user_name},

You requested a password reset for your Music U Scheduler account.

Click the link below to reset your password:
{reset_url}

This link will expire in 60 minutes.

If you did not request this reset, please ignore this email.

Best regards,
Music U Scheduler Team
"""

    html = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
        .button {{ display: inline-block; background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Music U Scheduler</h1>
        </div>
        <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hello {user_name},</p>
            <p>You requested a password reset for your account. Click the button below to set a new password:</p>
            <p style="text-align: center;">
                <a href="{reset_url}" class="button">Reset Password</a>
            </p>
            <p>This link will expire in 60 minutes.</p>
            <p>If you did not request this reset, please ignore this email.</p>
            <p>Best regards,<br>Music U Scheduler Team</p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
"""

    return {
        "subject": "Password Reset - Music U Scheduler",
        "text": text,
        "html": html
    }


def get_lesson_reminder_email(
    student_name: str,
    instructor_name: str,
    lesson_date: str,
    lesson_time: str,
    instrument: str,
    location: Optional[str] = None,
) -> Dict[str, str]:
    """Generate lesson reminder email content"""
    location_text = f"\nLocation: {location}" if location else ""
    location_html = f"<p><strong>Location:</strong> {location}</p>" if location else ""

    text = f"""Hello {student_name},

This is a reminder about your upcoming music lesson:

Date: {lesson_date}
Time: {lesson_time}
Instrument: {instrument}
Instructor: {instructor_name}{location_text}

See you there!

Best regards,
Music U Scheduler Team
"""

    html = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
        .lesson-details {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed; }}
        .footer {{ text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Music U Scheduler</h1>
        </div>
        <div class="content">
            <h2>Lesson Reminder</h2>
            <p>Hello {student_name},</p>
            <p>This is a reminder about your upcoming music lesson:</p>
            <div class="lesson-details">
                <p><strong>Date:</strong> {lesson_date}</p>
                <p><strong>Time:</strong> {lesson_time}</p>
                <p><strong>Instrument:</strong> {instrument}</p>
                <p><strong>Instructor:</strong> {instructor_name}</p>
                {location_html}
            </div>
            <p>See you there!</p>
            <p>Best regards,<br>Music U Scheduler Team</p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
"""

    return {
        "subject": f"Lesson Reminder - {instrument} with {instructor_name}",
        "text": text,
        "html": html
    }


def get_welcome_email(user_name: str, login_url: str) -> Dict[str, str]:
    """Generate welcome email for new users"""
    text = f"""Welcome to Music U Scheduler, {user_name}!

Your account has been created successfully.

You can log in to your account here:
{login_url}

If you have any questions, please contact your administrator.

Best regards,
Music U Scheduler Team
"""

    html = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
        .button {{ display: inline-block; background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Music U Scheduler!</h1>
        </div>
        <div class="content">
            <h2>Hello {user_name}!</h2>
            <p>Your account has been created successfully.</p>
            <p>You can now access your dashboard to view your lessons, schedule, and more.</p>
            <p style="text-align: center;">
                <a href="{login_url}" class="button">Log In to Your Account</a>
            </p>
            <p>If you have any questions, please contact your administrator.</p>
            <p>Best regards,<br>Music U Scheduler Team</p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
"""

    return {
        "subject": "Welcome to Music U Scheduler!",
        "text": text,
        "html": html
    }
