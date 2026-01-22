import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as Y from 'yjs';

interface Room {
  doc: Y.Doc;
  connections: Set<Socket>;
}

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
})
export class YjsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private rooms: Map<string, Room> = new Map();

  handleConnection(client: Socket) {
    console.log(`🔗 Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`🔌 Client disconnected: ${client.id}`);

    // Clean up room connections
    this.rooms.forEach((room, roomId) => {
      room.connections.delete(client);

      // If room is empty, clean it up
      if (room.connections.size === 0) {
        this.rooms.delete(roomId);
        console.log(`🧹 Cleaned up empty room: ${roomId}`);
      }
    });
  }

  private getOrCreateRoom(roomId: string): Room {
    if (!this.rooms.has(roomId)) {
      const doc = new Y.Doc();
      this.rooms.set(roomId, {
        doc,
        connections: new Set(),
      });
      console.log(`📝 Created new room: ${roomId}`);
    }
    return this.rooms.get(roomId)!;
  }

  // Handle client joining a room
  @SubscribeMessage('join-room')
  handleJoinRoom(client: Socket, roomId: string) {
    const room = this.getOrCreateRoom(roomId);
    room.connections.add(client);

    // Send current document state to the new client
    const state = Y.encodeStateAsUpdate(room.doc);
    client.emit('sync-state', state);

    console.log(`👥 Client ${client.id} joined room ${roomId} (${room.connections.size} total)`);

    // Listen for updates from this client
    client.on('update', (update: Uint8Array) => {
      // Apply update to the room's Y.Doc
      Y.applyUpdate(room.doc, new Uint8Array(update));

      // Broadcast to all other clients in the room
      room.connections.forEach((conn) => {
        if (conn.id !== client.id) {
          conn.emit('update', update);
        }
      });
    });

    // Handle awareness (cursor positions, user presence, etc.)
    client.on('awareness', (awareness: any) => {
      room.connections.forEach((conn) => {
        if (conn.id !== client.id) {
          conn.emit('awareness', awareness);
        }
      });
    });
  }
}
