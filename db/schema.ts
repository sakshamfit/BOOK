import { sqliteTable,text,integer } from 'drizzle-orm/sqlite-core';
export const products=sqliteTable('products',{id:text('id').primaryKey(),data:text('data').notNull(),stock:integer('stock').notNull(),price:integer('price').notNull()});
export const authorRecords=sqliteTable('authors',{id:text('id').primaryKey(),data:text('data').notNull()});
export const settings=sqliteTable('settings',{id:text('id').primaryKey(),data:text('data').notNull()});
export const orders=sqliteTable('orders',{id:text('id').primaryKey(),userId:text('user_id').notNull(),email:text('email').notNull(),status:text('status').notNull(),total:integer('total').notNull(),shipping:integer('shipping').notNull(),sessionId:text('session_id'),sessionUrl:text('session_url'),createdAt:integer('created_at').notNull(),customer:text('customer'),requestKey:text('request_key').notNull().unique()});
export const orderItems=sqliteTable('order_items',{id:text('id').primaryKey(),orderId:text('order_id').notNull().references(()=>orders.id),bookId:text('book_id').notNull().references(()=>products.id),title:text('title').notNull(),quantity:integer('quantity').notNull(),price:integer('price').notNull()});
export const members=sqliteTable('members',{userId:text('user_id').primaryKey(),email:text('email').notNull(),joinedAt:integer('joined_at').notNull()});
export const shelves=sqliteTable('shelves',{userId:text('user_id').primaryKey(),bookIds:text('book_ids').notNull()});
