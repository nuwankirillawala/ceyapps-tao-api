import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CommentsService } from './comments.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/comments',
})
export class CommentsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // socketId -> userId

  constructor(
    private readonly commentsService: CommentsService,
    private readonly jwtService: JwtService,
  ) {
    console.log('CommentsGateway initialized with JWT secret:', process.env.JWT_SECRET ? 'Set' : 'Not set');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Try multiple ways to get the token
      console.log(client)
      let token = client.handshake.auth?.token;
      
      if (!token) {
        const authHeader = client.handshake.headers?.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.replace('Bearer ', '');
        }
      }
      
      if (!token) {
        console.log('No token provided in WebSocket connection');
        client.disconnect();
        return;
      }

      console.log('Attempting to verify token:', token.substring(0, 20) + '...');
      
      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      client.user = {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        role: payload.role,
      };

      this.connectedUsers.set(client.id, client.userId);
      console.log(client.id, client.userId)
      console.log(`User ${client.user.name} connected to comments gateway`);
    } catch (error) {
      console.error('Authentication failed:', error);
      console.error('Token received:', client.handshake.auth?.token ? 'Yes' : 'No');
      console.error('Auth header:', client.handshake.headers?.authorization ? 'Yes' : 'No');
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.user) {
      console.log(`User ${client.user.name} disconnected from comments gateway`);
    }
    this.connectedUsers.delete(client.id);
  }

  @SubscribeMessage('join_lesson')
  async handleJoinLesson(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { lessonId: string },
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    const { lessonId } = data;
    await client.join(`lesson_${lessonId}`);
    
    console.log(`User ${client.user.name} joined lesson ${lessonId}`);
    return { success: true, lessonId };
  }

  @SubscribeMessage('leave_lesson')
  async handleLeaveLesson(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { lessonId: string },
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    const { lessonId } = data;
    await client.leave(`lesson_${lessonId}`);
    
    console.log(`User ${client.user.name} left lesson ${lessonId}`);
    return { success: true, lessonId };
  }

  @SubscribeMessage('new_comment')
  async handleNewComment(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { lessonId: string; content: string },
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    try {
      const comment = await this.commentsService.createComment({
        lessonId: data.lessonId,
        userId: client.userId,
        content: data.content,
      });

      // Broadcast to all users in the lesson room
      const roomName = `lesson_${data.lessonId}`;
      console.log(`Broadcasting comment_added to room: ${roomName}`);
      console.log('Comment data:', {
        id: comment.id,
        content: comment.content,
        lessonId: comment.lessonId,
        userId: comment.userId,
        user: comment.user
      });
      
      this.server.to(roomName).emit('comment_added', {
        comment: {
          id: comment.id,
          content: comment.content,
          lessonId: comment.lessonId,
          userId: comment.userId,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          isActive: comment.isActive,
          user: {
            id: comment.user.id,
            name: comment.user.name,
            profileImage: comment.user.profileImage || null,
          },
          replies: comment.replies || [],
        },
      });

      return { success: true, comment };
    } catch (error) {
      console.error('Error creating comment:', error);
      return { error: 'Failed to create comment' };
    }
  }

  @SubscribeMessage('new_reply')
  async handleNewReply(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { commentId: string; content: string; lessonId: string },
  ) {
    console.log('Received new_reply event:', { data, userId: client.userId, userName: client.user?.name });
    
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    try {
      const reply = await this.commentsService.createReply({
        commentId: data.commentId,
        userId: client.userId,
        content: data.content,
        email: client.user.email,
      });

      console.log('Created reply:', reply);

      // Broadcast to all users in the lesson room
      const roomName = `lesson_${data.lessonId}`;
      console.log(`Broadcasting reply_added to room: ${roomName}`);
      console.log('Reply data:', {
        id: reply.id,
        content: reply.content,
        commentId: reply.commentId,
        userId: reply.userId,
        user: reply.user
      });
      
      this.server.to(roomName).emit('reply_added', {
        reply: {
          id: reply.id,
          content: reply.content,
          commentId: reply.commentId,
          userId: reply.userId,
          createdAt: reply.createdAt,
          updatedAt: reply.updatedAt,
          isActive: reply.isActive,
          user: {
            id: reply.user.id,
            name: reply.user.name,
            profileImage: reply.user.profileImage || null,
          },
        },
      });

      return { success: true, reply };
    } catch (error) {
      console.error('Error creating reply:', error);
      return { error: 'Failed to create reply' };
    }
  }

  @SubscribeMessage('get_comments')
  async handleGetComments(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { lessonId: string; page?: number; limit?: number },
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    try {
      const response = await this.commentsService.getCommentsByLesson(
        data.lessonId,
        data.page || 1,
        data.limit || 20,
      );

      client.emit('comments_loaded', { comments: response.comments });
      return { success: true, comments: response.comments };
    } catch (error) {
      console.error('Error fetching comments:', error);
      return { error: 'Failed to fetch comments' };
    }
  }

  // Method to broadcast comment updates to specific lesson
  broadcastCommentUpdate(lessonId: string, comment: any) {
    this.server.to(`lesson_${lessonId}`).emit('comment_updated', { comment });
  }

  // Method to broadcast reply updates to specific lesson
  broadcastReplyUpdate(lessonId: string, reply: any) {
    this.server.to(`lesson_${lessonId}`).emit('reply_updated', { reply });
  }

  // Method to broadcast comment deletion to specific lesson
  broadcastCommentDeletion(lessonId: string, commentId: string) {
    this.server.to(`lesson_${lessonId}`).emit('comment_deleted', { commentId });
  }

  // Method to broadcast reply deletion to specific lesson
  broadcastReplyDeletion(lessonId: string, replyId: string) {
    this.server.to(`lesson_${lessonId}`).emit('reply_deleted', { replyId });
  }
}
