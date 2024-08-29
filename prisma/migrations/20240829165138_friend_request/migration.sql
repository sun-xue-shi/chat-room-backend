-- CreateTable
CREATE TABLE `friendRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fromUserId` INTEGER NOT NULL,
    `toFriendId` INTEGER NOT NULL,
    `sayHello` VARCHAR(100) NOT NULL,
    `status` INTEGER NOT NULL,
    `createTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateTime` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
