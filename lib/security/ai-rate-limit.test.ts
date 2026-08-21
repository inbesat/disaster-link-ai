import { describe, expect, it } from "vitest";
import {
  checkAiChatRateLimit,
  checkAiPlanRateLimit,
  checkAiTranslateRateLimit,
  logAiUsage,
  aiUsageLogs,
} from "./ai-rate-limit";

describe("AI Rate Limiting & Usage Logging", () => {
  it("allows 20 chat messages per user per 5 minutes then limits", () => {
    const user = "test_user_chat_1";
    for (let i = 0; i < 20; i++) {
      const res = checkAiChatRateLimit(user);
      expect(res.allowed).toBe(true);
    }

    const blocked = checkAiChatRateLimit(user);
    expect(blocked.allowed).toBe(false);
    expect(blocked.message).toContain("AI assistant is busy");
  });

  it("allows 5 plan generations per user per 15 minutes and keeps buckets independent across actions", () => {
    const user = "test_user_plan_1";
    for (let i = 0; i < 5; i++) {
      const res = checkAiPlanRateLimit(user);
      expect(res.allowed).toBe(true);
    }

    const blocked = checkAiPlanRateLimit(user);
    expect(blocked.allowed).toBe(false);

    // Chat requests for the same user should still be allowed under chat's independent bucket
    const chatRes = checkAiChatRateLimit(user);
    expect(chatRes.allowed).toBe(true);
  });

  it("allows 50 translations per user per hour", () => {
    const user = "test_user_trans_1";
    for (let i = 0; i < 50; i++) {
      const res = checkAiTranslateRateLimit(user);
      expect(res.allowed).toBe(true);
    }

    const blocked = checkAiTranslateRateLimit(user);
    expect(blocked.allowed).toBe(false);
  });

  it("bypasses rate limit in demo mode with simulated indicator", () => {
    const user = "demo_user_1";
    const res = checkAiChatRateLimit(user, true);
    expect(res.allowed).toBe(true);
    expect(res.demoMode).toBe(true);
    expect(res.message).toBe("Demo mode: AI responses are simulated");
  });

  it("records AI usage logs", () => {
    logAiUsage("user_101", "chat", 120);
    const last = aiUsageLogs[aiUsageLogs.length - 1];
    expect(last.userId).toBe("user_101");
    expect(last.action).toBe("chat");
    expect(last.tokensUsed).toBe(120);
  });
});
