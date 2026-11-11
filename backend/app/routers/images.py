"""
Image endpoints (upload / replace / delete / list) on Cloudflare R2.
Place at: backend/app/routers/images.py
"""
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile

from app import storage
from app.deps import get_current_user
from app.models import User

router = APIRouter(prefix="/images", tags=["images"])


@router.post("", status_code=201)
async def upload_image(
    file: UploadFile = File(...),
    folder: str = Query("general", pattern=storage.FOLDER_PATTERN),
    user: User = Depends(get_current_user),
):
    """Upload a new image. Save the returned `key` in your database."""
    data, ctype = await storage.read_and_validate(file)
    key = storage.make_key(folder, ctype)
    await storage.put(key, data, ctype)
    return {"key": key, "url": storage.public_url(key), "size": len(data), "content_type": ctype}


@router.put("/{key:path}")
async def replace_image(
    key: str,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    """
    Edit = replace. Uploads the new file under a NEW key, then deletes the old one,
    so cached copies of the old image are never served. Update the key saved in
    your database with the returned `key`.
    """
    key = storage.validate_key(key)
    if not await storage.exists(key):
        raise HTTPException(404, "Image not found")

    data, ctype = await storage.read_and_validate(file)
    new_key = storage.make_key(storage.folder_of(key), ctype)
    await storage.put(new_key, data, ctype)  # upload first: a failure keeps the old image
    await storage.delete(key)
    return {
        "old_key": key,
        "key": new_key,
        "url": storage.public_url(new_key),
        "size": len(data),
        "content_type": ctype,
    }


@router.delete("/{key:path}", status_code=204)
async def delete_image(key: str, user: User = Depends(get_current_user)):
    key = storage.validate_key(key)
    if not await storage.exists(key):
        raise HTTPException(404, "Image not found")
    await storage.delete(key)


@router.get("")
async def list_images(
    folder: str = Query("", pattern=r"^[a-z0-9_-]{0,40}$"),
    limit: int = Query(50, ge=1, le=200),
    cursor: str | None = None,
    user: User = Depends(get_current_user),
):
    resp = await storage.list_objects(folder, limit, cursor)
    return {
        "items": [
            {
                "key": o["Key"],
                "url": storage.public_url(o["Key"]),
                "size": o["Size"],
                "modified": o["LastModified"],
            }
            for o in resp.get("Contents", [])
        ],
        "next_cursor": resp.get("NextContinuationToken"),
    }