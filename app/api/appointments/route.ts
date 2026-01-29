import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// DELETE - Randevu silme
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get('id');
    const adminEmail = searchParams.get('adminEmail');

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Randevu ID gerekli' },
        { status: 400 }
      );
    }

    // Randevuyu sil
    await adminDb.collection('appointments').doc(appointmentId).delete();

    // Log kaydı oluştur
    await adminDb.collection('appointmentLogs').add({
      appointmentId,
      action: 'deleted',
      adminEmail: adminEmail || 'unknown',
      timestamp: new Date(),
      metadata: {
        deletedAt: new Date().toISOString(),
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Randevu başarıyla silindi' 
    });
  } catch (error: any) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json(
      { error: 'Randevu silinirken hata oluştu', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Randevu durum güncelleme (log ile)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { appointmentId, status, adminEmail } = body;

    if (!appointmentId || !status) {
      return NextResponse.json(
        { error: 'Randevu ID ve durum gerekli' },
        { status: 400 }
      );
    }

    // Randevuyu güncelle
    await adminDb.collection('appointments').doc(appointmentId).update({
      status,
      updatedAt: new Date(),
    });

    // Log kaydı oluştur
    await adminDb.collection('appointmentLogs').add({
      appointmentId,
      action: 'status_changed',
      adminEmail: adminEmail || 'unknown',
      timestamp: new Date(),
      metadata: {
        newStatus: status,
        updatedAt: new Date().toISOString(),
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Randevu durumu güncellendi' 
    });
  } catch (error: any) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: 'Randevu güncellenirken hata oluştu', details: error.message },
      { status: 500 }
    );
  }
}
