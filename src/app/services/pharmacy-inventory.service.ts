import { Injectable, inject } from '@angular/core';
import { MockDatabaseService } from '../core/repositories/mock-database.service';
import { MedicationInventory, StockTransaction } from '../core/models/inventory.model';
import { Prescription } from '../core/models/prescription.model';
import { NotificationService } from '../core/services/notification.service';

export interface DispenseResult {
  success: boolean;
  message: string;
  missingOrInsufficient?: {
    medicationName: string;
    requested: number;
    available: number;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class PharmacyInventoryService {
  private readonly db = inject(MockDatabaseService);
  private readonly notifications = inject(NotificationService);

  /**
   * Dispenses a prescription: validates available stock, deducts quantities, records transactions.
   */
  dispensePrescription(prescriptionId: string, branchId?: string, dispensedBy = 'صيدلي المناوبة'): DispenseResult {
    const rx = this.db.prescriptions.getById(prescriptionId);
    if (!rx) {
      return { success: false, message: 'الروشتة الطبية غير موجودة.' };
    }

    if (rx.isDispensed) {
      return { success: false, message: 'هذه الروشتة تم صرفها مسبقاً بالفعل.' };
    }

    // Check stock for all items first
    const missing: { medicationName: string; requested: number; available: number }[] = [];

    for (const item of rx.items) {
      const med = (branchId ? this.db.inventory.query(m => m.pharmacyBranchId === branchId && (m.id === item.medicationId || m.tradeName.toLowerCase().includes(item.tradeName.toLowerCase())))[0] : null) ||
        this.db.inventory.getById(item.medicationId) ||
        this.db.inventory.query(m => m.tradeName.toLowerCase().includes(item.tradeName.toLowerCase()))[0];

      const available = med ? med.currentStock : 0;
      if (!med || available < item.quantityToDispense) {
        missing.push({
          medicationName: item.tradeName,
          requested: item.quantityToDispense,
          available
        });
      }
    }

    if (missing.length > 0) {
      const names = missing.map(m => `${m.medicationName} (مطلوب: ${m.requested}، متاح: ${m.available})`).join('، ');
      return {
        success: false,
        message: `تعذر الصرف لنقص المخزون: ${names}`,
        missingOrInsufficient: missing
      };
    }

    // Deduct stock and write transactions
    const now = new Date().toISOString();

    for (const item of rx.items) {
      const med = (branchId ? this.db.inventory.query(m => m.pharmacyBranchId === branchId && (m.id === item.medicationId || m.tradeName.toLowerCase().includes(item.tradeName.toLowerCase())))[0] : null) ||
        this.db.inventory.getById(item.medicationId) ||
        this.db.inventory.query(m => m.tradeName.toLowerCase().includes(item.tradeName.toLowerCase()))[0];

      if (med) {
        const newStock = med.currentStock - item.quantityToDispense;
        this.db.inventory.update(med.id, {
          currentStock: newStock
        });

        // Record stock audit transaction
        const tx: StockTransaction = {
          id: 'tx_' + Math.random().toString(36).substring(2, 9),
          medicationId: med.id,
          medicationName: med.tradeName,
          pharmacyBranchId: med.pharmacyBranchId,
          type: 'dispense',
          quantityChange: -item.quantityToDispense,
          resultingStock: newStock,
          prescriptionId: rx.id,
          reason: `صرف روشتة ${rx.prescriptionNumber} للمريض ${rx.patientName}`,
          timestamp: now,
          performedBy: dispensedBy
        };
        this.db.stockTransactions.create(tx);

        // Alert if low stock reached
        if (newStock <= med.minThreshold) {
          this.notifications.warning(
            'تنبيه نقص مخزون دواء',
            `وصل مخزون "${med.tradeName}" إلى ${newStock} وحدة (الحد الأدنى: ${med.minThreshold}). يرجى طلب توريد.`
          );
        }
      }
    }

    // Mark prescription as dispensed
    this.db.prescriptions.update(rx.id, {
      isDispensed: true,
      dispensedAt: now,
      dispensedBy
    });

    this.notifications.success(
      'تم الصرف بنجاح',
      `تم صرف أدوية الروشتة ${rx.prescriptionNumber} بنجاح وتحديث أرصدة الصيدلية فورياً.`
    );

    return {
      success: true,
      message: 'تم الصرف بنجاح وتحديث المخزون.'
    };
  }

  /**
   * Restocks a medication quantity
   */
  restockMedication(medicationId: string, quantityToAdd: number, batchNumber?: string, supplier = 'توريد مخزني'): void {
    const med = this.db.inventory.getById(medicationId);
    if (!med) {
      return;
    }

    const newStock = med.currentStock + quantityToAdd;
    const now = new Date().toISOString();

    this.db.inventory.update(med.id, {
      currentStock: newStock,
      lastRestockedAt: now.split('T')[0],
      batchNumber: batchNumber || med.batchNumber
    });

    const tx: StockTransaction = {
      id: 'tx_' + Math.random().toString(36).substring(2, 9),
      medicationId: med.id,
      medicationName: med.tradeName,
      type: 'restock',
      quantityChange: quantityToAdd,
      resultingStock: newStock,
      reason: `إضافة كمية توريد جديدة (+${quantityToAdd}) - ${supplier}`,
      timestamp: now,
      performedBy: 'أمين المخزن'
    };
    this.db.stockTransactions.create(tx);

    this.notifications.success(
      'تمت إضافة المخزون',
      `تمت إضافة ${quantityToAdd} وحدة إلى "${med.tradeName}". الرصيد الحالي: ${newStock}.`
    );
  }

  /**
   * Returns list of medications expiring within specified days (e.g. 90 days)
   */
  getExpiringSoonMedications(daysThreshold = 90): MedicationInventory[] {
    const now = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(now.getDate() + daysThreshold);

    return this.db.inventory.query(med => {
      const exp = new Date(med.expiryDate);
      return exp <= thresholdDate;
    });
  }

  /**
   * Returns list of medications below reorder threshold
   */
  getLowStockMedications(): MedicationInventory[] {
    return this.db.inventory.query(med => med.currentStock <= med.minThreshold);
  }
}
