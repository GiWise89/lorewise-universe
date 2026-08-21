ALTER TABLE `subscriptions` ADD `order_id` text REFERENCES orders(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX `subscriptions_order_id_unique` ON `subscriptions` (`order_id`);
