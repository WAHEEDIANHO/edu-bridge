import { IEntity } from './i-enity';
import {Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class DbEntity implements IEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({type: 'date', nullable: false})
  createdAt?: Date = new Date(Date.now());
  @Column({type: 'date', nullable: false})
  updatedAt?: Date = new Date(Date.now());
}