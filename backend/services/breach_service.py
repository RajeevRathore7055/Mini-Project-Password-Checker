import hashlib
import requests


def check_hibp(password: str) -> dict:
    """
    Check password against HIBP using k-anonymity.
    Only sends first 5 chars of SHA-1 hash.
    """
    # Step 1: SHA-1 hash
    sha1 = hashlib.sha1(password.encode('utf-8')).hexdigest().upper()
    prefix = sha1[:5]
    suffix = sha1[5:]

    # Step 2: Call HIBP API
    try:
        response = requests.get(
            f'https://api.pwnedpasswords.com/range/{prefix}',
            headers={
                'Add-Padding': 'true',
                'User-Agent': 'SecurePass-PasswordChecker/1.0'
            },
            timeout=5
        )
        response.raise_for_status()
    except requests.exceptions.Timeout:
        return {'error': 'HIBP API timeout. Try again later.', 'status': 504}
    except requests.exceptions.RequestException as e:
        return {'error': f'Could not reach HIBP API: {str(e)}', 'status': 502}

    # Step 3: Search for our suffix in response
    breach_count = 0
    for line in response.text.splitlines():
        parts = line.split(':')
        if len(parts) == 2 and parts[0].strip() == suffix:
            breach_count = int(parts[1].strip())
            break

    is_breached = breach_count > 0

    return {
        'is_breached':  is_breached,
        'breach_count': breach_count,
        'message': (
            f'⚠️ Found {breach_count:,} times in data breaches! Do NOT use this password.'
            if is_breached else
            '✅ Good news — this password was not found in any known data breach.'
        )
    }
