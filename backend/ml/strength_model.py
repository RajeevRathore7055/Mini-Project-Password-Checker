import re
import math
import pickle
import os
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'password_model.pkl')

COMMON_PASSWORDS = {
    'password', '123456', 'qwerty', 'abc123', 'letmein', 'monkey',
    'dragon', 'master', 'iloveyou', 'welcome', 'admin', 'login',
    '111111', 'football', 'shadow', '12345678', 'pass', 'test',
    'sunshine', 'princess', 'superman', '123456789', '1234567890'
}


def extract_features(password: str) -> list:
    """Extract 12 numeric features from a password."""
    length = len(password)

    has_upper  = 1 if re.search(r'[A-Z]', password) else 0
    has_lower  = 1 if re.search(r'[a-z]', password) else 0
    has_digit  = 1 if re.search(r'[0-9]', password) else 0
    has_symbol = 1 if re.search(r'[^a-zA-Z0-9]', password) else 0

    upper_count  = len(re.findall(r'[A-Z]', password))
    digit_count  = len(re.findall(r'[0-9]', password))
    symbol_count = len(re.findall(r'[^a-zA-Z0-9]', password))

    # Shannon entropy
    freq = {}
    for c in password:
        freq[c] = freq.get(c, 0) + 1
    shannon = 0.0
    if length > 0:
        for f in freq.values():
            p = f / length
            shannon -= p * math.log2(p)

    # Pool entropy
    pool = 0
    if has_lower:  pool += 26
    if has_upper:  pool += 26
    if has_digit:  pool += 10
    if has_symbol: pool += 32
    pool_entropy = length * math.log2(pool) if pool > 0 else 0

    has_repeat = 1 if re.search(r'(.)\1{2,}', password) else 0
    is_common  = 1 if password.lower() in COMMON_PASSWORDS else 0

    return [
        length, has_upper, has_lower, has_digit, has_symbol,
        upper_count, digit_count, symbol_count,
        round(shannon, 4), round(pool_entropy, 4),
        has_repeat, is_common
    ]


def _generate_training_data():
    """Generate labeled training dataset."""
    import random
    import string
    random.seed(42)

    weak_passwords = [
        'password', '123456', 'abc', 'pass', 'test', 'qwerty',
        'letmein', '1234', 'aaaa', 'hello', 'admin', 'user',
        'login', '111111', 'dragon', 'monkey', 'abc123', 'pass1',
        'sun', 'cat', 'dog', 'red', 'blue', 'a1b2', '1111',
        'asdf', 'zxcv', '12345', 'iloveyou', 'welcome', 'shadow',
        'master', 'sunshine'
    ]

    strong_passwords = [
        'Tr0ub4dor&3', 'P@ssw0rd!2024', 'X#9mK$vL2pQr',
        'MyD0g!sN@med#Max', 'Secure#Pass_99!', 'R@ndom$tr1ng*2024',
        'Blue$ky#R@in99', 'Th1s!sV3ryStr0ng', 'F1r3Fl!es@Night',
        'W!ldF0x&Run5Fast', 'C0ff33#L0ver!2024', 'P1zzaL0ver!@Home',
        'Tr@vel$World2024!', 'M0untain@Peak!X9', 'D33p$ea#D!ve2024',
        'S@lt&P3pper!C00k', 'galaxy*HORSE_7x2!', 'cloud$DRIFT_4z8#',
        'forest@RIDGE_9k1!', 'ocean#WAVE_5m3$Ab', 'flame%TOWER_2n6@',
        'stone*RIVER_8j4!', 'Kite#Fly$High!99', 'N0w@yToGuess!X7',
        'D@rkn3ss!inL1ght', 'correcthorseBATTERY$taple99'
    ]

    X, y = [], []

    # Label 0 = Weak
    for pw in weak_passwords:
        X.append(extract_features(pw))
        y.append(0)

    # Label 2 = Strong
    for pw in strong_passwords:
        X.append(extract_features(pw))
        y.append(2)

    # Augment weak: random 4-8 char lowercase+digit
    for _ in range(200):
        length = random.randint(4, 8)
        pw = ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))
        X.append(extract_features(pw))
        y.append(0)

    # Augment medium: random 8-12 char with some variety
    for _ in range(150):
        length = random.randint(8, 12)
        chars = string.ascii_letters + string.digits
        pw = ''.join(random.choices(chars, k=length))
        X.append(extract_features(pw))
        y.append(1)

    # Augment strong: random 13-20 char all types
    for _ in range(200):
        length = random.randint(13, 20)
        chars = string.ascii_letters + string.digits + '!@#$%^&*'
        pw = (
            random.choice(string.ascii_uppercase) +
            random.choice(string.ascii_lowercase) +
            random.choice(string.digits) +
            random.choice('!@#$%^&*') +
            ''.join(random.choices(chars, k=length - 4))
        )
        X.append(extract_features(pw))
        y.append(2)

    return np.array(X), np.array(y)


def train_and_save():
    """Train Logistic Regression model and save to pkl."""
    print("🤖 Training ML model...")
    X, y = _generate_training_data()
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('clf', LogisticRegression(max_iter=1000, random_state=42, multi_class='multinomial'))
    ])
    pipeline.fit(X, y)
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(pipeline, f)
    print(f"✅ Model trained on {len(y)} samples — saved to {MODEL_PATH}")
    return pipeline


def load_model():
    """Load model from pkl or train if not found."""
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, 'rb') as f:
            return pickle.load(f)
    return train_and_save()


# Module-level model cache
_model = None

def get_model():
    global _model
    if _model is None:
        _model = load_model()
    return _model


def predict_strength(password: str) -> dict:
    """Predict password strength using ML model."""
    try:
        model = get_model()
        features = extract_features(password)
        X = np.array([features])
        prediction = model.predict(X)[0]
        proba = model.predict_proba(X)[0]

        label_map = {0: 'Weak', 1: 'Medium', 2: 'Strong'}
        label = label_map.get(prediction, 'Medium')
        confidence = float(proba[prediction])

        return {
            'label':      label,
            'confidence': round(confidence, 4),
            'confidence_pct': f"{round(confidence * 100, 1)}%",
            'all_probs': {
                'Weak':   round(float(proba[0]) * 100, 1),
                'Medium': round(float(proba[1]) * 100, 1),
                'Strong': round(float(proba[2]) * 100, 1),
            }
        }
    except Exception as e:
        # Fallback if model fails
        return {'label': 'Medium', 'confidence': 0.5, 'confidence_pct': '50%', 'all_probs': {}}
