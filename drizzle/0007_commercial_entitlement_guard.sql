CREATE UNIQUE INDEX `entitlements_customer_resource_unique`
ON `entitlements` (`customer_id`, `resource_type`, `resource_code`);
