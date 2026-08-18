package com.safesphere.nativeapp.data.entity;

import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "alerts")
public class AlertEntity {
    @PrimaryKey
    public String id;
    public String district;
    public String severity; // critical, warning, info
    public String message;
    public String channel; // sms, push, whatsapp, siren, radio
    public String status; // sent, pending, failed
    public String acknowledgedBy;
    public String acknowledgedAt;
    public String createdAt;
    public String expiresAt;
    public boolean isDuplicate = false;
    public String originalAlertId;
    public String language;
    public String translatedMessage;
    public int unacknowledgedCount = 0;
}