import { Injectable, inject, signal } from '@angular/core';
import { StorageService } from '../services/storage.service';
import { IRepository } from './repository.interface';
import { Patient } from '../models/patient.model';
import { Doctor, DepartmentInfo, DepartmentType } from '../models/doctor.model';
import { Appointment } from '../models/appointment.model';
import { Prescription } from '../models/prescription.model';
import { MedicationInventory, StockTransaction, PharmacyBranch } from '../models/inventory.model';
import { LabOrder } from '../models/lab-test.model';
import { Invoice } from '../models/invoice.model';
import { ClinicalService } from '../models/clinical-service.model';

class EntityRepository<T extends { id: string }> implements IRepository<T> {
  constructor(
    private readonly storageKey: string,
    private readonly storage: StorageService,
    private readonly getInitialSeed: () => T[],
    private readonly onChangeCallback?: () => void
  ) {}

  private load(): T[] {
    const data = this.storage.getItem<T[] | null>(this.storageKey, null);
    if (!data || data.length === 0) {
      const seed = this.getInitialSeed();
      this.storage.setItem(this.storageKey, seed);
      return seed;
    }
    return data;
  }

  private save(items: T[]): void {
    this.storage.setItem(this.storageKey, items);
    if (this.onChangeCallback) {
      this.onChangeCallback();
    }
  }

  getAll(): T[] {
    return this.load();
  }

  getById(id: string): T | undefined {
    return this.load().find(item => item.id === id);
  }

  create(item: T): T {
    const items = this.load();
    items.unshift(item);
    this.save(items);
    return item;
  }

  update(id: string, updates: Partial<T>): T {
    const items = this.load();
    const index = items.findIndex(i => i.id === id);
    if (index === -1) {
      throw new Error(`Item with id "${id}" not found in ${this.storageKey}`);
    }
    items[index] = { ...items[index], ...updates };
    this.save(items);
    return items[index];
  }

  delete(id: string): boolean {
    const items = this.load();
    const filtered = items.filter(i => i.id !== id);
    if (filtered.length !== items.length) {
      this.save(filtered);
      return true;
    }
    return false;
  }

  query(predicate: (item: T) => boolean): T[] {
    return this.load().filter(predicate);
  }

  resetSeed(): void {
    const seed = this.getInitialSeed();
    this.save(seed);
  }
}

@Injectable({
  providedIn: 'root'
})
export class MockDatabaseService {
  private readonly storage = inject(StorageService);

  // Change notification signals to drive real-time reactivity
  readonly departmentsVersion = signal<number>(0);
  readonly doctorsVersion = signal<number>(0);
  readonly appointmentsVersion = signal<number>(0);
  readonly patientsVersion = signal<number>(0);
  readonly prescriptionsVersion = signal<number>(0);
  readonly inventoryVersion = signal<number>(0);
  readonly pharmacyBranchesVersion = signal<number>(0);
  readonly servicesVersion = signal<number>(0);
  readonly labOrdersVersion = signal<number>(0);
  readonly invoicesVersion = signal<number>(0);

  // Concrete repositories
  readonly departments: IRepository<DepartmentInfo>;
  readonly patients: IRepository<Patient>;
  readonly doctors: IRepository<Doctor>;
  readonly appointments: IRepository<Appointment>;
  readonly prescriptions: IRepository<Prescription>;
  readonly pharmacyBranches: IRepository<PharmacyBranch>;
  readonly inventory: IRepository<MedicationInventory>;
  readonly stockTransactions: IRepository<StockTransaction>;
  readonly servicesCatalog: IRepository<ClinicalService>;
  readonly labOrders: IRepository<LabOrder>;
  readonly invoices: IRepository<Invoice>;

  constructor() {
    this.departments = new EntityRepository<DepartmentInfo>(
      'departments_store',
      this.storage,
      () => this.getSeedDepartments(),
      () => this.departmentsVersion.update(v => v + 1)
    );

    this.patients = new EntityRepository<Patient>(
      'patients_store',
      this.storage,
      () => this.getSeedPatients(),
      () => this.patientsVersion.update(v => v + 1)
    );

    this.doctors = new EntityRepository<Doctor>(
      'doctors_store',
      this.storage,
      () => this.getSeedDoctors(),
      () => this.doctorsVersion.update(v => v + 1)
    );

    this.appointments = new EntityRepository<Appointment>(
      'appointments_store',
      this.storage,
      () => this.getSeedAppointments(),
      () => this.appointmentsVersion.update(v => v + 1)
    );

    this.prescriptions = new EntityRepository<Prescription>(
      'prescriptions_store',
      this.storage,
      () => this.getSeedPrescriptions(),
      () => this.prescriptionsVersion.update(v => v + 1)
    );

    this.pharmacyBranches = new EntityRepository<PharmacyBranch>(
      'pharmacy_branches_store',
      this.storage,
      () => this.getSeedPharmacyBranches(),
      () => this.pharmacyBranchesVersion.update(v => v + 1)
    );

    this.inventory = new EntityRepository<MedicationInventory>(
      'inventory_store',
      this.storage,
      () => this.getSeedInventory(),
      () => this.inventoryVersion.update(v => v + 1)
    );

    this.stockTransactions = new EntityRepository<StockTransaction>(
      'stock_transactions_store',
      this.storage,
      () => []
    );

    this.servicesCatalog = new EntityRepository<ClinicalService>(
      'services_catalog_store',
      this.storage,
      () => this.getSeedServicesCatalog(),
      () => this.servicesVersion.update(v => v + 1)
    );

    this.labOrders = new EntityRepository<LabOrder>(
      'lab_orders_store',
      this.storage,
      () => this.getSeedLabOrders(),
      () => this.labOrdersVersion.update(v => v + 1)
    );

    this.invoices = new EntityRepository<Invoice>(
      'invoices_store',
      this.storage,
      () => this.getSeedInvoices(),
      () => this.invoicesVersion.update(v => v + 1)
    );
  }

  // --- Dynamic Department Operations ---
  getDepartments(): DepartmentInfo[] {
    return this.departments.query(d => d.isActive !== false);
  }

  createDepartment(dept: DepartmentInfo): DepartmentInfo {
    return this.departments.create(dept);
  }

  updateDepartment(id: string, updates: Partial<DepartmentInfo>): DepartmentInfo {
    return this.departments.update(id, updates);
  }

  deleteDepartment(id: string): boolean {
    return this.departments.delete(id);
  }

  // --- Dynamic Doctor Operations ---
  createDoctor(doctor: Doctor): Doctor {
    return this.doctors.create(doctor);
  }

  updateDoctor(id: string, updates: Partial<Doctor>): Doctor {
    return this.doctors.update(id, updates);
  }

  updateDoctorSchedule(
    id: string,
    schedule: {
      workingDays: number[];
      shiftStart: string;
      shiftEnd: string;
      slotDurationMinutes: number;
      lunchInterval?: { start: string; end: string };
      vacationDays: string[];
    }
  ): Doctor {
    return this.doctors.update(id, schedule);
  }

  deleteDoctor(id: string): boolean {
    return this.doctors.delete(id);
  }

  // --- Dynamic Multi-Pharmacy Operations ---
  createPharmacyBranch(branch: PharmacyBranch): PharmacyBranch {
    return this.pharmacyBranches.create(branch);
  }

  updatePharmacyBranch(id: string, updates: Partial<PharmacyBranch>): PharmacyBranch {
    return this.pharmacyBranches.update(id, updates);
  }

  deletePharmacyBranch(id: string): boolean {
    return this.pharmacyBranches.delete(id);
  }

  addPharmacyItem(item: MedicationInventory): MedicationInventory {
    return this.inventory.create(item);
  }

  updatePharmacyItem(id: string, updates: Partial<MedicationInventory>): MedicationInventory {
    return this.inventory.update(id, updates);
  }

  adjustStock(id: string, quantityChange: number, reason: string, performedBy = 'مدير النظام'): void {
    const med = this.inventory.getById(id);
    if (!med) return;

    const resultingStock = Math.max(0, med.currentStock + quantityChange);
    this.inventory.update(id, { currentStock: resultingStock });

    const tx: StockTransaction = {
      id: 'tx_' + Math.random().toString(36).substring(2, 9),
      medicationId: med.id,
      medicationName: med.tradeName,
      pharmacyBranchId: med.pharmacyBranchId,
      type: quantityChange >= 0 ? 'restock' : 'adjustment',
      quantityChange,
      resultingStock,
      reason,
      timestamp: new Date().toISOString(),
      performedBy
    };
    this.stockTransactions.create(tx);
  }

  deletePharmacyItem(id: string): boolean {
    return this.inventory.delete(id);
  }

  // --- Dynamic Clinical Services & Lab Tests Operations ---
  createServiceItem(service: ClinicalService): ClinicalService {
    return this.servicesCatalog.create(service);
  }

  updateServiceItem(id: string, updates: Partial<ClinicalService>): ClinicalService {
    return this.servicesCatalog.update(id, updates);
  }

  deleteServiceItem(id: string): boolean {
    return this.servicesCatalog.delete(id);
  }

  resetAllToSeed(): void {
    this.storage.clearAll();
    // Re-initialize stores
    this.departments.getAll();
    this.patients.getAll();
    this.doctors.getAll();
    this.appointments.getAll();
    this.prescriptions.getAll();
    this.pharmacyBranches.getAll();
    this.inventory.getAll();
    this.servicesCatalog.getAll();
    this.labOrders.getAll();
    this.invoices.getAll();

    this.departmentsVersion.update(v => v + 1);
    this.doctorsVersion.update(v => v + 1);
    this.appointmentsVersion.update(v => v + 1);
    this.patientsVersion.update(v => v + 1);
    this.prescriptionsVersion.update(v => v + 1);
    this.pharmacyBranchesVersion.update(v => v + 1);
    this.inventoryVersion.update(v => v + 1);
    this.servicesVersion.update(v => v + 1);
    this.labOrdersVersion.update(v => v + 1);
    this.invoicesVersion.update(v => v + 1);
  }

  // --- Initial Seed Data Generators ---

  private getSeedDoctors(): Doctor[] {
    return [
      {
        id: 'doc_cardio_1',
        name: 'د. خالد عبد العزيز الشناوي',
        title: 'استشاري أول أمراض القلب وقسطرة الأوعية الدموية',
        department: 'cardiology',
        departmentArabic: 'أمراض القلب والأوعية',
        roomNumber: '101',
        consultationFee: 650,
        rating: 4.9,
        reviewsCount: 142,
        avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80',
        workingDays: [0, 1, 2, 3, 4], // Sun - Thu
        shiftStart: '09:00',
        shiftEnd: '20:00',
        slotDurationMinutes: 30,
        lunchInterval: { start: '14:00', end: '15:00' },
        vacationDays: ['2026-09-28'],
        licenseNumber: 'EGY-MED-CARD-9410',
        bio: 'دكتوراه أمراض القلب والأوعية الدموية - جامعة القاهرة. عضو الجمعية الأوروبية لأمراض القلب (ESC). خبرة 18 عاماً في علاج ارتفاع ضغط الدم وقصور الشرايين التاجية.',
        phone: '+201002345678',
        email: 'dr.khaled@carepoint.pro'
      },
      {
        id: 'doc_dental_1',
        name: 'د. نورهان طارق السعدني',
        title: 'أخصائية تجميل وزراعة الأسنان وعلاج الجذور',
        department: 'dental',
        departmentArabic: 'طب وجراحة الأسنان',
        roomNumber: '102',
        consultationFee: 400,
        rating: 4.8,
        reviewsCount: 98,
        avatarUrl: 'https://images.unsplash.com/photo-1594824813628-98448f2a58b8?w=200&auto=format&fit=crop&q=80',
        workingDays: [0, 1, 2, 4, 6], // Sun, Mon, Tue, Thu, Sat
        shiftStart: '10:00',
        shiftEnd: '19:00',
        slotDurationMinutes: 30,
        lunchInterval: { start: '14:30', end: '15:30' },
        vacationDays: [],
        licenseNumber: 'EGY-DEN-SMILE-7721',
        bio: 'ماجستير جراحة وتجميل الأسنان - جامعة عين شمس. متخصصة في التركيبات الخزفية الرقمية (CAD/CAM) وتصميم الابتسامة ثلاثية الأبعاد.',
        phone: '+201112345679',
        email: 'dr.nourhan@carepoint.pro'
      },
      {
        id: 'doc_pedia_1',
        name: 'د. أيمن محمود البهنساوي',
        title: 'استشاري طب الأطفال وحديثي الولادة وحساسية الصدر',
        department: 'pediatrics',
        departmentArabic: 'طب الأطفال وحديثي الولادة',
        roomNumber: '103',
        consultationFee: 450,
        rating: 4.9,
        reviewsCount: 180,
        avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&auto=format&fit=crop&q=80',
        workingDays: [0, 1, 3, 4, 6],
        shiftStart: '09:30',
        shiftEnd: '18:30',
        slotDurationMinutes: 30,
        lunchInterval: { start: '13:30', end: '14:30' },
        vacationDays: ['2026-10-01'],
        licenseNumber: 'EGY-PED-NEO-5531',
        bio: 'استشاري حديثي الولادة والمبتسرين، متابعة التغذية العلاجية للأطفال، وعلاج الربو الشعبي والحساسية الموسمية.',
        phone: '+201222345680',
        email: 'dr.ayman@carepoint.pro'
      },
      {
        id: 'doc_ortho_1',
        name: 'د. تامر فاروق العدوي',
        title: 'استشاري جراحة العظام ومناظير المفاصل والعمود الفقري',
        department: 'orthopedics',
        departmentArabic: 'جراحة العظام والمفاصل',
        roomNumber: '104',
        consultationFee: 600,
        rating: 4.7,
        reviewsCount: 115,
        avatarUrl: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=200&auto=format&fit=crop&q=80',
        workingDays: [1, 2, 3, 4, 6],
        shiftStart: '11:00',
        shiftEnd: '21:00',
        slotDurationMinutes: 30,
        lunchInterval: { start: '15:00', end: '16:00' },
        vacationDays: [],
        licenseNumber: 'EGY-ORT-SURG-6612',
        bio: 'زمالة جراحة المفاصل الصناعية - جامعة هايدلبرغ بألمانيا. متخصص في إصابات الملاعب وإعادة بناء الرباط الصليبي وعلاج خشونة الركبة المتقدمة.',
        phone: '+201012345681',
        email: 'dr.tamer@carepoint.pro'
      },
      {
        id: 'doc_gen_1',
        name: 'د. سميحة مصطفى غنيم',
        title: 'استشاري الأمراض الباطنية والسكر والغدد الصماء',
        department: 'general',
        departmentArabic: 'الطب العام والباطنة',
        roomNumber: '105',
        consultationFee: 500,
        rating: 4.9,
        reviewsCount: 210,
        avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&auto=format&fit=crop&q=80',
        workingDays: [0, 1, 2, 3, 4],
        shiftStart: '09:00',
        shiftEnd: '19:00',
        slotDurationMinutes: 30,
        lunchInterval: { start: '13:00', end: '14:00' },
        vacationDays: [],
        licenseNumber: 'EGY-INT-ENDO-3389',
        bio: 'دبلوم الغدد الصماء والسكري - جامعة الإسكندرية. خبرة واسعة في ضبط سكر الدم واضطرابات الغدة الدرقية ومتلازمة الأيض.',
        phone: '+201122345682',
        email: 'dr.samiha@carepoint.pro'
      },
      {
        id: 'doc_derm_1',
        name: 'د. ياسمين إبراهيم النجار',
        title: 'أخصائية الأمراض الجلدية والعلاج بالليزر والتجميل',
        department: 'dermatology',
        departmentArabic: 'الجلدية والتجميل والليزر',
        roomNumber: '106',
        consultationFee: 450,
        rating: 4.8,
        reviewsCount: 88,
        avatarUrl: 'https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?w=200&auto=format&fit=crop&q=80',
        workingDays: [0, 2, 3, 4, 6],
        shiftStart: '12:00',
        shiftEnd: '21:00',
        slotDurationMinutes: 30,
        lunchInterval: { start: '16:00', end: '17:00' },
        vacationDays: [],
        licenseNumber: 'EGY-DERM-LAS-1204',
        bio: 'البورد العربي في الأمراض الجلدية. خبرة متميزة في علاج حب الشباب، تساقط الشعر، الصدفية، وحقن الفيلر والبوتوكس.',
        phone: '+201212345683',
        email: 'dr.yasmin@carepoint.pro'
      }
    ];
  }

  private getSeedPatients(): Patient[] {
    return [
      {
        id: 'pt_1',
        fileNumber: 'PT-2026-0010',
        nationalId: '29004151201458',
        fullName: 'أحمد محمود رضوان',
        phone: '+201019876543',
        email: 'ahmed.radwan@example.com',
        dateOfBirth: '1985-06-14',
        gender: 'male',
        bloodGroup: 'O+',
        chronicDiseases: ['ارتفاع ضغط الدم الشرياني (Hypertension)', 'دهون ثلاثية مرتفعة'],
        allergies: ['حساسية البنسلين (Penicillin Allergy)'],
        currentMedications: ['Concor 5mg', 'Lipitor 20mg'],
        emergencyContact: {
          name: 'منى رضوان (الزوجة)',
          relation: 'زوجة',
          phone: '+201011122233'
        },
        medicalHistoryNotes: 'مريض يعاني من خفقان عابر عند الإجهاد البدني منذ 3 أسابيع.',
        registeredVia: 'online',
        createdAt: '2026-09-01T10:00:00.000Z'
      },
      {
        id: 'pt_2',
        fileNumber: 'PT-2026-0011',
        nationalId: '29511201804212',
        fullName: 'فاطمة الزهراء الشربيني',
        phone: '+201149876544',
        email: 'fatma.sherbini@example.com',
        dateOfBirth: '1992-11-20',
        gender: 'female',
        bloodGroup: 'A+',
        chronicDiseases: ['السكري من النوع الثاني (Type 2 DM)'],
        allergies: ['سلفوناميد (Sulfa Drugs)'],
        currentMedications: ['Metformin 850mg', 'Januvia 100mg'],
        emergencyContact: {
          name: 'حسام الشربيني (الأخ)',
          relation: 'أخ',
          phone: '+201122233344'
        },
        medicalHistoryNotes: 'متابعة دورية لمستوى السكر التراكمي ووظائف الكلى.',
        registeredVia: 'online',
        createdAt: '2026-09-05T14:30:00.000Z'
      },
      {
        id: 'pt_3',
        fileNumber: 'PT-2026-0012',
        nationalId: '30203041400299',
        fullName: 'عمر ياسر الحريري',
        phone: '+201279876545',
        email: 'omar.hariri@example.com',
        dateOfBirth: '2015-03-04',
        gender: 'male',
        bloodGroup: 'B+',
        chronicDiseases: ['حساسية صدرية (ربو شعبي موسمي)'],
        allergies: [],
        currentMedications: ['Ventolin Inhaler 100mcg عند اللزوم'],
        emergencyContact: {
          name: 'ياسر الحريري (الأب)',
          relation: 'أب',
          phone: '+201271122334'
        },
        medicalHistoryNotes: 'نوبات سعال جاف مع تغير فصول السنة.',
        registeredVia: 'walk-in',
        createdAt: '2026-09-10T09:15:00.000Z'
      },
      {
        id: 'pt_4',
        fileNumber: 'PT-2026-0013',
        nationalId: '28001011603412',
        fullName: 'إبراهيم توفيق الدمياطي',
        phone: '+201099876546',
        email: 'ibrahim.t@example.com',
        dateOfBirth: '1976-01-01',
        gender: 'male',
        bloodGroup: 'AB+',
        chronicDiseases: ['خشونة متقدمة بمفصل الركبة اليمنى'],
        allergies: ['الأسبرين (Aspirin Allergy)'],
        currentMedications: ['Glucosamine Plus', 'Panadol Joint'],
        emergencyContact: {
          name: 'طارق إبراهيم (الابن)',
          relation: 'ابن',
          phone: '+201091122335'
        },
        medicalHistoryNotes: 'صعوبة في صعود الدرج وآلام ميكانيكية شديدة في الركبة.',
        registeredVia: 'online',
        createdAt: '2026-09-12T11:45:00.000Z'
      },
      {
        id: 'pt_5',
        fileNumber: 'PT-2026-0014',
        nationalId: '29807181502441',
        fullName: 'سارة عبد الرحمن الباز',
        phone: '+201189876547',
        email: 'sara.elbaz@example.com',
        dateOfBirth: '1998-07-18',
        gender: 'female',
        bloodGroup: 'O-',
        chronicDiseases: [],
        allergies: [],
        currentMedications: [],
        emergencyContact: {
          name: 'هدى الباز (الأم)',
          relation: 'أم',
          phone: '+201181122336'
        },
        medicalHistoryNotes: 'ألم حاد في الضرس السفلي الأيمن مع انتفاخ طفيف باللثة.',
        registeredVia: 'online',
        createdAt: '2026-09-14T16:00:00.000Z'
      }
    ];
  }

  private getSeedAppointments(): Appointment[] {
    const today = new Date().toISOString().split('T')[0];

    return [
      {
        id: 'apt_1',
        ticketNumber: 'CARD-101',
        patientId: 'pt_1',
        patientName: 'أحمد محمود رضوان',
        patientPhone: '+201019876543',
        patientEmail: 'ahmed.radwan@example.com',
        doctorId: 'doc_cardio_1',
        doctorName: 'د. خالد عبد العزيز الشناوي',
        department: 'cardiology',
        departmentArabic: 'أمراض القلب والأوعية',
        roomNumber: '101',
        date: today,
        timeSlot: '10:00',
        status: 'in-consultation',
        priority: 'routine',
        intake: {
          symptoms: 'شعور بدقات قلب سريعة مع دوخة خفيفة عند بذل مجهود في العمل.',
          chronicDiseases: ['ارتفاع ضغط الدم الشرياني'],
          currentMedications: ['Concor 5mg'],
          triageSeverity: 2,
          uploadedLabPhotos: []
        },
        vitals: {
          systolicBp: 138,
          diastolicBp: 88,
          pulseRate: 86,
          bloodGlucose: 104,
          temperature: 36.9,
          oxygenSaturation: 98,
          weightKg: 84,
          heightCm: 175,
          bmi: 27.4,
          bmiCategoryAr: 'وزن زائد (Overweight)',
          measuredAt: today + ' 09:50'
        },
        isWalkIn: false,
        bookedAt: '2026-09-15T12:00:00.000Z',
        checkedInAt: today + ' 09:45:00',
        otpVerified: true
      },
      {
        id: 'apt_2',
        ticketNumber: 'CARD-102',
        patientId: 'pt_4',
        patientName: 'إبراهيم توفيق الدمياطي',
        patientPhone: '+201099876546',
        patientEmail: 'ibrahim.t@example.com',
        doctorId: 'doc_cardio_1',
        doctorName: 'د. خالد عبد العزيز الشناوي',
        department: 'cardiology',
        departmentArabic: 'أمراض القلب والأوعية',
        roomNumber: '101',
        date: today,
        timeSlot: '10:30',
        status: 'waiting',
        priority: 'urgent',
        intake: {
          symptoms: 'ضغط في منتصف الصدر يمتد للكتف الأيسر منذ ساعتين.',
          chronicDiseases: [],
          currentMedications: [],
          triageSeverity: 4,
          uploadedLabPhotos: []
        },
        vitals: {
          systolicBp: 155,
          diastolicBp: 95,
          pulseRate: 98,
          temperature: 37.1,
          oxygenSaturation: 96,
          weightKg: 88,
          heightCm: 172,
          bmi: 29.7,
          bmiCategoryAr: 'وزن زائد (Overweight)',
          measuredAt: today + ' 10:15'
        },
        isWalkIn: true,
        bookedAt: today + 'T10:10:00.000Z',
        checkedInAt: today + ' 10:12:00',
        otpVerified: true
      },
      {
        id: 'apt_3',
        ticketNumber: 'DEN-101',
        patientId: 'pt_5',
        patientName: 'سارة عبد الرحمن الباز',
        patientPhone: '+201189876547',
        patientEmail: 'sara.elbaz@example.com',
        doctorId: 'doc_dental_1',
        doctorName: 'د. نورهان طارق السعدني',
        department: 'dental',
        departmentArabic: 'طب وجراحة الأسنان',
        roomNumber: '102',
        date: today,
        timeSlot: '11:00',
        status: 'waiting',
        priority: 'routine',
        intake: {
          symptoms: 'ألم مستمر مع المشروبات الباردة في الضرس السفلي الأيمن.',
          chronicDiseases: [],
          currentMedications: [],
          triageSeverity: 2,
          uploadedLabPhotos: []
        },
        isWalkIn: false,
        bookedAt: '2026-09-14T18:00:00.000Z',
        checkedInAt: today + ' 10:40:00',
        otpVerified: true
      },
      {
        id: 'apt_4',
        ticketNumber: 'PED-101',
        patientId: 'pt_3',
        patientName: 'عمر ياسر الحريري',
        patientPhone: '+201279876545',
        patientEmail: 'omar.hariri@example.com',
        doctorId: 'doc_pedia_1',
        doctorName: 'د. أيمن محمود البهنساوي',
        department: 'pediatrics',
        departmentArabic: 'طب الأطفال وحديثي الولادة',
        roomNumber: '103',
        date: today,
        timeSlot: '11:30',
        status: 'scheduled',
        priority: 'routine',
        intake: {
          symptoms: 'كشف دوري ومتابعة بخاخات الصدر قبل بدء العام الدراسي.',
          chronicDiseases: ['حساسية صدرية'],
          currentMedications: ['Ventolin 100mcg'],
          triageSeverity: 1,
          uploadedLabPhotos: []
        },
        isWalkIn: false,
        bookedAt: '2026-09-15T09:00:00.000Z',
        otpVerified: true
      },
      {
        id: 'apt_5',
        ticketNumber: 'GEN-101',
        patientId: 'pt_2',
        patientName: 'فاطمة الزهراء الشربيني',
        patientPhone: '+201149876544',
        patientEmail: 'fatma.sherbini@example.com',
        doctorId: 'doc_gen_1',
        doctorName: 'د. سميحة مصطفى غنيم',
        department: 'general',
        departmentArabic: 'الطب العام والباطنة',
        roomNumber: '105',
        date: today,
        timeSlot: '09:30',
        status: 'completed',
        priority: 'routine',
        intake: {
          symptoms: 'فحص دوري لمتابعة السكر وتعديل جرعة الأقراص.',
          chronicDiseases: ['السكري من النوع الثاني'],
          currentMedications: ['Metformin 850mg'],
          triageSeverity: 1,
          uploadedLabPhotos: []
        },
        vitals: {
          systolicBp: 125,
          diastolicBp: 80,
          pulseRate: 74,
          bloodGlucose: 135,
          temperature: 36.8,
          oxygenSaturation: 99,
          weightKg: 70,
          heightCm: 164,
          bmi: 26.0,
          bmiCategoryAr: 'وزن زائد (Overweight)',
          measuredAt: today + ' 09:20'
        },
        isWalkIn: false,
        bookedAt: '2026-09-13T10:00:00.000Z',
        checkedInAt: today + ' 09:15:00',
        completedAt: today + ' 10:05:00',
        otpVerified: true,
        consultationNotes: 'الحالة مستقرة. تم التوصية بممارسة الرياضة الخفيفة ونظام غذائي قليل النشويات.',
        prescriptionId: 'rx_seed_1',
        invoiceId: 'inv_seed_1'
      }
    ];
  }

  private getSeedPrescriptions(): Prescription[] {
    const today = new Date().toISOString().split('T')[0];
    return [
      {
        id: 'rx_seed_1',
        prescriptionNumber: 'RX-2026-0101',
        appointmentId: 'apt_5',
        patientId: 'pt_2',
        patientName: 'فاطمة الزهراء الشربيني',
        patientAge: 34,
        doctorId: 'doc_gen_1',
        doctorName: 'د. سميحة مصطفى غنيم',
        doctorLicense: 'EGY-INT-ENDO-3389',
        departmentArabic: 'الطب العام والباطنة',
        diagnoses: [
          {
            code: 'E11.9',
            descriptionAr: 'داء السكري من النوع الثاني بدون مضاعفات',
            descriptionEn: 'Type 2 diabetes mellitus without complications'
          },
          {
            code: 'E78.0',
            descriptionAr: 'فرط كولسترول الدم الصافي',
            descriptionEn: 'Pure hypercholesterolemia'
          }
        ],
        items: [
          {
            id: 'item_1',
            medicationId: 'med_metformin',
            tradeName: 'Glucophage 1000mg',
            genericName: 'Metformin Hydrochloride',
            dosage: '1000 mg',
            frequency: 'قرص مرتين يومياً مع وجبتي الإفطار والعشاء (BID)',
            frequencyCode: 'BID',
            durationDays: 30,
            instructions: 'يؤخذ أثناء أو بعد الوجبة مباشرة لتقليل اضطرابات المعدة',
            quantityToDispense: 2
          },
          {
            id: 'item_2',
            medicationId: 'med_atorva',
            tradeName: 'Lipitor 20mg',
            genericName: 'Atorvastatin Calcium',
            dosage: '20 mg',
            frequency: 'قرص واحد يومياً مساءً قبل النوم (OD)',
            frequencyCode: 'OD',
            durationDays: 30,
            instructions: 'يؤخذ ليلاً بانتظام',
            quantityToDispense: 1
          }
        ],
        interactionsFound: [],
        clinicalNotes: 'مراجعة المريضة بعد شهر مع تحليل سكر صائم وفاطر وسكر تراكمي جديد.',
        issuedAt: today + ' 10:00:00',
        isDispensed: true,
        dispensedAt: today + ' 10:15:00',
        dispensedBy: 'صيدلي المناوبة: د. رامي زهران',
        qrHash: 'CAREPOINT-RX-2026-0101-VERIFIED'
      }
    ];
  }

  private getSeedInventory(): MedicationInventory[] {
    const today = new Date().toISOString().split('T')[0];
    return [
      {
        id: 'med_aug',
        tradeName: 'Augmentin 1g',
        genericName: 'Amoxicillin + Clavulanic Acid',
        dosageForm: 'tablets',
        dosageFormArabic: 'أقراص مغلفة',
        strength: '1000 mg',
        batchNumber: 'AUG-2026-B81',
        currentStock: 48,
        minThreshold: 15,
        unitPriceEgp: 135,
        expiryDate: '2027-08-30',
        category: 'مضاد حيوي واسع المجال',
        manufacturer: 'GSK Egypt',
        lastRestockedAt: '2026-08-10'
      },
      {
        id: 'med_metformin',
        tradeName: 'Glucophage 1000mg',
        genericName: 'Metformin Hydrochloride',
        dosageForm: 'tablets',
        dosageFormArabic: 'أقراص ممتدة المفعول',
        strength: '1000 mg',
        batchNumber: 'GLU-2026-X12',
        currentStock: 82,
        minThreshold: 20,
        unitPriceEgp: 72,
        expiryDate: '2028-01-15',
        category: 'علاج السكري',
        manufacturer: 'Merck Serono',
        lastRestockedAt: '2026-08-15'
      },
      {
        id: 'med_concor',
        tradeName: 'Concor 5mg',
        genericName: 'Bisoprolol Fumarate',
        dosageForm: 'tablets',
        dosageFormArabic: 'أقراص',
        strength: '5 mg',
        batchNumber: 'CON-2026-K90',
        currentStock: 35,
        minThreshold: 15,
        unitPriceEgp: 58,
        expiryDate: '2027-11-20',
        category: 'مثبطات بيتا / خافض لضغط الدم',
        manufacturer: 'Merck',
        lastRestockedAt: '2026-07-25'
      },
      {
        id: 'med_atorva',
        tradeName: 'Lipitor 20mg',
        genericName: 'Atorvastatin Calcium',
        dosageForm: 'tablets',
        dosageFormArabic: 'أقراص',
        strength: '20 mg',
        batchNumber: 'LIP-2026-N44',
        currentStock: 64,
        minThreshold: 20,
        unitPriceEgp: 180,
        expiryDate: '2027-06-18',
        category: 'مخفض للدهون والكوليسترول',
        manufacturer: 'Pfizer',
        lastRestockedAt: '2026-08-01'
      },
      {
        id: 'med_panadol_extra',
        tradeName: 'Panadol Extra',
        genericName: 'Paracetamol + Caffeine',
        dosageForm: 'tablets',
        dosageFormArabic: 'أقراص سريعة المفعول',
        strength: '500 mg / 65 mg',
        batchNumber: 'PAN-2026-P01',
        currentStock: 120,
        minThreshold: 30,
        unitPriceEgp: 45,
        expiryDate: '2028-05-10',
        category: 'مسكن وخافض للحرارة',
        manufacturer: 'Haleon',
        lastRestockedAt: '2026-09-02'
      },
      {
        id: 'med_cataflam',
        tradeName: 'Cataflam 50mg',
        genericName: 'Diclofenac Potassium',
        dosageForm: 'tablets',
        dosageFormArabic: 'أقراص سريعة الامتصاص',
        strength: '50 mg',
        batchNumber: 'CAT-2026-C33',
        currentStock: 8, // Low Stock Trigger!
        minThreshold: 15,
        unitPriceEgp: 65,
        expiryDate: '2027-04-12',
        category: 'مضاد للالتهاب ومسكن غير ستيرويدي (NSAID)',
        manufacturer: 'Novartis',
        lastRestockedAt: '2026-06-11'
      },
      {
        id: 'med_aspirin',
        tradeName: 'Aspocid 75mg Protect',
        genericName: 'Acetylsalicylic Acid',
        dosageForm: 'tablets',
        dosageFormArabic: 'أقراص قابلة للمضغ / حماية المعدة',
        strength: '75 mg',
        batchNumber: 'ASP-2026-A10',
        currentStock: 95,
        minThreshold: 25,
        unitPriceEgp: 32,
        expiryDate: '2027-10-01',
        category: 'مضاد لتكدس الصفائح الدموية',
        manufacturer: 'CID Egypt',
        lastRestockedAt: '2026-08-20'
      },
      {
        id: 'med_warfarin',
        tradeName: 'Marevan 3mg',
        genericName: 'Warfarin Sodium',
        dosageForm: 'tablets',
        dosageFormArabic: 'أقراص',
        strength: '3 mg',
        batchNumber: 'WAR-2026-W05',
        currentStock: 24,
        minThreshold: 10,
        unitPriceEgp: 42,
        expiryDate: '2027-03-30',
        category: 'مضاد للتخثر (Anticoagulant)',
        manufacturer: 'Glaxo',
        lastRestockedAt: '2026-07-15'
      },
      {
        id: 'med_ventolin',
        tradeName: 'Ventolin Inhaler 100mcg',
        genericName: 'Salbutamol Sulfate',
        dosageForm: 'inhaler',
        dosageFormArabic: 'بخاخ استنشاق فموي',
        strength: '100 mcg / dose',
        batchNumber: 'VEN-2026-V88',
        currentStock: 18,
        minThreshold: 10,
        unitPriceEgp: 95,
        expiryDate: '2027-09-14',
        category: 'موسع للشعب الهوائية سريع المفعول',
        manufacturer: 'GSK',
        lastRestockedAt: '2026-08-05'
      },
      {
        id: 'med_cipro',
        tradeName: 'Ciprobay 500mg',
        genericName: 'Ciprofloxacin',
        dosageForm: 'tablets',
        dosageFormArabic: 'أقراص',
        strength: '500 mg',
        batchNumber: 'CIP-2026-991',
        currentStock: 4, // Critical Low Stock!
        minThreshold: 12,
        unitPriceEgp: 88,
        expiryDate: '2027-02-28',
        category: 'مضاد حيوي من مجموعة الفلوروكينولون',
        manufacturer: 'Bayer',
        lastRestockedAt: '2026-05-19'
      },
      {
        id: 'med_omeprazole',
        tradeName: 'Losec 20mg',
        genericName: 'Omeprazole',
        dosageForm: 'capsules',
        dosageFormArabic: 'كبسولات مقاومة لعصارة المعدة',
        strength: '20 mg',
        batchNumber: 'LOS-2026-L71',
        currentStock: 70,
        minThreshold: 20,
        unitPriceEgp: 110,
        expiryDate: '2027-12-31',
        category: 'مثبط مضخة البروتون لعلاج الحموضة والقرحة',
        manufacturer: 'AstraZeneca',
        lastRestockedAt: '2026-08-25'
      },
      {
        id: 'med_ceftriaxone',
        tradeName: 'Cefaxone 1g Vial',
        genericName: 'Ceftriaxone Sodium',
        dosageForm: 'injection',
        dosageFormArabic: 'حقن وريدية / عضلية',
        strength: '1000 mg',
        batchNumber: 'CEF-2026-C19',
        currentStock: 30,
        minThreshold: 15,
        unitPriceEgp: 65,
        expiryDate: '2027-07-20',
        category: 'مضاد حيوي جيل ثالث سيفالوسبورين',
        manufacturer: 'Novartis Egypt',
        lastRestockedAt: '2026-08-12'
      }
    ];
  }

  private getSeedLabOrders(): LabOrder[] {
    const today = new Date().toISOString().split('T')[0];
    return [
      {
        id: 'lab_order_1',
        orderNumber: 'LAB-2026-0042',
        appointmentId: 'apt_5',
        patientId: 'pt_2',
        patientName: 'فاطمة الزهراء الشربيني',
        patientPhone: '+201149876544',
        patientEmail: 'fatma.sherbini@example.com',
        doctorId: 'doc_gen_1',
        doctorName: 'د. سميحة مصطفى غنيم',
        status: 'ready',
        orderedAt: today + ' 09:40',
        sampleCollectedAt: today + ' 09:45',
        resultsCompletedAt: today + ' 10:15',
        patientNotifiedAt: today + ' 10:16',
        uploadedReports: [],
        totalCostEgp: 520,
        items: [
          {
            testId: 't_hba1c',
            testNameAr: 'تحليل السكر التراكمي (HbA1c)',
            testNameEn: 'Glycated Hemoglobin',
            category: 'biochemistry',
            normalRange: '< 5.7 % (طبيعي) | 5.7 - 6.4 % (ما قبل السكر)',
            priceEgp: 220,
            resultValue: '6.8',
            resultUnit: '%',
            interpretation: 'high',
            labTechnicianNotes: 'مستوى السكر التراكمي يشير إلى تحكم متوسط يحتاج متابعة غذائية.'
          },
          {
            testId: 't_lipid',
            testNameAr: 'لوحة الدهون الكاملة (Lipid Profile)',
            testNameEn: 'Comprehensive Lipid Panel',
            category: 'biochemistry',
            normalRange: 'كولسترول كلي < 200 mg/dL',
            priceEgp: 300,
            resultValue: '215',
            resultUnit: 'mg/dL',
            interpretation: 'high',
            labTechnicianNotes: 'ارتفاع طفيف في الكولسترول الكلي، LDL = 138 mg/dL.'
          }
        ]
      },
      {
        id: 'lab_order_2',
        orderNumber: 'LAB-2026-0043',
        appointmentId: 'apt_1',
        patientId: 'pt_1',
        patientName: 'أحمد محمود رضوان',
        patientPhone: '+201019876543',
        patientEmail: 'ahmed.radwan@example.com',
        doctorId: 'doc_cardio_1',
        doctorName: 'د. خالد عبد العزيز الشناوي',
        status: 'processing',
        orderedAt: today + ' 10:05',
        sampleCollectedAt: today + ' 10:10',
        uploadedReports: [],
        totalCostEgp: 480,
        items: [
          {
            testId: 't_cbc',
            testNameAr: 'صورة دم كاملة (CBC with Diff)',
            testNameEn: 'Complete Blood Count',
            category: 'hematology',
            normalRange: 'الهيموجلوبين: 13.5 - 17.5 g/dL (للذكور)',
            priceEgp: 180,
            resultValue: '14.8',
            resultUnit: 'g/dL',
            interpretation: 'normal',
            labTechnicianNotes: 'كرات الدم البيضاء والصفائح في النطاق الطبيعي.'
          },
          {
            testId: 't_trop',
            testNameAr: 'إنزيم القلب تروبونين عالي الحساسية (hs-Troponin I)',
            testNameEn: 'High-Sensitivity Troponin I',
            category: 'cardiac',
            normalRange: '< 0.04 ng/mL',
            priceEgp: 300,
            resultValue: '0.01',
            resultUnit: 'ng/mL',
            interpretation: 'normal',
            labTechnicianNotes: 'سلبي - لا يوجد دليل على نقص تروية حاد في عضلة القلب.'
          }
        ]
      }
    ];
  }

  private getSeedInvoices(): Invoice[] {
    const today = new Date().toISOString().split('T')[0];
    return [
      {
        id: 'inv_seed_1',
        invoiceNumber: 'INV-2026-0089',
        appointmentId: 'apt_5',
        patientId: 'pt_2',
        patientName: 'فاطمة الزهراء الشربيني',
        patientPhone: '+201149876544',
        doctorId: 'doc_gen_1',
        doctorName: 'د. سميحة مصطفى غنيم',
        items: [
          {
            id: 'item_inv_1',
            category: 'consultation',
            categoryArabic: 'كشف استشاري باطنة وسكر',
            description: 'استشارة طبية وفحص سريري شامل - د. سميحة مصطفى',
            quantity: 1,
            unitPriceEgp: 500,
            totalPriceEgp: 500
          },
          {
            id: 'item_inv_2',
            category: 'lab-test',
            categoryArabic: 'فحوصات معملية',
            description: 'تحليل سكر تراكمي HbA1c + لوحة دهون كاملة',
            quantity: 1,
            unitPriceEgp: 520,
            totalPriceEgp: 520
          },
          {
            id: 'item_inv_3',
            category: 'medication',
            categoryArabic: 'أدوية منصرفة من الصيدلية',
            description: 'Glucophage 1000mg (علبتين) + Lipitor 20mg (علبة)',
            quantity: 1,
            unitPriceEgp: 324,
            totalPriceEgp: 324
          }
        ],
        subtotalEgp: 1344,
        taxRatePercent: 14,
        taxAmountEgp: 188.16,
        discountCode: 'CARE10',
        discountAmountEgp: 134.4,
        grandTotalEgp: 1397.76,
        insuranceCoverageAmountEgp: 0,
        patientPayableEgp: 1397.76,
        amountPaidEgp: 1397.76,
        paymentMethod: 'card',
        paymentStatus: 'paid',
        issuedAt: today + ' 10:20:00',
        paidAt: today + ' 10:22:00',
        qrPayload: 'CAREPOINT-INV-2026-0089-PAID-1397.76'
      }
    ];
  }

  private getSeedDepartments(): DepartmentInfo[] {
    return [
      {
        id: 'dental',
        nameAr: 'طب وجراحة الأسنان',
        nameEn: 'Dental Surgery & Oral Medicine',
        icon: 'bi-gem',
        descriptionAr: 'علاج الجذور، تبييض الأسنان، التركيبات وزراعة الأسنان بأحدث التقنيات الرقمية',
        accentColor: '#0ea5e9',
        isActive: true
      },
      {
        id: 'cardiology',
        nameAr: 'أمراض القلب والأوعية',
        nameEn: 'Cardiology & Vascular',
        icon: 'bi-heart-pulse-fill',
        descriptionAr: 'رسم القلب التداخلي، فحص الإيكو، متابعة ضغط الدم الشرياني واعتلال الصمامات',
        accentColor: '#e11d48',
        isActive: true
      },
      {
        id: 'pediatrics',
        nameAr: 'طب الأطفال وحديثي الولادة',
        nameEn: 'Pediatrics & Neonatology',
        icon: 'bi-emoji-smile-fill',
        descriptionAr: 'متابعة النمو والتطور، التطعيمات الإلزامية والإضافية، حساسية الصدر للأطفال',
        accentColor: '#f59e0b',
        isActive: true
      },
      {
        id: 'orthopedics',
        nameAr: 'جراحة العظام والمفاصل',
        nameEn: 'Orthopedics & Joint Surgery',
        icon: 'bi-bandaid-fill',
        descriptionAr: 'خشونة المفاصل، مناظير الركبة والكتف، إصابات الملاعب وعلاج الانزلاق الغضروفي',
        accentColor: '#8b5cf6',
        isActive: true
      },
      {
        id: 'general',
        nameAr: 'الطب العام والباطنة',
        nameEn: 'General & Internal Medicine',
        icon: 'bi-capsule-pill',
        descriptionAr: 'الكشف الشامل، السكري، أمراض الغدد والجهاز الهضمي، والفحوصات الدورية الوقائية',
        accentColor: '#10b981',
        isActive: true
      },
      {
        id: 'dermatology',
        nameAr: 'الجلدية والتجميل والليزر',
        nameEn: 'Dermatology & Laser Clinic',
        icon: 'bi-flower1',
        descriptionAr: 'علاج الصدفية والإكزيما، جلسات نضارة البشرة، حقن البوتوكس وجلسات الليزر الطبية',
        accentColor: '#ec4899',
        isActive: true
      }
    ];
  }

  private getSeedPharmacyBranches(): PharmacyBranch[] {
    return [
      {
        id: 'pb_main',
        nameAr: 'الصيدلية المركزية الرئيسية',
        nameEn: 'Main Central Pharmacy',
        code: 'MAIN-PHARM',
        isDefault: true,
        location: 'الطابق الأرضي - بجوار بهو الاستقبال',
        description: 'صرف الأدوية الخارجية لجميع عيادات ومراجعي المركز'
      },
      {
        id: 'pb_emergency',
        nameAr: 'خزانة صيدلية الطوارئ والحرجة',
        nameEn: 'Emergency & Urgent Stock Cabinet',
        code: 'ER-CABINET',
        isDefault: false,
        location: 'قسم الطوارئ والاستقبال السريع',
        description: 'أدوية الحالات العاجلة والإنقاذ والحقن الفوري'
      },
      {
        id: 'pb_clinics',
        nameAr: 'خزانة العيادات التخصصية',
        nameEn: 'Specialty Clinics Dispensing Unit',
        code: 'CLINIC-STOCK',
        isDefault: false,
        location: 'الطابق الأول - ممر عيادات الباطنة والجراحة',
        description: 'مخزون مساند للغيارات والمستلزمات والأدوية المتكررة'
      }
    ];
  }

  private getSeedServicesCatalog(): ClinicalService[] {
    return [
      {
        id: 'srv_cons_general',
        code: 'CONS-GEN',
        nameAr: 'كشف استشاري عام / باطنة',
        nameEn: 'General Consultation',
        category: 'consultation',
        departmentId: 'general',
        departmentNameAr: 'الطب العام والباطنة',
        priceEgp: 300,
        isActive: true,
        createdAt: '2026-01-01'
      },
      {
        id: 'srv_cons_cardio',
        code: 'CONS-CARD',
        nameAr: 'كشف استشاري أمراض القلب والأوعية',
        nameEn: 'Cardiology Consultation',
        category: 'consultation',
        departmentId: 'cardiology',
        departmentNameAr: 'أمراض القلب والأوعية',
        priceEgp: 500,
        isActive: true,
        createdAt: '2026-01-01'
      },
      {
        id: 'srv_cons_dental',
        code: 'CONS-DENT',
        nameAr: 'فحص وكشف طب وجراحة الأسنان',
        nameEn: 'Dental Consultation',
        category: 'consultation',
        departmentId: 'dental',
        departmentNameAr: 'طب وجراحة الأسنان',
        priceEgp: 350,
        isActive: true,
        createdAt: '2026-01-01'
      },
      {
        id: 'srv_proc_scale',
        code: 'PROC-DENT-01',
        nameAr: 'تنظيف وتلميع الأسنان وإزالة الجير بالموجات الصوتية',
        nameEn: 'Ultrasonic Scaling & Polishing',
        category: 'procedure',
        departmentId: 'dental',
        departmentNameAr: 'طب وجراحة الأسنان',
        priceEgp: 450,
        isActive: true,
        createdAt: '2026-01-01'
      },
      {
        id: 'srv_proc_ecg',
        code: 'PROC-ECG-01',
        nameAr: 'رسم قلب تخطيطي كهربائي 12 قناة (12-Lead ECG)',
        nameEn: 'Electrocardiogram (ECG)',
        category: 'procedure',
        departmentId: 'cardiology',
        departmentNameAr: 'أمراض القلب والأوعية',
        priceEgp: 250,
        isActive: true,
        createdAt: '2026-01-01'
      },
      {
        id: 'srv_proc_echo',
        code: 'PROC-ECHO-01',
        nameAr: 'موجات صوتية ملونة على القلب (Echocardiography)',
        nameEn: 'Transthoracic Echocardiogram (Echo)',
        category: 'procedure',
        departmentId: 'cardiology',
        departmentNameAr: 'أمراض القلب والأوعية',
        priceEgp: 700,
        isActive: true,
        createdAt: '2026-01-01'
      },
      {
        id: 'srv_proc_laser',
        code: 'PROC-DERM-01',
        nameAr: 'جلسة فراكشنال ليزر وتجديد نضارة البشرة',
        nameEn: 'Fractional Laser Skin Rejuvenation',
        category: 'procedure',
        departmentId: 'dermatology',
        departmentNameAr: 'الجلدية والتجميل والليزر',
        priceEgp: 850,
        isActive: true,
        createdAt: '2026-01-01'
      },
      {
        id: 'srv_lab_cbc',
        code: 'LAB-CBC',
        nameAr: 'صورة دم كاملة (CBC with Differential)',
        nameEn: 'Complete Blood Count',
        category: 'lab-test',
        priceEgp: 180,
        normalRange: 'الهيموجلوبين: 13-17 g/dL | كرات الدم البيضاء: 4,000-11,000 /uL',
        unit: 'g/dL',
        isActive: true,
        createdAt: '2026-01-01'
      },
      {
        id: 'srv_lab_hba1c',
        code: 'LAB-HBA1C',
        nameAr: 'تحليل السكر التراكمي (HbA1c)',
        nameEn: 'Glycated Hemoglobin',
        category: 'lab-test',
        priceEgp: 220,
        normalRange: 'طبيعي: < 5.7% | ما قبل سكري: 5.7 - 6.4%',
        unit: '%',
        isActive: true,
        createdAt: '2026-01-01'
      },
      {
        id: 'srv_lab_lipid',
        code: 'LAB-LIPID',
        nameAr: 'لوحة الدهون الشاملة (Lipid Profile)',
        nameEn: 'Comprehensive Lipid Panel',
        category: 'lab-test',
        priceEgp: 300,
        normalRange: 'كولسترول كلي < 200 mg/dL | الدهون الثلاثية < 150 mg/dL',
        unit: 'mg/dL',
        isActive: true,
        createdAt: '2026-01-01'
      },
      {
        id: 'srv_lab_kft',
        code: 'LAB-KFT',
        nameAr: 'وظائف كلى كاملة (Creatinine & Urea)',
        nameEn: 'Kidney Function Test',
        category: 'lab-test',
        priceEgp: 190,
        normalRange: 'الكرياتينين: 0.6 - 1.2 mg/dL | اليوريا: 15 - 45 mg/dL',
        unit: 'mg/dL',
        isActive: true,
        createdAt: '2026-01-01'
      },
      {
        id: 'srv_lab_lft',
        code: 'LAB-LFT',
        nameAr: 'وظائف وإنزيمات الكبد (SGPT & SGOT)',
        nameEn: 'Liver Function Panel',
        category: 'lab-test',
        priceEgp: 200,
        normalRange: 'SGPT/ALT: < 45 U/L | SGOT/AST: < 40 U/L',
        unit: 'U/L',
        isActive: true,
        createdAt: '2026-01-01'
      },
      {
        id: 'srv_rad_chest',
        code: 'RAD-XRAY-01',
        nameAr: 'أشعة سينية على الصدر رقمية (Chest X-Ray PA)',
        nameEn: 'Digital Chest X-Ray',
        category: 'radiology',
        priceEgp: 280,
        normalRange: 'لا توجد ارتشاحات أو تضخم في حجم القلب',
        unit: 'تقرير',
        isActive: true,
        createdAt: '2026-01-01'
      },
      {
        id: 'srv_rad_knee',
        code: 'RAD-XRAY-02',
        nameAr: 'أشعة سينية على مفصل الركبة (Knee AP/LAT)',
        nameEn: 'Knee Joint X-Ray AP/Lateral',
        category: 'radiology',
        priceEgp: 300,
        normalRange: 'مسافة المفصل سليمة ولا توجد نتوءات عظمية',
        unit: 'تقرير',
        isActive: true,
        createdAt: '2026-01-01'
      }
    ];
  }
}
