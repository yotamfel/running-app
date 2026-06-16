-- CreateTable
CREATE TABLE "PlanSession" (
    "id" TEXT NOT NULL,
    "monthNumber" INTEGER NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "dayLabel" TEXT NOT NULL,
    "plannedDate" TIMESTAMP(3) NOT NULL,
    "targetKm" DOUBLE PRECISION NOT NULL,
    "methodNote" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "linkedRunId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RunLog" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "durationMin" DOUBLE PRECISION NOT NULL,
    "paceMinPerKm" DOUBLE PRECISION NOT NULL,
    "feeling" INTEGER,
    "notes" TEXT,
    "planSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RunLog_pkey" PRIMARY KEY ("id")
);
