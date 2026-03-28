-- CreateTable
CREATE TABLE "queue" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT,
    "authorImage" TEXT,
    "submissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER NOT NULL,
    "discordGuildId" TEXT NOT NULL,

    CONSTRAINT "queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guilds" (
    "id" TEXT NOT NULL,
    "busyUntil" TIMESTAMP(3),
    "defaultMediaTime" INTEGER,
    "maxMediaTime" INTEGER,
    "displayMediaFull" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "guilds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "queue_type_idx" ON "queue"("type");

-- CreateIndex
CREATE INDEX "queue_discordGuildId_executionDate_idx" ON "queue"("discordGuildId", "executionDate");

-- AddForeignKey
ALTER TABLE "queue" ADD CONSTRAINT "queue_discordGuildId_fkey" FOREIGN KEY ("discordGuildId") REFERENCES "guilds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
