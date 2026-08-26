package com.safesphere.nativeapp.push;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import com.safesphere.nativeapp.R;
import com.safesphere.nativeapp.ui.main.MainActivity;
import com.safesphere.nativeapp.ui.citizen.SosFragment;
import com.safesphere.nativeapp.ui.admin.TriageDashboardFragment;

import java.util.Map;

/**
 * Handles FCM messages (data + notification payloads) and shows local notifications.
 * Works even when app is in background or killed.
 */
public class SafeSphereMessagingService extends FirebaseMessagingService {

    private static final String CHANNEL_SOS = "sos_alerts";
    private static final String CHANNEL_TRIAGE = "triage_alerts";
    private static final String CHANNEL_GENERAL = "general_alerts";

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannels();
    }

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        // Send token to your backend for targeting
        // TokenManager.getInstance().sendTokenToServer(token);
    }

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        // Data payload always delivered here (foreground + background)
        Map<String, String> data = remoteMessage.getData();
        String type = data.get("type");
        String title = data.get("title");
        String body = data.get("body");
        String clickAction = data.get("click_action");
        String reportId = data.get("report_id");
        String sosId = data.get("sos_id");

        if (type == null) return;

        switch (type) {
            case "sos_alert":
                showSosNotification(title, body, sosId);
                break;
            case "triage_alert":
                showTriageNotification(title, body, reportId);
                break;
            case "general":
            default:
                showGeneralNotification(title, body, clickAction);
                break;
        }
    }

    private void showSosNotification(String title, String body, String sosId) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.setAction("OPEN_SOS");
        if (sosId != null) intent.putExtra("sos_id", sosId);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_SOS)
                .setSmallIcon(R.drawable.ic_sos)
                .setContentTitle(title != null ? title : "SOS Alert")
                .setContentText(body != null ? body : "Emergency SOS received")
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setAutoCancel(true)
                .setFullScreenIntent(pendingIntent, true)
                .setContentIntent(pendingIntent)
                .setVibrate(new long[]{0, 500, 200, 500})
                .setDefaults(NotificationCompat.DEFAULT_ALL);

        NotificationManagerCompat.from(this).notify((int) System.currentTimeMillis(), builder.build());
    }

    private void showTriageNotification(String title, String body, String reportId) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.setAction("OPEN_TRIAGE");
        if (reportId != null) intent.putExtra("report_id", reportId);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 1, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_TRIAGE)
                .setSmallIcon(R.drawable.ic_alerts)
                .setContentTitle(title != null ? title : "High-Severity Report")
                .setContentText(body != null ? body : "New critical report requires attention")
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_RECOMMENDATION)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .setDefaults(NotificationCompat.DEFAULT_SOUND | NotificationCompat.DEFAULT_VIBRATE);

        NotificationManagerCompat.from(this).notify(2, builder.build());
    }

    private void showGeneralNotification(String title, String body, String action) {
        Intent intent = new Intent(this, MainActivity.class);
        if (action != null) intent.putExtra("action", action);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 2, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_GENERAL)
                .setSmallIcon(R.drawable.ic_alerts)
                .setContentTitle(title != null ? title : "SafeSphere")
                .setContentText(body != null ? body : "New update available")
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .setDefaults(NotificationCompat.DEFAULT_ALL);

        NotificationManagerCompat.from(this).notify(3, builder.build());
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getSystemService(NotificationManager.class);

            NotificationChannel sosChannel = new NotificationChannel(
                    CHANNEL_SOS, "SOS Emergency Alerts", NotificationManager.IMPORTANCE_MAX);
            sosChannel.setDescription("Critical SOS alerts from the field");
            sosChannel.enableVibration(true);
            sosChannel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
            manager.createNotificationChannel(sosChannel);

            NotificationChannel triageChannel = new NotificationChannel(
                    CHANNEL_TRIAGE, "Triage Alerts", NotificationManager.IMPORTANCE_HIGH);
            triageChannel.setDescription("High-severity report triage notifications");
            triageChannel.enableVibration(true);
            manager.createNotificationChannel(triageChannel);

            NotificationChannel generalChannel = new NotificationChannel(
                    CHANNEL_GENERAL, "General Updates", NotificationManager.IMPORTANCE_DEFAULT);
            generalChannel.setDescription("General app updates and announcements");
            manager.createNotificationChannel(generalChannel);
        }
    }
}