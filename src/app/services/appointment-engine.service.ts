import { Injectable, inject } from '@angular/core';
import { MockDatabaseService } from '../core/repositories/mock-database.service';
import { Doctor } from '../core/models/doctor.model';
import { Appointment } from '../core/models/appointment.model';

export interface TimeSlotOption {
  time: string; // "09:00", "09:30"
  label: string; // "09:00 ص", "02:30 م"
  isAvailable: boolean;
  reasonDisabled?: 'booked' | 'lunch' | 'vacation' | 'day_off' | 'past_time';
  reasonLabelAr?: string;
}

export interface DayAvailability {
  date: string; // YYYY-MM-DD
  isWorkingDay: boolean;
  isVacation: boolean;
  totalSlots: number;
  availableSlots: number;
  slots: TimeSlotOption[];
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentEngineService {
  private readonly db = inject(MockDatabaseService);

  /**
   * Generates time slots in 30-minute intervals for a specific doctor and date.
   */
  getDoctorAvailability(doctorId: string, dateStr: string): DayAvailability {
    const doctor = this.db.doctors.getById(doctorId);
    if (!doctor) {
      return {
        date: dateStr,
        isWorkingDay: false,
        isVacation: false,
        totalSlots: 0,
        availableSlots: 0,
        slots: []
      };
    }

    const targetDate = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, ...
    const isWorkingDay = doctor.workingDays.includes(dayOfWeek);
    const isVacation = doctor.vacationDays.includes(dateStr);

    if (!isWorkingDay || isVacation) {
      return {
        date: dateStr,
        isWorkingDay,
        isVacation,
        totalSlots: 0,
        availableSlots: 0,
        slots: []
      };
    }

    // Get existing appointments for this doctor on this date
    const existingAppointments = this.db.appointments.query(
      apt =>
        apt.doctorId === doctorId &&
        apt.date === dateStr &&
        apt.status !== 'cancelled'
    );

    const bookedSlotsSet = new Set(existingAppointments.map(a => a.timeSlot));

    // Generate slots
    const slots: TimeSlotOption[] = [];
    const [startH, startM] = doctor.shiftStart.split(':').map(Number);
    const [endH, endM] = doctor.shiftEnd.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    let lunchStartMinutes = -1;
    let lunchEndMinutes = -1;
    if (doctor.lunchInterval && doctor.lunchInterval.start && doctor.lunchInterval.end) {
      const [lunchStartH, lunchStartM] = doctor.lunchInterval.start.split(':').map(Number);
      const [lunchEndH, lunchEndM] = doctor.lunchInterval.end.split(':').map(Number);
      lunchStartMinutes = lunchStartH * 60 + lunchStartM;
      lunchEndMinutes = lunchEndH * 60 + lunchEndM;
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const isToday = dateStr === todayStr;
    const currentMinutesNow = now.getHours() * 60 + now.getMinutes();

    for (let m = startMinutes; m < endMinutes; m += (doctor.slotDurationMinutes || 30)) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      const timeSlotStr = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
      const label = this.formatArabicTime(h, min);

      // Check lunch interval collision
      const isLunch = lunchStartMinutes !== -1 && m >= lunchStartMinutes && m < lunchEndMinutes;

      // Check existing booking collision
      const isBooked = bookedSlotsSet.has(timeSlotStr);

      // Check past time if today
      const isPast = isToday && m <= currentMinutesNow + 15; // 15 min grace

      let isAvailable = true;
      let reasonDisabled: TimeSlotOption['reasonDisabled'];
      let reasonLabelAr: string | undefined;

      if (isLunch) {
        isAvailable = false;
        reasonDisabled = 'lunch';
        reasonLabelAr = 'استراحة الطبيب';
      } else if (isBooked) {
        isAvailable = false;
        reasonDisabled = 'booked';
        reasonLabelAr = 'محجوز مسبقاً';
      } else if (isPast) {
        isAvailable = false;
        reasonDisabled = 'past_time';
        reasonLabelAr = 'وقت منقضٍ';
      }

      slots.push({
        time: timeSlotStr,
        label,
        isAvailable,
        reasonDisabled,
        reasonLabelAr
      });
    }

    const availableSlots = slots.filter(s => s.isAvailable).length;

    return {
      date: dateStr,
      isWorkingDay: true,
      isVacation: false,
      totalSlots: slots.length,
      availableSlots,
      slots
    };
  }

  /**
   * Generates next unique ticket number for queue desk
   */
  generateTicketNumber(department: string): string {
    const prefixMap: Record<string, string> = {
      cardiology: 'CARD',
      dental: 'DEN',
      pediatrics: 'PED',
      orthopedics: 'ORT',
      general: 'GEN',
      dermatology: 'DERM'
    };

    const prefix = prefixMap[department.toLowerCase()] || 'CP';
    const existing = this.db.appointments.query(a => a.ticketNumber.startsWith(prefix));
    const nextSeq = existing.length + 101;
    return `${prefix}-${nextSeq}`;
  }

  private formatArabicTime(hour: number, minute: number): string {
    const period = hour >= 12 ? 'م' : 'ص';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const displayMinute = String(minute).padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  }
}
