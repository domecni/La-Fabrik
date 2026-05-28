from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from uuid import uuid4

from fastapi import WebSocket


@dataclass
class ClientConnection:
    id: str
    websocket: WebSocket
    is_processing: bool = False
    last_frame_at: float = 0.0


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[str, ClientConnection] = {}

    @property
    def count(self) -> int:
        return len(self._connections)

    async def connect(self, websocket: WebSocket) -> ClientConnection:
        await websocket.accept()
        connection = ClientConnection(id=str(uuid4()), websocket=websocket)
        self._connections[connection.id] = connection
        return connection

    def disconnect(self, connection: ClientConnection) -> None:
        self._connections.pop(connection.id, None)

    async def send(self, connection: ClientConnection, payload: dict[str, Any]) -> None:
        await connection.websocket.send_json(payload)
