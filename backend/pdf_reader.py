from pypdf import PdfReader
from io import BytesIO

def extract_text(file_bytes: bytes) -> str:
    """
    Extracts text from PDF file bytes in-memory using pypdf.
    """
    reader = PdfReader(BytesIO(file_bytes))
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text
