import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { userId, userType, newPassword } = await request.json();

    // Validation
    if (!userId || !userType || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Eksik parametreler' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Şifre en az 6 karakter olmalıdır' },
        { status: 400 }
      );
    }

    if (userType === 'barber') {
      // Barber owner - Firebase Auth kullanır
      try {
        // Update Firebase Auth password
        await adminAuth.updateUser(userId, {
          password: newPassword,
        });

        // Also update in Firestore if password is stored there
        await adminDb.collection('barbers').doc(userId).update({
          password: newPassword,
          updatedAt: new Date(),
        });

        return NextResponse.json({
          success: true,
          message: 'Berber şifresi başarıyla güncellendi',
        });
      } catch (error: any) {
        console.error('Error updating barber password:', error);
        return NextResponse.json(
          { success: false, error: error.message || 'Firebase Auth güncellenirken hata oluştu' },
          { status: 500 }
        );
      }
    } else if (userType === 'employee') {
      // Employee - Update both employee_private (hashed) and employees (plain text for legacy)
      try {
        const crypto = require('crypto');
        
        // Hash the password
        const salt = crypto.randomBytes(32).toString('hex');
        const hash = crypto.pbkdf2Sync(
          newPassword, 
          salt, 
          100000, 
          64, 
          'sha512'
        ).toString('hex');

        // Update employee_private with hashed password
        await adminDb.collection('employee_private').doc(userId).set({
          passwordHash: hash,
          passwordSalt: salt,
          updatedAt: new Date(),
        }, { merge: true });

        // Also update employees collection (plain text for legacy/backup)
        await adminDb.collection('employees').doc(userId).update({
          password: newPassword,
          updatedAt: new Date(),
        });

        return NextResponse.json({
          success: true,
          message: 'Çalışan şifresi başarıyla güncellendi',
        });
      } catch (error: any) {
        console.error('Error updating employee password:', error);
        return NextResponse.json(
          { success: false, error: error.message || 'Firestore güncellenirken hata oluştu' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Geçersiz kullanıcı tipi' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error in reset-password API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}
