"""
Sistema de registro de mensagens enviadas
"""
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import List, Optional
from dataclasses import dataclass
from loguru import logger


@dataclass
class MessageRecord:
    """Registro de uma mensagem enviada"""
    id: int
    text: str
    sent_at: datetime
    status: str  # 'success' ou 'failed'
    error_message: Optional[str] = None


class MessageHistory:
    """Gerencia histórico de mensagens em SQLite"""
    
    def __init__(self, db_path: str = "/app/data/messages.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()
    
    def _init_db(self):
        """Inicializa o banco de dados"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    text TEXT NOT NULL,
                    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status TEXT NOT NULL,
                    error_message TEXT
                )
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_sent_at ON messages(sent_at DESC)
            """)
            conn.commit()
        logger.info(f"Banco de histórico inicializado: {self.db_path}")
    
    def add(self, text: str, status: str, error_message: Optional[str] = None) -> int:
        """
        Registra uma mensagem enviada
        
        Returns:
            ID do registro criado
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(
                "INSERT INTO messages (text, status, error_message) VALUES (?, ?, ?)",
                (text, status, error_message)
            )
            conn.commit()
            return cursor.lastrowid
    
    def get_recent(self, limit: int = 50) -> List[MessageRecord]:
        """Retorna as mensagens mais recentes"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                "SELECT * FROM messages ORDER BY sent_at DESC LIMIT ?",
                (limit,)
            )
            rows = cursor.fetchall()
            
        return [
            MessageRecord(
                id=row['id'],
                text=row['text'],
                sent_at=datetime.fromisoformat(row['sent_at']),
                status=row['status'],
                error_message=row['error_message']
            )
            for row in rows
        ]
    
    def get_stats(self) -> dict:
        """Retorna estatísticas de envio"""
        with sqlite3.connect(self.db_path) as conn:
            # Total
            total = conn.execute("SELECT COUNT(*) FROM messages").fetchone()[0]
            
            # Sucesso/Falha
            success = conn.execute(
                "SELECT COUNT(*) FROM messages WHERE status = 'success'"
            ).fetchone()[0]
            
            # Hoje
            today = conn.execute("""
                SELECT COUNT(*) FROM messages 
                WHERE date(sent_at) = date('now')
            """).fetchone()[0]
            
        return {
            "total": total,
            "success": success,
            "failed": total - success,
            "today": today
        }


# Instância global
message_history = MessageHistory()
