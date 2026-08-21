import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { logAuditEvent } from "@/lib/admin/audit-logger";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, confirmationPassword, emailConfirmation, isSoftDelete = true } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (!confirmationPassword || !emailConfirmation) {
      return NextResponse.json(
        { error: "Password confirmation and email confirmation are required for account deletion" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
    }

    if (user.email.toLowerCase() !== emailConfirmation.toLowerCase()) {
      return NextResponse.json({ error: "Confirmation email does not match account email" }, { status: 400 });
    }

    if (isSoftDelete) {
      // Soft deletion: Mark account as inactive / soft-deleted; data retained for 30 days recoverable
      await prisma.user.update({
        where: { id: userId },
        data: {
          isApproved: false,
          safetyStatus: "inactive_pending_deletion",
        },
      });

      await logAuditEvent({
        userId,
        action: "account_soft_deleted",
        resourceType: "user",
        resourceId: userId,
        severity: "warning",
        details: "Account marked inactive; scheduled for hard deletion after 30 days.",
      });

      return NextResponse.json({
        success: true,
        message: "Account deactivated. Data will be retained for 30 days during which account recovery is possible.",
      });
    }

    // Hard deletion: Cascade delete user data and anonymize references
    // 1. Delete family contacts
    await prisma.familyContact.deleteMany({
      where: { userId },
    });

    // 2. Delete chat sessions & messages
    const sessions = await prisma.chatSession.findMany({
      where: { userId },
      select: { id: true },
    });
    const sessionIds = sessions.map((s) => s.id);
    if (sessionIds.length > 0) {
      await prisma.chatMessage.deleteMany({
        where: { sessionId: { in: sessionIds } },
      });
      await prisma.chatSession.deleteMany({
        where: { userId },
      });
    }

    // 3. Anonymize user's crowdsourced reports / missing person records
    await prisma.missingPerson.updateMany({
      where: { reportedBy: userId },
      data: {
        reportedBy: null,
        contactName: "[ANONYMIZED_USER]",
        contactPhone: "[REDACTED]",
      },
    });

    // 4. Delete user record
    await prisma.user.delete({
      where: { id: userId },
    });

    await logAuditEvent({
      userId: null,
      action: "account_hard_deleted",
      resourceType: "user",
      resourceId: userId,
      severity: "critical",
      details: "User account and associated personal data permanently removed.",
    });

    return NextResponse.json({
      success: true,
      message: "Account and associated personal data permanently deleted.",
    });
  } catch (error) {
    console.error("[user-delete] error processing account deletion:", error);
    return NextResponse.json({ error: "Failed to process account deletion" }, { status: 500 });
  }
}
