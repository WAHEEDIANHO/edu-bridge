import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { DbEntity } from '../../utils/abstract/database/db-entity';
import { IEntity } from '../../utils/abstract/database/i-enity';
import { User } from '../../user/entities/user.entity';

@Entity("tbl_messages")
export class Message extends DbEntity implements IEntity{

  @Column({ type: "uuid" })
  senderId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "senderId" })
  sender: User;

  @Column({ type: "uuid" })
  receiverId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "receiverId" })
  receiver: User;

  @Column({ type: 'uuid', nullable: true })
  replyMessageId?: string;

  @ManyToOne(() => Message, { nullable: true })
  @JoinColumn({ name: 'replyMessageId' })
  replyMessage?: Message;


  @Column({ type: "text", nullable: true })
  text: string;

  @Column({ type: "varchar", nullable: true })
  fileUrl?: string;

  @Column({ default: false })
  isDelivered: boolean;

  @Column({ default: false })
  isRead: boolean;

  @Column()
  conversationId: string;


  static generateConversationId(user1: string, user2: string): string {
    return user1 < user2
      ? `${user1}_${user2}`
      : `${user2}_${user1}`;
  }

}
