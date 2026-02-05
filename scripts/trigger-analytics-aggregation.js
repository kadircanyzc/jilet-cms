/**
 * Manual trigger for analytics aggregation
 * Run this to aggregate analytics_events_raw into analytics_daily
 * 
 * Usage: node scripts/trigger-analytics-aggregation.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function aggregateDailyAnalytics() {
  console.log('📊 Starting manual analytics aggregation...');

  try {
    // Dünün tarihini hesapla (veya bugünü test için kullan)
    const targetDate = new Date();
    // targetDate.setDate(targetDate.getDate() - 1); // Dün için
    targetDate.setHours(0, 0, 0, 0);

    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const targetDateString = targetDate.toISOString().split('T')[0]; // "2025-12-30"

    console.log(`📅 Aggregating data for: ${targetDateString}`);

    // 1. Hedef günün tüm event'lerini çek
    const eventsSnapshot = await db
      .collection('analytics_events_raw')
      .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(targetDate))
      .where('timestamp', '<', admin.firestore.Timestamp.fromDate(nextDate))
      .get();

    console.log(`📦 Found ${eventsSnapshot.size} events`);

    if (eventsSnapshot.empty) {
      console.log('⚠️  No events found for target date');
      
      // Check if there are any events at all
      const allEventsSnapshot = await db
        .collection('analytics_events_raw')
        .limit(10)
        .get();
      
      console.log(`\n📊 Total events in database: ${allEventsSnapshot.size}`);
      
      if (!allEventsSnapshot.empty) {
        console.log('\n📝 Sample events:');
        allEventsSnapshot.forEach(doc => {
          const data = doc.data();
          console.log(`  - ${data.event_name} at ${data.timestamp?.toDate?.()}`);
        });
      }
      
      return null;
    }

    const events = eventsSnapshot.docs.map(doc => doc.data());

    // 2. Metrikleri hesapla
    const metrics = {
      total_sessions: new Set(events.map(e => e.user?.session_id).filter(Boolean)).size,
      total_bookings: events.filter(e => e.event_name === 'booking_confirmed').length,

      booking_funnel: {
        sessions: new Set(
          events
            .filter(e => e.event_name === 'app_session_started')
            .map(e => e.user?.session_id)
            .filter(Boolean)
        ).size,
        profile_views: events.filter(e => e.event_name === 'barber_profile_opened').length,
        booking_initiated: events.filter(e => e.event_name === 'booking_initiated').length,
        slot_picker_loaded: events.filter(e => e.event_name === 'slot_picker_loaded').length,
        booking_confirmed: events.filter(e => e.event_name === 'booking_confirmed').length
      },

      bookings_by_barber: {},
      bookings_by_service: {},
      avg_booking_value: 0,
      slot_unavailable_count: events.filter(e => e.event_name === 'slot_unavailable_shown').length,
      abandonment_steps: {},
      favorites_added: events.filter(e => e.event_name === 'favorite_added').length
    };

    // Berber bazında booking sayıları
    events.filter(e => e.event_name === 'booking_confirmed').forEach(e => {
      const barberId = e.barber?.id || e.barber_id;
      if (barberId) {
        metrics.bookings_by_barber[barberId] = (metrics.bookings_by_barber[barberId] || 0) + 1;
      }

      const serviceId = e.service?.id || e.service_id;
      if (serviceId) {
        metrics.bookings_by_service[serviceId] = (metrics.bookings_by_service[serviceId] || 0) + 1;
      }

      const price = e.service?.price || e.price || 0;
      metrics.avg_booking_value += price;
    });

    if (metrics.total_bookings > 0) {
      metrics.avg_booking_value = metrics.avg_booking_value / metrics.total_bookings;
    }

    // Vazgeçme adımları
    events.filter(e => e.event_name === 'booking_abandoned').forEach(e => {
      const step = e.last_step || 'unknown';
      metrics.abandonment_steps[step] = (metrics.abandonment_steps[step] || 0) + 1;
    });

    // 3. Günlük aggregate'i kaydet
    await db.collection('analytics_daily').doc(targetDateString).set(metrics);
    console.log(`✅ Saved daily metrics to analytics_daily/${targetDateString}`);

    // 4. Berber bazında aggregate'leri kaydet
    const barberProfileViews = {};
    events.filter(e => e.event_name === 'barber_profile_opened').forEach(e => {
      const barberId = e.barber?.id || e.barber_id;
      if (barberId) {
        barberProfileViews[barberId] = (barberProfileViews[barberId] || 0) + 1;
      }
    });

    const barberFavorites = {};
    events.filter(e => e.event_name === 'favorite_added').forEach(e => {
      const barberId = e.barber?.id || e.barber_id;
      if (barberId) {
        barberFavorites[barberId] = (barberFavorites[barberId] || 0) + 1;
      }
    });

    const barberPromises = Object.entries(metrics.bookings_by_barber).map(async ([barberId, bookings]) => {
      const profileViews = barberProfileViews[barberId] || 0;
      const favorites = barberFavorites[barberId] || 0;

      const revenue = events
        .filter(e => e.event_name === 'booking_confirmed' && (e.barber?.id === barberId || e.barber_id === barberId))
        .reduce((sum, e) => sum + (e.service?.price || e.price || 0), 0);

      await db
        .collection('analytics_barber_daily')
        .doc(`${barberId}_${targetDateString}`)
        .set({
          date: targetDateString,
          barber_id: barberId,
          profile_views: profileViews,
          bookings: bookings,
          revenue: revenue,
          conversion_rate: profileViews > 0 ? (bookings / profileViews) : 0,
          favorites_added: favorites
        });
    });

    await Promise.all(barberPromises);
    console.log(`✅ Saved ${barberPromises.length} barber metrics`);

    console.log('\n🎉 Analytics aggregation completed successfully');
    console.log('\n📊 Summary:');
    console.log(`  - Date: ${targetDateString}`);
    console.log(`  - Events processed: ${events.length}`);
    console.log(`  - Sessions: ${metrics.total_sessions}`);
    console.log(`  - Profile views: ${metrics.booking_funnel.profile_views}`);
    console.log(`  - Bookings initiated: ${metrics.booking_funnel.booking_initiated}`);
    console.log(`  - Slots loaded: ${metrics.booking_funnel.slot_picker_loaded}`);
    console.log(`  - Bookings confirmed: ${metrics.booking_funnel.booking_confirmed}`);
    console.log(`  - Favorites added: ${metrics.favorites_added}`);
    console.log(`  - Barbers with bookings: ${barberPromises.length}`);

    return {
      date: targetDateString,
      events_processed: events.length,
      barbers_updated: barberPromises.length
    };

  } catch (error) {
    console.error('❌ Error in analytics aggregation:', error);
    throw error;
  }
}

// Run the aggregation
aggregateDailyAnalytics()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });
