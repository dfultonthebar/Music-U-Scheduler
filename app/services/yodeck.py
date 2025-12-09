"""
Yodeck Digital Signage Integration Service

This service handles integration with Yodeck's API for digital signage management.
It allows uploading instructor slideshow cards to Yodeck displays.
"""

import httpx
from typing import Optional, List, Dict, Any
from datetime import datetime
import json
import logging
from sqlalchemy.orm import Session
from ..models import User, UserRole, SystemSettings
from ..crud import get_system_setting, create_system_setting, update_system_setting
from ..schemas import SystemSettingsCreate, SystemSettingsUpdate

logger = logging.getLogger(__name__)


class YodeckService:
    """Service for managing Yodeck digital signage integration"""

    # Yodeck API base URL - this may need to be adjusted based on actual API
    BASE_URL = "https://api.yodeck.com/v1"

    def __init__(self, db: Session):
        """
        Initialize Yodeck service

        Args:
            db: Database session for storing/retrieving settings
        """
        self.db = db
        self.api_token = self._get_api_token()
        self.headers = {}
        if self.api_token:
            self.headers = {
                "Authorization": f"Bearer {self.api_token}",
                "Content-Type": "application/json"
            }

    def _get_api_token(self) -> Optional[str]:
        """Get Yodeck API token from system settings"""
        setting = get_system_setting(self.db, "yodeck_api_token")
        return setting.value if setting else None

    def _get_playlist_id(self) -> Optional[str]:
        """Get Yodeck playlist ID from system settings"""
        setting = get_system_setting(self.db, "yodeck_playlist_id")
        return setting.value if setting else None

    def _save_setting(self, key: str, value: str, description: str = None):
        """Save or update a system setting"""
        existing = get_system_setting(self.db, key)
        if existing:
            update_system_setting(
                self.db,
                key,
                SystemSettingsUpdate(value=value, description=description),
                updated_by=None
            )
        else:
            create_system_setting(
                self.db,
                SystemSettingsCreate(key=key, value=value, description=description),
                created_by=None
            )

    def is_configured(self) -> bool:
        """Check if Yodeck integration is configured"""
        return bool(self.api_token)

    async def test_connection(self) -> Dict[str, Any]:
        """
        Test connection to Yodeck API

        Returns:
            Dict with success status and message
        """
        if not self.api_token:
            return {
                "success": False,
                "message": "No API token configured",
                "status": "not_configured"
            }

        try:
            async with httpx.AsyncClient() as client:
                # Try to get account info or media list to test connection
                response = await client.get(
                    f"{self.BASE_URL}/media",
                    headers=self.headers,
                    timeout=10.0
                )

                if response.status_code == 200:
                    return {
                        "success": True,
                        "message": "Successfully connected to Yodeck API",
                        "status": "connected"
                    }
                elif response.status_code == 401:
                    return {
                        "success": False,
                        "message": "Invalid API token",
                        "status": "unauthorized"
                    }
                else:
                    return {
                        "success": False,
                        "message": f"API returned status code: {response.status_code}",
                        "status": "error"
                    }
        except httpx.TimeoutException:
            return {
                "success": False,
                "message": "Connection timed out",
                "status": "timeout"
            }
        except Exception as e:
            logger.error(f"Yodeck connection test failed: {str(e)}")
            return {
                "success": False,
                "message": f"Connection error: {str(e)}",
                "status": "error"
            }

    async def upload_image(self, image_url: str, name: str) -> Optional[Dict]:
        """
        Upload an image to Yodeck media library

        Args:
            image_url: URL of the image to upload
            name: Name for the media item

        Returns:
            Dict with media info or None if failed
        """
        if not self.is_configured():
            raise ValueError("Yodeck not configured")

        try:
            async with httpx.AsyncClient() as client:
                # Download image first
                image_response = await client.get(image_url)
                image_response.raise_for_status()

                # Upload to Yodeck
                files = {
                    'file': (name, image_response.content, 'image/png')
                }

                upload_response = await client.post(
                    f"{self.BASE_URL}/media",
                    headers={"Authorization": f"Bearer {self.api_token}"},
                    files=files,
                    data={"name": name}
                )

                if upload_response.status_code in [200, 201]:
                    return upload_response.json()
                else:
                    logger.error(f"Failed to upload image: {upload_response.status_code}")
                    return None

        except Exception as e:
            logger.error(f"Error uploading image to Yodeck: {str(e)}")
            return None

    async def create_instructor_slide(
        self,
        instructor_id: int,
        instructor_name: str,
        photo_url: Optional[str] = None,
        bio: Optional[str] = None,
        instruments: List[str] = []
    ) -> Optional[Dict]:
        """
        Create a slide/media item for an instructor

        Args:
            instructor_id: Instructor user ID
            instructor_name: Full name of instructor
            photo_url: URL to instructor photo
            bio: Instructor biography
            instruments: List of instruments they teach

        Returns:
            Dict with slide info or None if failed
        """
        if not self.is_configured():
            raise ValueError("Yodeck not configured")

        slide_data = {
            "instructor_id": instructor_id,
            "name": instructor_name,
            "bio": bio or "Professional music instructor",
            "instruments": instruments or [],
            "created_at": datetime.utcnow().isoformat()
        }

        try:
            # If photo URL provided, upload it first
            media_id = None
            if photo_url:
                media = await self.upload_image(photo_url, f"instructor_{instructor_id}")
                if media:
                    media_id = media.get("id")

            # Create slide (this would be an HTML widget or image in Yodeck)
            # The actual implementation depends on Yodeck's API structure
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.BASE_URL}/widgets",  # Or appropriate endpoint
                    headers=self.headers,
                    json={
                        "name": f"Instructor: {instructor_name}",
                        "type": "html",  # or "image" depending on approach
                        "content": self._generate_slide_html(slide_data),
                        "media_id": media_id
                    }
                )

                if response.status_code in [200, 201]:
                    return response.json()
                else:
                    logger.error(f"Failed to create slide: {response.status_code}")
                    return None

        except Exception as e:
            logger.error(f"Error creating instructor slide: {str(e)}")
            return None

    def _generate_slide_html(self, instructor_data: Dict) -> str:
        """
        Generate HTML for instructor slide

        Args:
            instructor_data: Dictionary with instructor information

        Returns:
            HTML string for the slide
        """
        instruments_list = ", ".join(instructor_data.get("instruments", []))

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    margin: 0;
                    padding: 0;
                    font-family: 'Arial', sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    color: white;
                }}
                .slide-container {{
                    text-align: center;
                    max-width: 800px;
                    padding: 40px;
                }}
                .instructor-name {{
                    font-size: 48px;
                    font-weight: bold;
                    margin-bottom: 20px;
                }}
                .instruments {{
                    font-size: 32px;
                    margin-bottom: 30px;
                    opacity: 0.9;
                }}
                .bio {{
                    font-size: 24px;
                    line-height: 1.6;
                    opacity: 0.8;
                }}
                .logo {{
                    position: absolute;
                    bottom: 30px;
                    right: 30px;
                    font-size: 28px;
                    font-weight: bold;
                    opacity: 0.7;
                }}
            </style>
        </head>
        <body>
            <div class="slide-container">
                <div class="instructor-name">{instructor_data['name']}</div>
                <div class="instruments">{instruments_list}</div>
                <div class="bio">{instructor_data['bio']}</div>
            </div>
            <div class="logo">Music U</div>
        </body>
        </html>
        """
        return html

    async def create_instructor_playlist(
        self,
        instructors_data: List[Dict]
    ) -> Optional[Dict]:
        """
        Create or update playlist with all instructor slides

        Args:
            instructors_data: List of instructor data dictionaries

        Returns:
            Dict with playlist info or None if failed
        """
        if not self.is_configured():
            raise ValueError("Yodeck not configured")

        try:
            playlist_id = self._get_playlist_id()

            async with httpx.AsyncClient() as client:
                if playlist_id:
                    # Update existing playlist
                    response = await client.put(
                        f"{self.BASE_URL}/playlists/{playlist_id}",
                        headers=self.headers,
                        json={
                            "name": "Instructor Slideshow",
                            "items": instructors_data
                        }
                    )
                else:
                    # Create new playlist
                    response = await client.post(
                        f"{self.BASE_URL}/playlists",
                        headers=self.headers,
                        json={
                            "name": "Instructor Slideshow",
                            "items": instructors_data
                        }
                    )

                    if response.status_code in [200, 201]:
                        playlist_data = response.json()
                        # Save playlist ID
                        self._save_setting(
                            "yodeck_playlist_id",
                            str(playlist_data.get("id")),
                            "Yodeck playlist ID for instructor slideshow"
                        )

                if response.status_code in [200, 201]:
                    return response.json()
                else:
                    logger.error(f"Failed to create/update playlist: {response.status_code}")
                    return None

        except Exception as e:
            logger.error(f"Error managing playlist: {str(e)}")
            return None

    async def sync_instructors(self) -> Dict[str, Any]:
        """
        Sync all instructors to Yodeck

        Returns:
            Dict with sync results
        """
        if not self.is_configured():
            return {
                "success": False,
                "message": "Yodeck not configured",
                "synced": 0,
                "failed": 0
            }

        try:
            # Get all active instructors
            instructors = self.db.query(User).filter(
                User.role == UserRole.INSTRUCTOR,
                User.is_active == True
            ).all()

            synced = 0
            failed = 0
            slides = []

            for instructor in instructors:
                # Parse instruments
                instruments = []
                if instructor.specializations:
                    instruments = [s.strip() for s in instructor.specializations.split(',')]

                # Create slide
                slide = await self.create_instructor_slide(
                    instructor_id=instructor.id,
                    instructor_name=instructor.full_name,
                    photo_url=instructor.profile_image,
                    bio=instructor.bio,
                    instruments=instruments
                )

                if slide:
                    slides.append(slide)
                    synced += 1
                else:
                    failed += 1

            # Create/update playlist with all slides
            if slides:
                playlist = await self.create_instructor_playlist(slides)

            # Save last sync time
            self._save_setting(
                "yodeck_last_sync",
                datetime.utcnow().isoformat(),
                "Last Yodeck sync timestamp"
            )

            return {
                "success": True,
                "message": f"Synced {synced} instructors to Yodeck",
                "synced": synced,
                "failed": failed,
                "total": len(instructors)
            }

        except Exception as e:
            logger.error(f"Error syncing instructors: {str(e)}")
            return {
                "success": False,
                "message": f"Sync failed: {str(e)}",
                "synced": 0,
                "failed": 0
            }

    def save_api_token(self, token: str) -> Dict[str, Any]:
        """
        Save Yodeck API token to system settings

        Args:
            token: Yodeck API token

        Returns:
            Dict with save status
        """
        try:
            self._save_setting(
                "yodeck_api_token",
                token,
                "Yodeck API token for digital signage integration"
            )
            self.api_token = token
            self.headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            return {
                "success": True,
                "message": "API token saved successfully"
            }
        except Exception as e:
            logger.error(f"Error saving API token: {str(e)}")
            return {
                "success": False,
                "message": f"Failed to save token: {str(e)}"
            }

    def get_sync_status(self) -> Dict[str, Any]:
        """
        Get current sync status

        Returns:
            Dict with sync status information
        """
        last_sync_setting = get_system_setting(self.db, "yodeck_last_sync")
        last_sync = None
        if last_sync_setting:
            try:
                last_sync = datetime.fromisoformat(last_sync_setting.value)
            except:
                pass

        instructor_count = self.db.query(User).filter(
            User.role == UserRole.INSTRUCTOR,
            User.is_active == True
        ).count()

        return {
            "is_configured": self.is_configured(),
            "last_sync": last_sync.isoformat() if last_sync else None,
            "instructor_count": instructor_count,
            "playlist_id": self._get_playlist_id()
        }
