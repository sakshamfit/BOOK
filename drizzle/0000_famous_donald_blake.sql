CREATE TABLE `authors` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `members` (
	`user_id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`joined_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`book_id` text NOT NULL,
	`title` text NOT NULL,
	`quantity` integer NOT NULL,
	`price` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`book_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`status` text NOT NULL,
	`total` integer NOT NULL,
	`shipping` integer NOT NULL,
	`session_id` text,
	`session_url` text,
	`created_at` integer NOT NULL,
	`customer` text,
	`request_key` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_request_key_unique` ON `orders` (`request_key`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`stock` integer NOT NULL,
	`price` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shelves` (
	`user_id` text PRIMARY KEY NOT NULL,
	`book_ids` text NOT NULL
);
--> statement-breakpoint
CREATE TRIGGER reserve_stock_before_insert BEFORE INSERT ON order_items BEGIN
 SELECT CASE WHEN NEW.quantity < 1 OR NEW.quantity > 10 OR COALESCE((SELECT stock FROM products WHERE id=NEW.book_id),0)<NEW.quantity THEN RAISE(ABORT,'insufficient_stock') END;
END;
--> statement-breakpoint
CREATE TRIGGER reserve_stock_after_insert AFTER INSERT ON order_items BEGIN
 UPDATE products SET stock=stock-NEW.quantity WHERE id=NEW.book_id;
END;
