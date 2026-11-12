"""
Seed demonstration study logs for user 1 and 4 so the dashboard showcases:
- 100% mastered roots (all circles filled)
- Partially mastered roots (some circles filled, some outlined)
- Low/unattempted roots (all circles outlined)
"""

import sqlite3
import os
import random
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "backend", "kiwi_platform.sqlite3")

def seed_logs():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Get sample roots across clusters
    cur.execute("SELECT id, morpheme, thematic_cluster FROM kiwi_vocab_root ORDER BY id")
    roots = cur.fetchall()

    now = datetime.now()
    log_rows = []

    # Choose user IDs
    user_ids = [1, 4]

    for user_id in user_ids:
        # Take first 30 roots
        for idx, (root_id, morpheme, cluster) in enumerate(roots[:30]):
            cur.execute("SELECT id, word FROM kiwi_vocab_vocabularyword WHERE root_id = ?", (root_id,))
            words = cur.fetchall()
            if not words:
                continue

            # Vary mastery pattern by root index
            if idx % 4 == 0:
                # 100% mastered
                mastery_count = len(words)
            elif idx % 4 == 1:
                # 60-80% mastered
                mastery_count = max(1, int(len(words) * 0.7))
            elif idx % 4 == 2:
                # 20-40% mastered
                mastery_count = max(1, int(len(words) * 0.3))
            else:
                # 0% mastered (all outlined)
                mastery_count = 0

            for w_idx, (word_id, word_str) in enumerate(words):
                if w_idx < mastery_count:
                    # mastered
                    is_correct = 1
                    secs = random.randint(3, 12)
                elif idx % 4 != 3 and random.random() < 0.4:
                    # attempted but incorrect
                    is_correct = 0
                    secs = random.randint(8, 25)
                else:
                    # unattempted
                    continue

                ts = (now - timedelta(hours=random.randint(1, 72), minutes=random.randint(0, 59))).isoformat()
                log_rows.append((
                    'WORD',
                    None,
                    'VOCAB',
                    is_correct,
                    secs,
                    '{}',
                    ts,
                    user_id,
                    word_id
                ))

    cur.executemany("""
        INSERT INTO platform_core_studylog (
            item_type, question_id, section, is_correct, seconds_spent, metadata, created_at, user_id, word_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, log_rows)

    conn.commit()
    conn.close()
    print(f"Seeded {len(log_rows)} demonstration study logs.")

if __name__ == "__main__":
    seed_logs()
