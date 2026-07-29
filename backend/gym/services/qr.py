import base64
import io
import uuid
import qrcode


def generate_member_qr(member_id):
    """Generates a unique QR code string plus a base64 data-URL PNG image."""
    code = f"APPEX-{uuid.uuid4().hex[:8].upper()}-{str(member_id).replace('-', '')[:6]}"
    img = qrcode.make(code, error_correction=qrcode.constants.ERROR_CORRECT_M)
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    data_url = 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()
    return code, data_url


def qr_image_data_url(code):
    img = qrcode.make(code, error_correction=qrcode.constants.ERROR_CORRECT_M)
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()
