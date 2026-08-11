
import sqlite3
import random
import string
from datetime import datetime
from loguru import logger
import os

class TrackingService:
    def __init__(self, db_path="/app/data/tracking.db"):
        # Garante que o diretório existe
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS links (
                    code TEXT PRIMARY KEY,
                    original_url TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    title TEXT
                )
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS clicks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    link_code TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    user_agent TEXT,
                    FOREIGN KEY(link_code) REFERENCES links(code)
                )
            """)

    def create_link(self, original_url: str, title: str = None) -> str:
        """Cria um link encurtado e retorna o código único (6 chars)"""
        if not original_url: return None
        
        # Gera código aleatório
        attempts = 0
        while attempts < 5:
            code = ''.join(random.choices(string.ascii_letters + string.digits, k=6))
            try:
                with sqlite3.connect(self.db_path) as conn:
                    conn.execute(
                        "INSERT INTO links (code, original_url, title) VALUES (?, ?, ?)",
                        (code, original_url, title)
                    )
                return code
            except sqlite3.IntegrityError:
                attempts += 1
                continue
            except Exception as e:
                logger.error(f"Erro ao criar link: {e}")
                return None
        return None

    def get_original_url(self, code: str) -> str:
        """Busca URL original pelo código"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute("SELECT original_url FROM links WHERE code = ?", (code,))
                row = cursor.fetchone()
                return row[0] if row else None
        except Exception:
            return None

    def register_click(self, code: str, user_agent: str = "unknown"):
        """Registra um clique no link"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute(
                    "INSERT INTO clicks (link_code, user_agent) VALUES (?, ?)",
                    (code, user_agent)
                )
        except Exception as e:
            logger.error(f"Erro ao registrar clique: {e}")
    # --- Stats ---

    def get_clicks_last_24h(self):
        """Retorna cliques agrupados por hora nas últimas 24h"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute("""
                    SELECT strftime('%Y-%m-%d %H:00', timestamp) as hour, COUNT(*)
                    FROM clicks
                    WHERE timestamp >= datetime('now', '-24 hours')
                    GROUP BY hour
                    ORDER BY hour
                """)
                return cursor.fetchall()
        except: return []

    def get_top_links(self, limit=5):
        """Retorna links com mais cliques"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute("""
                    SELECT l.title, l.code, COUNT(c.id) as count
                    FROM links l
                    JOIN clicks c ON l.code = c.link_code
                    GROUP BY l.code
                    ORDER BY count DESC
                    LIMIT ?
                """, (limit,))
                return cursor.fetchall()
        except: return []
    
    def get_total_clicks(self):
        try:
            with sqlite3.connect(self.db_path) as conn:
                res = conn.execute("SELECT COUNT(*) FROM clicks").fetchone()
                return res[0] if res else 0
        except: return 0

    def get_today_clicks(self):
        try:
            with sqlite3.connect(self.db_path) as conn:
                res = conn.execute("SELECT COUNT(*) FROM clicks WHERE date(timestamp) = date('now')").fetchone()
                return res[0] if res else 0
        except: return 0
