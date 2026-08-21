ALTER TABLE `orders` ADD `stripe_refund_id` text;
ALTER TABLE `orders` ADD `refunded_at` text;
CREATE UNIQUE INDEX `orders_stripe_refund_id_unique` ON `orders` (`stripe_refund_id`);
