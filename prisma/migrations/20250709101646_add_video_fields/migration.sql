-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "demoVideoDuration" INTEGER,
ADD COLUMN     "demoVideoId" TEXT,
ADD COLUMN     "demoVideoThumbnail" TEXT,
ADD COLUMN     "demoVideoUrl" TEXT;

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "videoDuration" INTEGER,
ADD COLUMN     "videoId" TEXT,
ADD COLUMN     "videoThumbnail" TEXT,
ADD COLUMN     "videoUrl" TEXT;
