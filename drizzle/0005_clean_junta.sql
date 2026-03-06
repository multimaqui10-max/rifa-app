ALTER TABLE `raffleConfig` ADD `drawStatus` enum('pending','completed','extended') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `raffleConfig` ADD `winnerNumber` int;--> statement-breakpoint
ALTER TABLE `raffleConfig` ADD `winnerParticipantId` int;--> statement-breakpoint
ALTER TABLE `raffleConfig` ADD `drawnAt` timestamp;