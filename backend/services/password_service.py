import re
import math

COMMON_PATTERNS = [
    'password', '123456', 'qwerty', 'abc123', 'letmein', 'monkey',
    'dragon', 'master', 'iloveyou', 'welcome', 'admin', 'login',
    'sunshine', 'princess', 'superman', '111111', 'football', 'shadow',
    '12345678', 'pass', 'test', '123456789', '1234567890', 'qwerty123'
]


def calc_entropy(password: str) -> float:
    """Calculate bits of entropy based on character pool size."""
    pool = 0
    if re.search(r'[a-z]', password): pool += 26
    if re.search(r'[A-Z]', password): pool += 26
    if re.search(r'[0-9]', password): pool += 10
    if re.search(r'[^a-zA-Z0-9]', password): pool += 32
    if pool == 0 or len(password) == 0:
        return 0.0
    return round(len(password) * math.log2(pool), 2)


def crack_time_str(entropy: float) -> str:
    """Estimate time to crack at 10 billion guesses/second."""
    guesses_per_sec = 1e10
    if entropy <= 0:
        return 'Instant'
    seconds = (2 ** entropy) / guesses_per_sec
    if seconds < 1:         return 'Instant'
    if seconds < 60:        return f'~{int(seconds)} seconds'
    if seconds < 3600:      return f'~{int(seconds/60)} minutes'
    if seconds < 86400:     return f'~{int(seconds/3600)} hours'
    if seconds < 2592000:   return f'~{int(seconds/86400)} days'
    if seconds < 31536000:  return f'~{int(seconds/2592000)} months'
    if seconds < 3153600000:return f'~{int(seconds/31536000)} years'
    return 'Centuries+'


def rule_based_score(password: str) -> dict:
    """
    Run 9 rules on the password.
    Returns: { score, label, checks{}, feedback[], entropy, crack_time }
    """
    score = 0
    checks = {}
    feedback = []

    # ── Length checks ──────────────────────────────────────────────────────
    checks['min_length']   = len(password) >= 8
    checks['good_length']  = len(password) >= 12
    checks['great_length'] = len(password) >= 16

    if checks['min_length']:
        score += 15
    else:
        feedback.append('Use at least 8 characters')

    if checks['good_length']:
        score += 15
    else:
        feedback.append('Use 12+ characters for better security')

    if checks['great_length']:
        score += 10

    # ── Character type checks ──────────────────────────────────────────────
    checks['has_upper']  = bool(re.search(r'[A-Z]', password))
    checks['has_lower']  = bool(re.search(r'[a-z]', password))
    checks['has_digit']  = bool(re.search(r'[0-9]', password))
    checks['has_symbol'] = bool(re.search(r'[^a-zA-Z0-9]', password))

    if checks['has_upper']:  score += 10
    else: feedback.append('Add uppercase letters (A-Z)')

    if checks['has_lower']:  score += 10
    else: feedback.append('Add lowercase letters (a-z)')

    if checks['has_digit']:  score += 10
    else: feedback.append('Add numbers (0-9)')

    if checks['has_symbol']: score += 15
    else: feedback.append('Add special characters (!@#$%^&*)')

    # ── Penalty: repeated characters ──────────────────────────────────────
    checks['no_repeat'] = not bool(re.search(r'(.)\1{2,}', password))
    if not checks['no_repeat']:
        score -= 10
        feedback.append('Avoid repeating characters (e.g. aaa, 111)')

    # ── Penalty: common patterns ───────────────────────────────────────────
    checks['no_common'] = not any(
        p in password.lower() for p in COMMON_PATTERNS
    )
    if not checks['no_common']:
        score -= 20
        feedback.append('Avoid common password patterns (e.g. password, 123456)')

    # ── Clamp score and assign label ───────────────────────────────────────
    score = max(0, min(100, score))

    if score <= 39:   label = 'Weak'
    elif score <= 69: label = 'Medium'
    else:             label = 'Strong'

    entropy    = calc_entropy(password)
    crack_time = crack_time_str(entropy)

    return {
        'score':      score,
        'label':      label,
        'checks':     checks,
        'feedback':   feedback,
        'entropy':    entropy,
        'crack_time': crack_time
    }
