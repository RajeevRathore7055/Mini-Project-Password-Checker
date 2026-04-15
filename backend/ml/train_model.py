# Run this script to train the ML model:
# python ml/train_model.py

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml.strength_model import train_and_save

if __name__ == '__main__':
    train_and_save()
    print("Done! password_model.pkl is ready.")
