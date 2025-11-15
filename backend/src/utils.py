import logging
import random
import re
import string
from urllib.parse import urlencode, urljoin

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.models import Tenant
from src.config import settings

logger = logging.getLogger(__name__)

ALPHA_NUM = string.ascii_letters + string.digits


def generate_random_alphanum(length: int = 20) -> str:
    return "".join(random.choices(ALPHA_NUM, k=length))


def _slugify(text: str) -> str:
    """Convert text to a URL-friendly slug."""
    # Convert to lowercase
    text = text.lower()
    # Replace spaces and underscores with hyphens
    text = re.sub(r"[\s_]+", "-", text)
    # Remove all non-alphanumeric characters except hyphens
    text = re.sub(r"[^a-z0-9-]", "", text)
    # Remove multiple consecutive hyphens
    text = re.sub(r"-+", "-", text)
    # Remove leading and trailing hyphens
    text = text.strip("-")
    return text


async def generate_unique_slug(session: AsyncSession, name: str) -> str:
    """
    Generate a unique slug from a name, ensuring it doesn't already exist in the Tenant table.

    Args:
        session: The database session
        name: The name to generate a slug from

    Returns:
        A unique slug
    """
    base_slug = _slugify(name)
    if not base_slug:
        # If slugification results in empty string, use a random slug
        base_slug = generate_random_alphanum(8)

    slug = base_slug
    counter = 1

    # Check if slug exists and append counter if needed
    while True:
        result = await session.execute(
            select(Tenant).where(Tenant.slug == slug)
        )
        if result.scalar_one_or_none() is None:
            break
        slug = f"{base_slug}-{counter}"
        counter += 1

    return slug


def build_frontend_url(path: str, params: dict[str, str] | None = None) -> str:
    """
    Build a frontend URL with optional query parameters.

    Args:
        path: The path relative to the frontend base URL
        params: Optional query parameters as a dictionary

    Returns:
        The complete frontend URL

    Raises:
        ValueError: If FRONTEND_URL is not configured
    """
    if not settings.FRONTEND_URL:
        raise ValueError("FRONTEND_URL is not configured")

    url = urljoin(settings.FRONTEND_URL.rstrip("/") + "/", path.lstrip("/"))
    if params:
        query_string = urlencode(params)
        url = f"{url}?{query_string}"
    return url


def build_app_url(path: str, params: dict[str, str] | None = None) -> str:
    """
    Build an app/backend URL with optional query parameters.

    Args:
        path: The path relative to the app base URL
        params: Optional query parameters as a dictionary

    Returns:
        The complete app URL

    Raises:
        ValueError: If APP_URL is not configured
    """
    if not settings.APP_URL:
        raise ValueError("APP_URL is not configured")

    url = urljoin(settings.APP_URL.rstrip("/") + "/", path.lstrip("/"))
    if params:
        query_string = urlencode(params)
        url = f"{url}?{query_string}"
    return url
