"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { events, pendaftaranEvent, users } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { DEFAULT_EVENTS, isEventActive } from "@/app/event/page";

function parsePositiveInteger(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isInteger(value) && value > 0 ? value : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    const parsed = Number(trimmed);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      return null;
    }

    return parsed;
  }

  return null;
}

async function ensureEventRecord(eventId: number) {
  const normalizedEventId = parsePositiveInteger(eventId);

  if (normalizedEventId === null) {
    return null;
  }

  const [existingEvent] = await getDb()
    .select()
    .from(events)
    .where(eq(events.idEvent, normalizedEventId))
    .limit(1);

  if (!existingEvent) {
    return null;
  }

  return isEventActive(existingEvent as Record<string, unknown>)
    ? existingEvent
    : null;
}

function readNestedErrorValue(error: unknown, key: string): string {
  const seen = new Set<unknown>();

  const walk = (value: unknown): string => {
    if (!value || typeof value !== "object") {
      return "";
    }

    if (seen.has(value)) {
      return "";
    }
    seen.add(value);

    const record = value as Record<string, unknown>;
    if (key in record && typeof record[key] === "string") {
      return record[key] as string;
    }

    if (typeof record.cause !== "undefined") {
      const nested = walk(record.cause);
      if (nested) return nested;
    }

    if (typeof record.original !== "undefined") {
      const nested = walk(record.original);
      if (nested) return nested;
    }

    return "";
  };

  return walk(error);
}

export async function registerForEvent(input: { eventId: number | string }) {
  const session = await auth();

  if (!session?.user?.idUser) {
    return {
      ok: false,
      error: "Silakan login terlebih dahulu untuk mendaftar event.",
    };
  }

  const eventId = Number(input.eventId);
  const userId = Number(session.user.idUser);

  if (!Number.isInteger(eventId) || eventId <= 0) {
    return {
      ok: false,
      error: "ID event tidak valid.",
    };
  }

  try {
    const resolvedEvent = await ensureEventRecord(eventId);

    if (!resolvedEvent) {
      return {
        ok: false,
        error: "Event tidak ditemukan.",
      };
    }

    const [existingRegistration] = await getDb()
      .select()
      .from(pendaftaranEvent)
      .where(
        and(
          eq(pendaftaranEvent.eventId, eventId),
          eq(pendaftaranEvent.userId, userId),
        ),
      )
      .limit(1);

    if (existingRegistration) {
      return {
        ok: true,
        message: "Anda sudah terdaftar pada event ini.",
        idPendaftaran: existingRegistration.idPendaftaran,
        eventId: resolvedEvent.idEvent,
        eventName: resolvedEvent.namaEvent,
      };
    }

    const [result] = await getDb()
      .insert(pendaftaranEvent)
      .values({
        eventId,
        userId,
      })
      .returning({
        idPendaftaran: pendaftaranEvent.idPendaftaran,
      });

    return {
      ok: true,
      message: "Pendaftaran berhasil disimpan.",
      idPendaftaran: result.idPendaftaran,
      eventId: resolvedEvent.idEvent,
      eventName: resolvedEvent.namaEvent,
    };
  } catch (error: unknown) {
    const code = readNestedErrorValue(error, "code");
    const constraint = readNestedErrorValue(error, "constraint");
    const detail = readNestedErrorValue(error, "detail");
    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan saat menyimpan pendaftaran event.";
    const lowerMessage = message.toLowerCase();

    const isDuplicateRegistration =
      code === "23505" ||
      constraint.toLowerCase().includes("pendaftaran_event") ||
      detail.toLowerCase().includes("pendaftaran_event") ||
      lowerMessage.includes("duplicate key") ||
      lowerMessage.includes("pendaftaran_event");

    if (isDuplicateRegistration) {
      const [existingRegistration] = await getDb()
        .select()
        .from(pendaftaranEvent)
        .where(
          and(
            eq(pendaftaranEvent.eventId, eventId),
            eq(pendaftaranEvent.userId, userId),
          ),
        )
        .limit(1);

      if (existingRegistration) {
        return {
          ok: true,
          message: "Anda sudah terdaftar pada event ini.",
          idPendaftaran: existingRegistration.idPendaftaran,
          eventId,
          eventName: DEFAULT_EVENTS[eventId]?.nama_event ?? "Event",
        };
      }

      return {
        ok: false,
        error: "Anda sudah terdaftar pada event ini.",
      };
    }

    console.error("Register event error:", {
      code,
      constraint,
      detail,
      message,
      error,
    });

    return {
      ok: false,
      error: "Terjadi kesalahan saat memproses pendaftaran. Silakan coba lagi.",
    };
  }
}

export async function confirmEventRegistration(formData: FormData) {
  const rawEventId = formData.get("id_event");
  const numericEventId = parsePositiveInteger(rawEventId);

  if (numericEventId === null) {
    redirect(`/event?error=${encodeURIComponent("ID event tidak valid.")}`);
  }

  const session = await auth();
  const userId = Number(session?.user?.idUser ?? 0);

  if (userId <= 0) {
    redirect("/auth/login");
  }

  const result = await registerForEvent({ eventId: numericEventId });

  if (result?.ok && result.idPendaftaran) {
    redirect(`/event/bukti/${result.idPendaftaran}`);
  }

  redirect(
    `/event/checkout/${numericEventId}?error=${encodeURIComponent(result?.error ?? "Pendaftaran gagal. Silakan coba lagi.")}`,
  );
}

export async function getRegistrationProof(idPendaftaran: number | string) {
  const session = await auth();

  if (!session?.user?.idUser) {
    return {
      ok: false,
      error: "Silakan login terlebih dahulu.",
    };
  }

  const registrationId = Number(idPendaftaran);
  const userId = Number(session.user.idUser);

  if (!Number.isInteger(registrationId) || registrationId <= 0) {
    return {
      ok: false,
      error: "ID bukti tidak valid.",
    };
  }

  const [row] = await getDb()
    .select({
      idPendaftaran: pendaftaranEvent.idPendaftaran,
      tanggalDaftar: pendaftaranEvent.tanggalDaftar,
      userId: pendaftaranEvent.userId,
      namaPelanggan: users.namaPelanggan,
      email: users.email,
      nomorTelp: users.nomorTelp,
      eventId: events.idEvent,
      namaEvent: events.namaEvent,
      jenisEvent: events.jenisEvent,
      tanggalPelaksanaan: events.tanggalPelaksanaan,
      biayaEvent: events.biayaEvent,
    })
    .from(pendaftaranEvent)
    .innerJoin(events, eq(events.idEvent, pendaftaranEvent.eventId))
    .innerJoin(users, eq(users.idUser, pendaftaranEvent.userId))
    .where(
      and(
        eq(pendaftaranEvent.idPendaftaran, registrationId),
        eq(pendaftaranEvent.userId, userId),
      ),
    )
    .limit(1);

  if (!row) {
    return {
      ok: false,
      error: "Bukti pendaftaran tidak ditemukan.",
    };
  }

  return {
    ok: true,
    registration: row,
  };
}
