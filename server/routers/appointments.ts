import { z } from "zod";
import {
  publicProcedure,
  protectedProcedure,
  adminProcedure,
  router,
} from "../_core/trpc";
import * as db from "../db";
import { appointments, providers } from "../../drizzle/schema";
import { eq, and, desc, asc, gte, lte, inArray, ilike, or } from "drizzle-orm";

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const appointmentsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        providerId: z.string(),
        clientName: z.string(),
        clientPhone: z.string(),
        serviceId: z.string().optional(),
        serviceName: z.string(),
        price: z.number().optional(),
        date: z.string(), // YYYY-MM-DD
        startTime: z.string(), // HH:MM
        endTime: z.string(), // HH:MM
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("DB_UNAVAILABLE");

      // Verify availability to prevent double-booking
      const existing = await dbInstance
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.providerId, input.providerId),
            eq(appointments.date, input.date),
            eq(appointments.startTime, input.startTime),
          ),
        );
      
      const activeExisting = existing.filter(a => a.status === "pending" || a.status === "confirmed");
      if (activeExisting.length > 0) {
        throw new Error("SLOT_UNAVAILABLE");
      }

      console.log("[AGENDA-DEBUG] Backend recebeu date:", input.date);
      const appointmentId = uid();
      
      const insertData = {
        id: appointmentId,
        providerId: input.providerId,
        userId: ctx.user.openId,
        clientName: input.clientName,
        clientPhone: input.clientPhone,
        serviceId: input.serviceId,
        serviceName: input.serviceName,
        price: input.price,
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
        status: "pending" as const,
      };
      
      console.log("[AGENDA-DEBUG] Valor antes do INSERT:", insertData.date);
      await dbInstance.insert(appointments).values(insertData);
      
      // Consultando de volta para ver o valor exato no banco!
      const verify = await dbInstance.select().from(appointments).where(eq(appointments.id, appointmentId)).limit(1);
      console.log("[AGENDA-DEBUG] Valor salvo (verificado no banco):", verify[0]?.date);

      return { success: true, id: appointmentId };
    }),

  blockSlot: protectedProcedure
    .input(
      z.object({
        providerId: z.string(),
        date: z.string(), // YYYY-MM-DD
        startTime: z.string(), // HH:MM
        endTime: z.string(), // HH:MM
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("DB_UNAVAILABLE");

      const appointmentId = uid();
      await dbInstance.insert(appointments).values({
        id: appointmentId,
        providerId: input.providerId,
        userId: ctx.user.openId,
        clientName: "Bloqueio Manual",
        clientPhone: "-",
        serviceName: input.reason || "Bloqueio Administrativo",
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
        status: "blocked",
      });
      return { success: true, id: appointmentId };
    }),

  getByProvider: protectedProcedure
    .input(
      z.object({
        dateStart: z.string().optional(),
        dateEnd: z.string().optional(),
        search: z.string().optional(),
        statusFilter: z.array(z.string()).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) return [];

      const provider = await dbInstance
        .select()
        .from(providers)
        .where(eq(providers.userId, ctx.user.openId))
        .limit(1);

      if (provider.length === 0) return [];
      
      let conditions = [eq(appointments.providerId, provider[0].id)];
      if (input.dateStart) conditions.push(gte(appointments.date, input.dateStart));
      if (input.dateEnd) conditions.push(lte(appointments.date, input.dateEnd));
      if (input.statusFilter && input.statusFilter.length > 0) {
        conditions.push(inArray(appointments.status, input.statusFilter));
      }
      if (input.search) {
        const searchTerm = `%${input.search}%`;
        conditions.push(
          or(
            ilike(appointments.clientName, searchTerm),
            ilike(appointments.clientPhone, searchTerm),
            ilike(appointments.serviceName, searchTerm)
          )!
        );
      }

      return dbInstance
        .select()
        .from(appointments)
        .where(and(...conditions))
        .orderBy(asc(appointments.date), asc(appointments.startTime));
    }),

  updateNotes: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        notes: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("DB_UNAVAILABLE");
      
      const appts = await dbInstance
        .select()
        .from(appointments)
        .where(eq(appointments.id, input.id));
      if (appts.length === 0) throw new Error("NOT_FOUND");
      
      const provider = await dbInstance
        .select()
        .from(providers)
        .where(eq(providers.id, appts[0].providerId));
        
      const isProvider = provider.length > 0 && provider[0].userId === ctx.user.openId;
      if (!isProvider) throw new Error("UNAUTHORIZED");
      
      await dbInstance
        .update(appointments)
        .set({ notes: input.notes, updatedAt: new Date() })
        .where(eq(appointments.id, input.id));
        
      return { success: true };
    }),

  getByUser: protectedProcedure.query(async ({ ctx }) => {
    const dbInstance = await db.getDb();
    if (!dbInstance) return [];

    return dbInstance
      .select({
        appointment: appointments,
        provider: {
          id: providers.id,
          name: providers.name,
          category: providers.category,
          avatarUri: providers.avatarUri,
        }
      })
      .from(appointments)
      .leftJoin(providers, eq(appointments.providerId, providers.id))
      .where(eq(appointments.userId, ctx.user.openId))
      .orderBy(desc(appointments.date), desc(appointments.startTime));
  }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["pending", "confirmed", "completed", "canceled", "rescheduled"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("DB_UNAVAILABLE");
      
      const appts = await dbInstance
        .select()
        .from(appointments)
        .where(eq(appointments.id, input.id));
      if (appts.length === 0) throw new Error("NOT_FOUND");
      
      // Ensure user owns the provider or is the client cancelling
      const provider = await dbInstance
        .select()
        .from(providers)
        .where(eq(providers.id, appts[0].providerId));
        
      const isProvider = provider.length > 0 && provider[0].userId === ctx.user.openId;
      const isClient = appts[0].userId === ctx.user.openId;
      
      if (!isProvider && !isClient) throw new Error("UNAUTHORIZED");
      
      await dbInstance
        .update(appointments)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(appointments.id, input.id));
        
      return { success: true };
    }),

  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("DB_UNAVAILABLE");
      
      const appts = await dbInstance
        .select()
        .from(appointments)
        .where(eq(appointments.id, input.id));
      if (appts.length === 0) throw new Error("NOT_FOUND");
      
      // Ensure user owns the provider
      const provider = await dbInstance
        .select()
        .from(providers)
        .where(eq(providers.id, appts[0].providerId));
        
      const isProvider = provider.length > 0 && provider[0].userId === ctx.user.openId;
      
      if (!isProvider) throw new Error("UNAUTHORIZED");
      
      await dbInstance
        .delete(appointments)
        .where(eq(appointments.id, input.id));
        
      return { success: true };
    }),

  reschedule: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        newDate: z.string(), // YYYY-MM-DD
        newStartTime: z.string(), // HH:MM
        newEndTime: z.string(), // HH:MM
      })
    )
    .mutation(async ({ input, ctx }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("DB_UNAVAILABLE");

      const appts = await dbInstance
        .select()
        .from(appointments)
        .where(eq(appointments.id, input.id));
      if (appts.length === 0) throw new Error("NOT_FOUND");

      const provider = await dbInstance
        .select()
        .from(providers)
        .where(eq(providers.id, appts[0].providerId));
        
      const isProvider = provider.length > 0 && provider[0].userId === ctx.user.openId;
      if (!isProvider) throw new Error("UNAUTHORIZED");

      // Check slot availability
      const existing = await dbInstance
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.providerId, appts[0].providerId),
            eq(appointments.date, input.newDate),
            eq(appointments.startTime, input.newStartTime),
          ),
        );
      
      const activeExisting = existing.filter(a => (a.status === "pending" || a.status === "confirmed") && a.id !== input.id);
      if (activeExisting.length > 0) {
        throw new Error("SLOT_UNAVAILABLE");
      }

      await dbInstance
        .update(appointments)
        .set({ 
          date: input.newDate,
          startTime: input.newStartTime,
          endTime: input.newEndTime,
          status: "pending", 
          updatedAt: new Date() 
        })
        .where(eq(appointments.id, input.id));
        
      return { success: true };
    }),

  getAvailableSlots: publicProcedure
    .input(
      z.object({
        providerId: z.string(),
        date: z.string(), // YYYY-MM-DD
        serviceDuration: z.number().default(30), // Duration in minutes
      }),
    )
    .query(async ({ input }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) return [];

      const providerRes = await dbInstance
        .select({ scheduleSettings: providers.scheduleSettings })
        .from(providers)
        .where(eq(providers.id, input.providerId))
        .limit(1);

      if (providerRes.length === 0) return [];
      const settings = providerRes[0].scheduleSettings as any;
      if (!settings || !settings.workingDays) return [];

      const targetDateStr = input.date;
      if (settings.unavailableDates && settings.unavailableDates.includes(targetDateStr)) {
        return [];
      }
      if (settings.vacationStart && settings.vacationEnd) {
        if (targetDateStr >= settings.vacationStart && targetDateStr <= settings.vacationEnd) {
          return [];
        }
      }

      // Parse date to find day of week
      const targetDate = new Date(`${input.date}T12:00:00Z`);
      const dayOfWeek = targetDate.getUTCDay(); // 0 is Sunday

      const dayConfig = settings.workingDays.find((d: any) => d.day === dayOfWeek);
      if (!dayConfig || !dayConfig.isOpen) return [];

      // Format: "HH:MM"
      const { open, close, lunchStart, lunchEnd } = dayConfig;
      if (!open || !close) return [];

      const parseTime = (t: string) => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
      };
      const formatTime = (mins: number) => {
        const h = Math.floor(mins / 60).toString().padStart(2, "0");
        const m = (mins % 60).toString().padStart(2, "0");
        return `${h}:${m}`;
      };

      const startMin = parseTime(open);
      const closeMin = parseTime(close);
      const slotInt = settings.slotInterval || 30; // 30 mins default interval
      const duration = input.serviceDuration || slotInt;

      let slots: { start: string; end: string }[] = [];

      for (let time = startMin; time + duration <= closeMin; time += slotInt) {
        if (lunchStart && lunchEnd) {
          const lStart = parseTime(lunchStart);
          const lEnd = parseTime(lunchEnd);
          // If the slot overlaps with lunch break, skip
          if ((time >= lStart && time < lEnd) || (time + duration > lStart && time + duration <= lEnd) || (time <= lStart && time + duration >= lEnd)) {
            continue;
          }
        }
        slots.push({
          start: formatTime(time),
          end: formatTime(time + duration),
        });
      }

      // Filter out existing appointments
      const existing = await dbInstance
        .select({ startTime: appointments.startTime, endTime: appointments.endTime, status: appointments.status })
        .from(appointments)
        .where(
          and(
            eq(appointments.providerId, input.providerId),
            eq(appointments.date, input.date),
          ),
        );

      const activeExisting = existing.filter(a => a.status === "pending" || a.status === "confirmed" || a.status === "blocked");

      const maxSimultaneous = settings.maxSimultaneous || 1;

      // Math for overlap: Math.max(start1, start2) < Math.min(end1, end2)
      return slots.filter((slot) => {
        const sStart = parseTime(slot.start);
        const sEnd = parseTime(slot.end);
        
        let overlapCount = 0;
        for (const ex of activeExisting) {
          const eStart = parseTime(ex.startTime);
          const eEnd = parseTime(ex.endTime);
          
          if (Math.max(sStart, eStart) < Math.min(sEnd, eEnd)) {
            overlapCount++;
          }
        }
        return overlapCount < maxSimultaneous;
      });
    }),
});
