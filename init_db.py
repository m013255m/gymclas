
import sqlite3

def init_db():
    conn = sqlite3.connect('gym_management.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            email TEXT NOT NULL,
            approved INTEGER DEFAULT 0
        )
    ''')
    conn.commit()
    conn.close()

init_db()
