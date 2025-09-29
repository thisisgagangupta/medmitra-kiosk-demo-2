// Mock services for MedMitra AI Kiosk - Frontend only

export interface MockAppointment {
  id: string;
  patientFirstName: string;
  doctorName: string;
  time: string;
  status: 'Paid' | 'Unpaid';
  amount?: number;
}

export interface MockPatient {
  id: string;
  name: string;
  mobile: string;
  yearOfBirth: number;
  gender?: 'Male' | 'Female' | 'Other';
  hasCaregiver: boolean;
}

export interface MockToken {
  id: string;
  number: string;
  queuePosition: number;
  estimatedTime: string;
  confidence: number; // 0-100%
}

export interface MockQueueItem {
  tokenNumber: string;
  estimatedTime: string;
  status: 'Now' | 'Next' | 'Waiting';
}

export interface MockLabTest {
  id: string;
  name: string;
  price: number;
  ordered: boolean;
}

// Mock Authentication Service
export class MockAuthService {
  static async sendOTP(phone: string): Promise<{ success: boolean; message: string }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (phone.length < 10) {
      return { success: false, message: 'Invalid phone number' };
    }
    
    return { success: true, message: 'OTP sent successfully' };
  }

  static async verifyOTP(phone: string, code: string): Promise<{ success: boolean; appointment?: MockAppointment }> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (code === '1234' || code === '0000') {
      return {
        success: true,
        appointment: {
          id: 'APT001',
          patientFirstName: 'Priya',
          doctorName: 'Dr. Sharma',
          time: '2:30 PM',
          status: 'Paid'
        }
      };
    }
    
    if (code === '5678') {
      return {
        success: true,
        appointment: {
          id: 'APT002',
          patientFirstName: 'Rahul',
          doctorName: 'Dr. Patel',
          time: '3:00 PM',
          status: 'Unpaid',
          amount: 500
        }
      };
    }
    
    return { success: false };
  }
}

// Mock Appointment Service
export class MockAppointmentService {
  static async lookupByQR(qrData: string): Promise<{ success: boolean; appointment?: MockAppointment }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (qrData.includes('APT001')) {
      return {
        success: true,
        appointment: {
          id: 'APT001',
          patientFirstName: 'Priya',
          doctorName: 'Dr. Sharma',
          time: '2:30 PM',
          status: 'Paid'
        }
      };
    }
    
    return { success: false };
  }

  static async lookupByPhone(phone: string): Promise<{ success: boolean; appointment?: MockAppointment }> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Mock lookup based on phone
    if (phone.endsWith('1234')) {
      return {
        success: true,
        appointment: {
          id: 'APT003',
          patientFirstName: 'Anjali',
          doctorName: 'Dr. Gupta',
          time: '4:15 PM',
          status: 'Unpaid',
          amount: 750
        }
      };
    }
    
    return { success: false };
  }
}

// Mock Billing Service
export class MockBillingService {
  static async pay(invoiceId: string, amount: number): Promise<{ success: boolean; transactionId?: string; message: string }> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate 90% success rate
    if (Math.random() > 0.1) {
      return {
        success: true,
        transactionId: `TXN${Date.now()}`,
        message: 'Payment successful'
      };
    }
    
    return {
      success: false,
      message: 'Payment failed. Please try again or contact support.'
    };
  }
}

// Mock Queue Service
export class MockQueueService {
  static subscribe(tokenId: string, callback: (position: number, eta: string) => void): () => void {
    let position = Math.floor(Math.random() * 5) + 1;
    
    const interval = setInterval(() => {
      if (position > 0) {
        position = Math.max(0, position - Math.random() < 0.3 ? 1 : 0);
        const eta = position === 0 ? 'Now!' : `${position * 5}-${(position + 1) * 5} min`;
        callback(position, eta);
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }

  static async getCurrentQueue(): Promise<MockQueueItem[]> {
    return [
      { tokenNumber: 'A23', estimatedTime: 'Now', status: 'Now' },
      { tokenNumber: 'A24', estimatedTime: '5 min', status: 'Next' },
      { tokenNumber: 'A25', estimatedTime: '10-15 min', status: 'Waiting' },
      { tokenNumber: 'A26', estimatedTime: '15-20 min', status: 'Waiting' },
      { tokenNumber: 'A27', estimatedTime: '20-25 min', status: 'Waiting' },
    ];
  }
}

// Mock Print Service
export class MockPrintService {
  static async printToken(token: MockToken): Promise<{ success: boolean; message: string }> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('🖨️ Printing Token:', token);
    return { success: true, message: 'Token printed successfully' };
  }

  static async printReceipt(transactionId: string, amount: number): Promise<{ success: boolean; message: string }> {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    console.log('🖨️ Printing Receipt:', { transactionId, amount });
    return { success: true, message: 'Receipt printed successfully' };
  }
}

// Mock Lab Service
export class MockLabService {
  static async getOrderedTests(appointmentId: string): Promise<MockLabTest[]> {
    return [
      { id: 'LAB001', name: 'Complete Blood Count (CBC)', price: 300, ordered: true },
      { id: 'LAB002', name: 'Lipid Profile', price: 450, ordered: true },
      { id: 'LAB003', name: 'Thyroid Function Test', price: 600, ordered: false },
    ];
  }
}

// Generate mock token
export const generateMockToken = (): MockToken => ({
  id: `TOKEN${Date.now()}`,
  number: `A${Math.floor(Math.random() * 900) + 100}`,
  queuePosition: Math.floor(Math.random() * 8) + 1,
  estimatedTime: `${Math.floor(Math.random() * 20) + 5}-${Math.floor(Math.random() * 20) + 15} min`,
  confidence: Math.floor(Math.random() * 30) + 70
});