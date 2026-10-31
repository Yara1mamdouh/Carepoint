import { Injectable, inject } from '@angular/core';
import { MockDatabaseService } from '../core/repositories/mock-database.service';
import { Patient } from '../core/models/patient.model';
import { Appointment, VitalSigns } from '../core/models/appointment.model';
import { Prescription, DiagnosticCode, DrugInteractionAlert } from '../core/models/prescription.model';
import { LabOrder } from '../core/models/lab-test.model';

export interface BmiAnalysis {
  bmi: number;
  categoryEn: 'underweight' | 'normal' | 'overweight' | 'obese-1' | 'obese-severe';
  categoryAr: string;
  badgeClass: string;
  recommendation: string;
}

export interface PatientTimelineEvent {
  id: string;
  date: string;
  type: 'appointment' | 'prescription' | 'lab_result' | 'vitals';
  typeLabelAr: string;
  title: string;
  description: string;
  doctorName?: string;
  departmentName?: string;
  badgeClass: string;
  icon: string;
  rawItem?: any;
}

@Injectable({
  providedIn: 'root'
})
export class EmrService {
  private readonly db = inject(MockDatabaseService);

  // Common ICD-10 Diagnostic Codes Catalog
  readonly icdCatalog: DiagnosticCode[] = [
    { code: 'I10', descriptionAr: 'ارتفاع ضغط الدم الشرياني الأولي', descriptionEn: 'Essential (primary) hypertension' },
    { code: 'E11.9', descriptionAr: 'السكري من النوع الثاني بدون مضاعفات', descriptionEn: 'Type 2 diabetes mellitus without complications' },
    { code: 'E11.2', descriptionAr: 'السكري من النوع الثاني مع اعتلال كلوي', descriptionEn: 'Type 2 diabetes mellitus with renal complications' },
    { code: 'J06.9', descriptionAr: 'عدوى حادة بالجهاز التنفسي العلوي', descriptionEn: 'Acute upper respiratory infection, unspecified' },
    { code: 'J45.9', descriptionAr: 'الربو الشعبي غير المحدد', descriptionEn: 'Asthma, unspecified' },
    { code: 'M54.5', descriptionAr: 'ألم أسفل الظهر الحاد / عرق النسا', descriptionEn: 'Low back pain / Lumbago' },
    { code: 'M17.9', descriptionAr: 'فُصال عظمي بالركبة (خشونة الركبة)', descriptionEn: 'Osteoarthritis of knee, unspecified' },
    { code: 'K21.9', descriptionAr: 'ارتجاع المريء المعدي (GERD)', descriptionEn: 'Gastro-esophageal reflux disease' },
    { code: 'K29.7', descriptionAr: 'التهاب المعدة غير المحدد', descriptionEn: 'Gastritis, unspecified' },
    { code: 'L20.9', descriptionAr: 'التهاب الجلد التأتبي (الإكزيما)', descriptionEn: 'Atopic dermatitis, unspecified' },
    { code: 'L70.0', descriptionAr: 'حب الشباب الشائع (Acne Vulgaris)', descriptionEn: 'Acne vulgaris' },
    { code: 'K02.9', descriptionAr: 'تسوس الأسنان غير المحدد', descriptionEn: 'Dental caries, unspecified' },
    { code: 'K05.3', descriptionAr: 'التهاب دواعم السن المزمن (Periodontitis)', descriptionEn: 'Chronic periodontitis' },
    { code: 'E78.0', descriptionAr: 'فرط كولسترول الدم الأولي', descriptionEn: 'Pure hypercholesterolemia' },
    { code: 'D50.9', descriptionAr: 'فقر الدم بنقص الحديد (الأنيميا)', descriptionEn: 'Iron deficiency anemia, unspecified' }
  ];

  /**
   * Computes BMI and risk category
   */
  calculateBmi(weightKg: number, heightCm: number): BmiAnalysis | null {
    if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) {
      return null;
    }
    const heightM = heightCm / 100;
    const bmi = Number((weightKg / (heightM * heightM)).toFixed(1));

    if (bmi < 18.5) {
      return {
        bmi,
        categoryEn: 'underweight',
        categoryAr: 'نقص في الوزن (Underweight)',
        badgeClass: 'badge bg-warning text-dark',
        recommendation: 'يُنصح بمراجعة أخصائي التغذية لزيادة الكتلة العضلية والوزن الصحي.'
      };
    } else if (bmi <= 24.9) {
      return {
        bmi,
        categoryEn: 'normal',
        categoryAr: 'وزن مثالي وطبيعي (Normal)',
        badgeClass: 'badge bg-success',
        recommendation: 'مستوى مثالي. الحفاظ على النشاط البدني المتوازن والنظام الغذائي الصحي.'
      };
    } else if (bmi <= 29.9) {
      return {
        bmi,
        categoryEn: 'overweight',
        categoryAr: 'وزن زائد (Overweight)',
        badgeClass: 'badge bg-info text-dark',
        recommendation: 'يُوصى بممارسة الرياضة الهوائية لمدة 150 دقيقة أسبوعياً وضبط السعرات.'
      };
    } else if (bmi <= 34.9) {
      return {
        bmi,
        categoryEn: 'obese-1',
        categoryAr: 'سمنة من الدرجة الأولى (Obese I)',
        badgeClass: 'badge bg-warning text-dark',
        recommendation: 'خطة علاجية لخفض الوزن وتقليل عوامل الخطر على القلب والمفاصل.'
      };
    } else {
      return {
        bmi,
        categoryEn: 'obese-severe',
        categoryAr: 'سمنة مفرطة (Severe Obesity)',
        badgeClass: 'badge bg-danger',
        recommendation: 'متابعة طبية دقيقة لتقييم متلازمة الأيض وتدخل علاجي وتغذوي متكامل.'
      };
    }
  }

  /**
   * Comprehensive Drug-Drug Interaction Checker Matrix
   */
  checkDrugInteractions(
    candidateGenericNames: string[],
    patientCurrentMedications: string[] = [],
    patientAllergies: string[] = [],
    patientChronicDiseases: string[] = []
  ): DrugInteractionAlert[] {
    const alerts: DrugInteractionAlert[] = [];
    const allMeds = [...candidateGenericNames, ...patientCurrentMedications].map(m => m.toLowerCase());
    const allergies = patientAllergies.map(a => a.toLowerCase());
    const chronic = patientChronicDiseases.map(c => c.toLowerCase());

    const hasMed = (keyword: string) => allMeds.some(m => m.includes(keyword.toLowerCase()));
    const hasCand = (keyword: string) => candidateGenericNames.some(m => m.toLowerCase().includes(keyword.toLowerCase()));
    const hasAllergy = (keyword: string) => allergies.some(a => a.includes(keyword.toLowerCase()));
    const hasChronic = (keyword: string) => chronic.some(c => c.includes(keyword.toLowerCase()));

    // 1. Critical Allergy Alert: Penicillin vs Beta-Lactams
    if (hasAllergy('بنسلين') || hasAllergy('penicillin')) {
      if (hasCand('amoxicillin') || hasCand('augmentin') || hasCand('clavulanic') || hasCand('penicillin') || hasCand('ampicillin')) {
        alerts.push({
          severity: 'severe',
          drugA: 'حساسية البنسلين المسجلة للمريض',
          drugB: 'Amoxicillin / Augmentin',
          descriptionAr: 'خطر حدوث صدمة حساسية حادة مهددة للحياة (Severe Anaphylactic Shock) مع تورم مجرى التنفس وهبوط الدورة الدموية.',
          actionRecommendation: 'إيقاف هذا الدواء فوراً واستبداله بمضاد حيوي من عائلة الماكروليد (Macrolide) مثل أزيثرومايسين.'
        });
      }
    }

    // 2. Critical Allergy Alert: Aspirin / NSAIDs
    if (hasAllergy('أسبرين') || hasAllergy('aspirin') || hasAllergy('nsaid')) {
      if (hasCand('aspirin') || hasCand('acetylsalicylic') || hasCand('diclofenac') || hasCand('cataflam') || hasCand('ibuprofen')) {
        alerts.push({
          severity: 'severe',
          drugA: 'حساسية الأسبرين ومضادات الالتهاب',
          drugB: 'NSAIDs / Diclofenac / Aspirin',
          descriptionAr: 'خطر تفاعل تحسسي وتشنج قصبي حاد (Bronchospasm / Samter Triad).',
          actionRecommendation: 'استبدال المسكن بالباراسيتامول الآمن.'
        });
      }
    }

    // 3. Chronic Contraindication: Asthma vs Non-selective Beta Blockers
    if (hasChronic('ربو') || hasChronic('asthma') || hasChronic('صدر')) {
      if (hasCand('bisoprolol') || hasCand('concor') || hasCand('propranolol') || hasCand('atenolol')) {
        alerts.push({
          severity: 'moderate',
          drugA: 'مرض الربو الشعبي المزمن للمريض',
          drugB: 'مضادات بيتا (Concor / Bisoprolol)',
          descriptionAr: 'احتمال حدوث تقلص وتضيق في القصبات الهوائية (Bronchoconstriction) وتفاقم نوبات ضيق التنفس.',
          actionRecommendation: 'التنسيق مع استشاري الصدر واختيار خافض ضغط بديل مثل ACEI أو حاصرات قنوات الكالسيوم (CCB).'
        });
      }
    }

    // 4. Warfarin + Aspirin or NSAIDs (Diclofenac, Ibuprofen)
    if (hasMed('warfarin') && (hasMed('aspirin') || hasMed('acetylsalicylic') || hasMed('diclofenac') || hasMed('cataflam') || hasMed('ibuprofen'))) {
      alerts.push({
        severity: 'severe',
        drugA: 'Warfarin (مضاد تخثر)',
        drugB: 'Aspirin / NSAIDs (مسكنات غير ستيرويدية)',
        descriptionAr: 'خطر شديد لحدوث نزيف معدي أو معوي وتثبيط تراكم الصفائح الدموية بالتزامن مع سيولة الدم.',
        actionRecommendation: 'تجنب الجمع واستبدال المسكن بالباراسيتامول الآمن، أو مراقبة معدل INR بشكل عاجل.'
      });
    }

    // 5. Metformin + Iodinated Contrast (or dehydration risk)
    if (hasMed('metformin') && (hasMed('contrast') || hasMed('iodine'))) {
      alerts.push({
        severity: 'severe',
        drugA: 'Metformin',
        drugB: 'صباغ الأشعة اليودية',
        descriptionAr: 'خطر حدوث حماض لاكتيكي (Lactic Acidosis) واعتلال كلوي حاد.',
        actionRecommendation: 'إيقاف الميتفورمين قبل الفحص الإشعاعي بـ 48 ساعة وإعادة تقييم وظائف الكلى.'
      });
    }

    // 6. Ciprofloxacin + Theophylline / QT prolongation agents
    if (hasMed('ciprofloxacin') && (hasMed('theophylline') || hasMed('azithromycin') || hasMed('clarithromycin'))) {
      alerts.push({
        severity: 'moderate',
        drugA: 'Ciprofloxacin',
        drugB: 'Macrolides / Theophylline',
        descriptionAr: 'احتمال استطالة فترة QT وتسمم بالثيوفيللين نتيجة تثبيط إنزيمات الكبد السيتوكروم.',
        actionRecommendation: 'تعديل الجرعة وتخطيط كهربية القلب (ECG) الدوري.'
      });
    }

    // 7. ACE inhibitors (e.g. Captopril, Enalapril) + Spironolactone / Potassium
    if ((hasMed('captopril') || hasMed('enalapril') || hasMed('lisinopril') || hasMed('ramipril')) && (hasMed('spironolactone') || hasMed('potassium'))) {
      alerts.push({
        severity: 'moderate',
        drugA: 'ACE Inhibitor',
        drugB: 'Potassium / Spironolactone',
        descriptionAr: 'خطر حدوث فرط بوتاسيوم الدم (Hyperkalemia) المهدد لوظائف القلب.',
        actionRecommendation: 'متابعة أملاح الدم والشوارد (Serum Electrolytes) أسبوعياً.'
      });
    }

    // 8. Dual NSAID therapy (e.g. Diclofenac + Ketoprofen or Aspirin)
    if (hasMed('diclofenac') && hasMed('aspirin')) {
      alerts.push({
        severity: 'moderate',
        drugA: 'Diclofenac (Cataflam/Voltaren)',
        drugB: 'Aspirin (Aspocid)',
        descriptionAr: 'مضاعفة الآثار الجانبية على الغشاء المخاطي للمعدة بدون فائدة علاجية إضافية.',
        actionRecommendation: 'إلغاء أحدهما واستخدام دواء وقاية للمعدة مثل أوميبرازول.'
      });
    }

    return alerts;
  }

  /**
   * Builds a chronological history timeline for a patient
   */
  getPatientTimeline(patientId: string): PatientTimelineEvent[] {
    const events: PatientTimelineEvent[] = [];

    // Appointments
    const appointments = this.db.appointments.query(a => a.patientId === patientId);
    appointments.forEach(apt => {
      events.push({
        id: 'timeline_apt_' + apt.id,
        date: apt.date + ' ' + (apt.timeSlot || '00:00'),
        type: 'appointment',
        typeLabelAr: 'كشف / استشارة',
        title: `${apt.departmentArabic} - ${apt.doctorName}`,
        description: apt.intake?.symptoms || 'كشف روتيني',
        doctorName: apt.doctorName,
        departmentName: apt.departmentArabic,
        badgeClass: apt.status === 'completed' ? 'bg-success' : 'bg-primary',
        icon: 'bi-calendar2-check',
        rawItem: apt
      });

      // Vitals event if recorded
      if (apt.vitals && apt.vitals.systolicBp) {
        events.push({
          id: 'timeline_vit_' + apt.id,
          date: apt.vitals.measuredAt || apt.date,
          type: 'vitals',
          typeLabelAr: 'علامات حيوية',
          title: `ضغط الدم: ${apt.vitals.systolicBp}/${apt.vitals.diastolicBp} mmHg - نبض: ${apt.vitals.pulseRate} bpm`,
          description: `سكر: ${apt.vitals.bloodGlucose || '-'} mg/dL | حرارة: ${apt.vitals.temperature}°C | BMI: ${apt.vitals.bmi || '-'} (${apt.vitals.bmiCategoryAr || '-'})`,
          badgeClass: 'bg-info text-dark',
          icon: 'bi-activity',
          rawItem: apt.vitals
        });
      }
    });

    // Prescriptions
    const prescriptions = this.db.prescriptions.query(p => p.patientId === patientId);
    prescriptions.forEach(rx => {
      const itemsList = rx.items.map(i => `${i.tradeName} (${i.dosage})`).join('، ');
      events.push({
        id: 'timeline_rx_' + rx.id,
        date: rx.issuedAt,
        type: 'prescription',
        typeLabelAr: 'روشتة إلكترونية E-Rx',
        title: `روشتة برقم ${rx.prescriptionNumber} - عيادة ${rx.departmentArabic}`,
        description: `الأدوية الموصوفة: ${itemsList}. ${rx.clinicalNotes ? 'ملاحظات: ' + rx.clinicalNotes : ''}`,
        doctorName: rx.doctorName,
        badgeClass: rx.isDispensed ? 'bg-teal text-white' : 'bg-warning text-dark',
        icon: 'bi-prescription2',
        rawItem: rx
      });
    });

    // Lab orders
    const labOrders = this.db.labOrders.query(l => l.patientId === patientId);
    labOrders.forEach(lab => {
      const tests = lab.items.map(t => t.testNameAr).join('، ');
      events.push({
        id: 'timeline_lab_' + lab.id,
        date: lab.resultsCompletedAt || lab.orderedAt,
        type: 'lab_result',
        typeLabelAr: 'فحوصات مخبرية',
        title: `فحص معملي ${lab.orderNumber} (${lab.status === 'ready' ? 'النتائج جاهزة' : 'قيد المعالجة'})`,
        description: tests,
        doctorName: lab.doctorName,
        badgeClass: lab.status === 'ready' ? 'bg-indigo text-white' : 'bg-secondary',
        icon: 'bi-eyedropper',
        rawItem: lab
      });
    });

    // Sort descending by date
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return events;
  }
}
