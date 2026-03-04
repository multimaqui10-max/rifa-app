CREATE TABLE `participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prizes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`position` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`value` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prizes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `raffleConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`raffleTitle` varchar(255) NOT NULL DEFAULT 'Mi Rifa',
	`raffleDescription` text,
	`numberPrice` decimal(10,2) NOT NULL,
	`drawDate` timestamp NOT NULL,
	`drawTime` varchar(5),
	`totalNumbers` int NOT NULL DEFAULT 1000,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `raffleConfig_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `raffleNumbers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`number` int NOT NULL,
	`status` enum('available','reserved','sold') NOT NULL DEFAULT 'available',
	`reservedAt` timestamp,
	`reservationExpiresAt` timestamp,
	`soldAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `raffleNumbers_id` PRIMARY KEY(`id`),
	CONSTRAINT `raffleNumbers_number_unique` UNIQUE(`number`)
);
--> statement-breakpoint
CREATE TABLE `reservations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`raffleNumberId` int NOT NULL,
	`sessionId` varchar(255) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reservations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`participantId` int NOT NULL,
	`raffleNumberId` int NOT NULL,
	`stripePaymentIntentId` varchar(255),
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`paymentMethod` varchar(50),
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `transactions_stripePaymentIntentId_unique` UNIQUE(`stripePaymentIntentId`)
);
