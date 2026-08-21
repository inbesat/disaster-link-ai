import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  approximateLocation,
  purgeExpiredChatHistory,
  anonymizeOldCrowdsourcedReports,
  purgeExpiredDemoData,
} from "./data-minimization";
import { prisma } from "@/server/prisma";

vi.mock("@/server/prisma", () => ({
  prisma: {
    chatSession: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    chatMessage: {
      deleteMany: vi.fn(),
    },
    crowdsourcedReport: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    user: {
      deleteMany: vi.fn(),
    },
  },
}));

describe("lib/settings/data-minimization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("truncates exact GPS coordinates to approximate 1-decimal-place precision", () => {
    const approx = approximateLocation(25.594094, 85.137566);
    expect(approx.lat).toBe(25.6);
    expect(approx.lng).toBe(85.1);
  });

  it("purges chat history older than 30 days", async () => {
    vi.mocked(prisma.chatSession.findMany).mockResolvedValue([{ id: "session-1" }] as any);
    vi.mocked(prisma.chatMessage.deleteMany).mockResolvedValue({ count: 5 });
    vi.mocked(prisma.chatSession.deleteMany).mockResolvedValue({ count: 1 });

    const result = await purgeExpiredChatHistory(30);

    expect(result.purgedSessionsCount).toBe(1);
    expect(result.purgedMessagesCount).toBe(5);
    expect(prisma.chatSession.findMany).toHaveBeenCalled();
  });

  it("anonymizes crowdsourced reports older than 90 days", async () => {
    vi.mocked(prisma.crowdsourcedReport.findMany).mockResolvedValue([
      { id: "report-1", lat: 25.594094, lng: 85.137566 },
    ] as any);
    vi.mocked(prisma.crowdsourcedReport.update).mockResolvedValue({} as any);

    const count = await anonymizeOldCrowdsourcedReports(90);

    expect(count).toBe(1);
    expect(prisma.crowdsourcedReport.update).toHaveBeenCalledWith({
      where: { id: "report-1" },
      data: {
        lat: 25.6,
        lng: 85.1,
        rawText: "[ANONYMIZED_AFTER_90_DAYS]",
        imageUrl: null,
      },
    });
  });

  it("purges demo data older than 24 hours", async () => {
    vi.mocked(prisma.user.deleteMany).mockResolvedValue({ count: 3 });

    const purged = await purgeExpiredDemoData();

    expect(purged).toBe(3);
    expect(prisma.user.deleteMany).toHaveBeenCalled();
  });
});
